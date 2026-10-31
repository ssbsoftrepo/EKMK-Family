package com.ekmk.familytree.service;

import com.ekmk.familytree.dto.FamilyStatsDto;
import com.ekmk.familytree.model.FamilyBranch;
import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.repository.FamilyBranchRepository;
import com.ekmk.familytree.repository.FamilyMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FamilyMemberService {

    private final FamilyMemberRepository memberRepository;
    private final FamilyBranchRepository branchRepository;

    public FamilyMemberService(FamilyMemberRepository memberRepository,
                               FamilyBranchRepository branchRepository) {
        this.memberRepository = memberRepository;
        this.branchRepository = branchRepository;
    }

    public List<FamilyMember> getAllMembers() {
        return memberRepository.findAll();
    }

    public List<FamilyMember> searchMembers(String query, String branchId, Integer generation, String gender, Boolean isDeceased) {
        List<FamilyMember> all = memberRepository.findAll();
        return all.stream().filter(m -> {
            if (query != null && !query.trim().isEmpty()) {
                String q = query.toLowerCase().trim();
                boolean matches = (m.getFullName() != null && m.getFullName().toLowerCase().contains(q)) ||
                                  (m.getTamilName() != null && m.getTamilName().toLowerCase().contains(q)) ||
                                  (m.getProfession() != null && m.getProfession().toLowerCase().contains(q)) ||
                                  (m.getBusiness() != null && m.getBusiness().toLowerCase().contains(q)) ||
                                  (m.getCurrentCity() != null && m.getCurrentCity().toLowerCase().contains(q)) ||
                                  (m.getBirthPlace() != null && m.getBirthPlace().toLowerCase().contains(q)) ||
                                  (m.getBranchName() != null && m.getBranchName().toLowerCase().contains(q)) ||
                                  (m.getBranchNameTamil() != null && m.getBranchNameTamil().toLowerCase().contains(q));
                if (!matches) return false;
            }
            if (branchId != null && !branchId.trim().isEmpty()) {
                if (!branchId.equalsIgnoreCase(m.getBranchId())) return false;
            }
            if (generation != null) {
                if (m.getGeneration() != generation) return false;
            }
            if (gender != null && !gender.trim().isEmpty()) {
                if (!gender.equalsIgnoreCase(m.getGender())) return false;
            }
            if (isDeceased != null) {
                if (m.isDeceased() != isDeceased) return false;
            }
            return true;
        }).toList();
    }

    public Optional<FamilyMember> getMemberById(String id) {
        return memberRepository.findById(id);
    }

    public FamilyMember createMember(FamilyMember member) {
        if (member.getId() == null || member.getId().trim().isEmpty()) {
            String newId;
            do {
                newId = "ekmk-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            } while (memberRepository.existsById(newId));
            member.setId(newId);
        }

        if (member.isDeceased() && member.getBirthDate() != null && member.getDeathDate() != null) {
            if (member.getDeathDate().compareTo(member.getBirthDate()) < 0) {
                throw new IllegalArgumentException("Date of demise cannot be earlier than date of birth");
            }
        }

        if (member.getSpouseIds() == null) {
            member.setSpouseIds(new ArrayList<>());
        }
        if (member.getChildIds() == null) {
            member.setChildIds(new ArrayList<>());
        }
        if (member.getTags() == null) {
            member.setTags(new ArrayList<>());
        }
        if (member.getSpouseIds().isEmpty() && member.getSpouseId() != null && !member.getSpouseId().trim().isEmpty()) {
            member.getSpouseIds().add(member.getSpouseId().trim());
        }
        if (!member.getSpouseIds().isEmpty() && (member.getSpouseId() == null || member.getSpouseId().trim().isEmpty())) {
            member.setSpouseId(member.getSpouseIds().get(0));
        }

        List<String> spouseIds = member.getSpouseIds();
        validateKinshipRelations(member.getId(), member.getFatherId(), member.getMotherId(), member.getChildIds(), spouseIds, member.getBirthDate());
        checkOneHusband(member.getId(), member.getGender(), spouseIds, memberRepository::findById);

        // Auto-calculate generation from parent or spouse
        String pId = (member.getFatherId() != null && !member.getFatherId().trim().isEmpty()) ? member.getFatherId() : member.getMotherId();
        if (pId != null && !pId.trim().isEmpty()) {
            memberRepository.findById(pId).ifPresent(parent -> {
                member.setGeneration(parent.getGeneration() + 1);
            });
        } else if (!member.getSpouseIds().isEmpty()) {
            for (String spId : member.getSpouseIds()) {
                memberRepository.findById(spId).ifPresent(sp -> {
                    if (member.getGeneration() <= 0) {
                        member.setGeneration(sp.getGeneration());
                    }
                });
            }
        }

        // Auto-inherit branch from parent or spouse if not explicitly established
        if (member.getBranchId() == null || member.getBranchId().trim().isEmpty() || "root".equals(member.getBranchId())) {
            if (pId != null && !pId.trim().isEmpty()) {
                memberRepository.findById(pId).ifPresent(parent -> {
                    if (parent.getBranchId() != null && !parent.getBranchId().trim().isEmpty() && !"root".equals(parent.getBranchId())) {
                        member.setBranchId(parent.getBranchId());
                        member.setBranchName(parent.getBranchName());
                        member.setBranchNameTamil(parent.getBranchNameTamil());
                    }
                });
            } else if (!member.getSpouseIds().isEmpty()) {
                for (String spId : member.getSpouseIds()) {
                    memberRepository.findById(spId).ifPresent(sp -> {
                        if (sp.getBranchId() != null && !sp.getBranchId().trim().isEmpty() && !"root".equals(sp.getBranchId())) {
                            member.setBranchId(sp.getBranchId());
                            member.setBranchName(sp.getBranchName());
                            member.setBranchNameTamil(sp.getBranchNameTamil());
                        }
                    });
                }
            }
        }

        FamilyMember saved = memberRepository.save(member);
        String newId = saved.getId();

        // If a branch was specified, ensure it exists in branchRepository
        if (saved.getBranchId() != null && !saved.getBranchId().trim().isEmpty()) {
            if (!branchRepository.existsById(saved.getBranchId())) {
                FamilyBranch newBranch = new FamilyBranch(
                    saved.getBranchId(),
                    saved.getBranchName() != null ? saved.getBranchName() : "Family Branch",
                    saved.getBranchNameTamil() != null ? saved.getBranchNameTamil() : saved.getBranchName(),
                    "#702D3B",
                    "bg-heritage-gold-100 text-heritage-gold-900 border-heritage-gold-300",
                    "border-heritage-gold-500",
                    saved.getId(),
                    "Branch established in family archive"
                );
                branchRepository.save(newBranch);
            }
        }

        // Update Father childIds
        if (saved.getFatherId() != null && !saved.getFatherId().trim().isEmpty()) {
            memberRepository.findById(saved.getFatherId()).ifPresent(father -> {
                if (!father.getChildIds().contains(newId)) {
                    father.getChildIds().add(newId);
                    memberRepository.save(father);
                }
            });
        }

        // Update Mother childIds
        if (saved.getMotherId() != null && !saved.getMotherId().trim().isEmpty()) {
            memberRepository.findById(saved.getMotherId()).ifPresent(mother -> {
                if (!mother.getChildIds().contains(newId)) {
                    mother.getChildIds().add(newId);
                    memberRepository.save(mother);
                }
            });
        }

        // Update Spouses reciprocal links (supports multiple wives / multiple husbands / remarriage)
        List<String> spousesToLink = new ArrayList<>();
        if (saved.getSpouseIds() != null && !saved.getSpouseIds().isEmpty()) {
            spousesToLink.addAll(saved.getSpouseIds());
        } else if (saved.getSpouseId() != null && !saved.getSpouseId().trim().isEmpty()) {
            spousesToLink.add(saved.getSpouseId().trim());
        }

        if (!spousesToLink.isEmpty()) {
            for (String spId : spousesToLink) {
                if (spId != null && !spId.trim().isEmpty()) {
                    memberRepository.findById(spId).ifPresent(spouse -> {
                        if (!spouse.getSpouseIds().contains(newId)) {
                            spouse.getSpouseIds().add(newId);
                            spouse.setSpouseId(spouse.getSpouseIds().get(0));
                            memberRepository.save(spouse);
                        }
                    });
                }
            }
        }

        return saved;
    }

    public FamilyMember updateMember(String id, FamilyMember updates) {
        FamilyMember existing = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with id: " + id));

        // Determine target spouses (supports multiple wives / multiple husbands / remarriage)
        List<String> targetSpouseIds = updates.getSpouseIds();
        if (targetSpouseIds == null && updates.getSpouseId() != null) {
            targetSpouseIds = updates.getSpouseId().trim().isEmpty() ? new ArrayList<>() : new ArrayList<>(List.of(updates.getSpouseId().trim()));
        }
        List<String> effectiveSpouseIds = targetSpouseIds != null ? targetSpouseIds : (existing.getSpouseIds() != null ? existing.getSpouseIds() : Collections.emptyList());

        // Validate all kinship relations (parents, spouses, cycles, chronology) BEFORE making any state mutations
        String effectiveFatherId = updates.getFatherId() != null ? (updates.getFatherId().trim().isEmpty() ? null : updates.getFatherId()) : existing.getFatherId();
        String effectiveMotherId = updates.getMotherId() != null ? (updates.getMotherId().trim().isEmpty() ? null : updates.getMotherId()) : existing.getMotherId();
        String effectiveBirthDate = updates.getBirthDate() != null ? updates.getBirthDate() : existing.getBirthDate();
        validateKinshipRelations(id, effectiveFatherId, effectiveMotherId, existing.getChildIds(), effectiveSpouseIds, effectiveBirthDate);
        String effectiveGender = updates.getGender() != null ? updates.getGender() : existing.getGender();
        checkOneHusband(id, effectiveGender, effectiveSpouseIds, memberRepository::findById);

        // Detect father change
        if (updates.getFatherId() != null && !updates.getFatherId().equals(existing.getFatherId())) {
            if (existing.getFatherId() != null) {
                memberRepository.findById(existing.getFatherId()).ifPresent(oldFather -> {
                    oldFather.getChildIds().remove(id);
                    memberRepository.save(oldFather);
                });
            }
            if (!updates.getFatherId().trim().isEmpty()) {
                memberRepository.findById(updates.getFatherId()).ifPresent(newFather -> {
                    if (!newFather.getChildIds().contains(id)) {
                        newFather.getChildIds().add(id);
                        memberRepository.save(newFather);
                    }
                });
            }
            existing.setFatherId(updates.getFatherId().trim().isEmpty() ? null : updates.getFatherId());
        }

        // Detect mother change
        if (updates.getMotherId() != null && !updates.getMotherId().equals(existing.getMotherId())) {
            if (existing.getMotherId() != null) {
                memberRepository.findById(existing.getMotherId()).ifPresent(oldMother -> {
                    oldMother.getChildIds().remove(id);
                    memberRepository.save(oldMother);
                });
            }
            if (!updates.getMotherId().trim().isEmpty()) {
                memberRepository.findById(updates.getMotherId()).ifPresent(newMother -> {
                    if (!newMother.getChildIds().contains(id)) {
                        newMother.getChildIds().add(id);
                        memberRepository.save(newMother);
                    }
                });
            }
            existing.setMotherId(updates.getMotherId().trim().isEmpty() ? null : updates.getMotherId());
        }

        // Reconcile spouse changes only if spouseIds or spouseId was explicitly provided in request
        if (targetSpouseIds != null) {
            List<String> oldSpouseIds = new ArrayList<>(existing.getSpouseIds() != null ? existing.getSpouseIds() : Collections.emptyList());
            // Detach removed spouses
            for (String oldSpId : oldSpouseIds) {
                if (!targetSpouseIds.contains(oldSpId)) {
                    memberRepository.findById(oldSpId).ifPresent(oldSpouse -> {
                        if (oldSpouse.getSpouseIds() != null) {
                            oldSpouse.getSpouseIds().remove(id);
                            if (oldSpouse.getSpouseIds().isEmpty()) {
                                oldSpouse.setSpouseId(null);
                            } else {
                                oldSpouse.setSpouseId(oldSpouse.getSpouseIds().get(0));
                            }
                            memberRepository.save(oldSpouse);
                        }
                    });
                }
            }
            // Link added spouses
            for (String newSpId : targetSpouseIds) {
                if (!oldSpouseIds.contains(newSpId)) {
                    memberRepository.findById(newSpId).ifPresent(newSpouse -> {
                        if (newSpouse.getSpouseIds() == null) {
                            newSpouse.setSpouseIds(new ArrayList<>());
                        }
                        if (!newSpouse.getSpouseIds().contains(id)) {
                            newSpouse.getSpouseIds().add(id);
                            newSpouse.setSpouseId(newSpouse.getSpouseIds().get(0));
                            memberRepository.save(newSpouse);
                        }
                    });
                }
            }
            existing.setSpouseIds(targetSpouseIds);
            if (targetSpouseIds.isEmpty()) {
                existing.setSpouseId(null);
            } else {
                existing.setSpouseId(targetSpouseIds.get(0));
            }
        }

        // Update scalar fields
        if (updates.getFirstName() != null) existing.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) existing.setLastName(updates.getLastName());
        if (updates.getFullName() != null) existing.setFullName(updates.getFullName());
        if (updates.getTamilName() != null) existing.setTamilName(updates.getTamilName());
        if (updates.getGender() != null) existing.setGender(updates.getGender());
        if (updates.getBirthDate() != null) existing.setBirthDate(updates.getBirthDate());
        if (updates.getDeathDate() != null) existing.setDeathDate(updates.getDeathDate());
        if (updates.getIsDeceased() != null) existing.setDeceased(updates.getIsDeceased());
        if (updates.getPhotoUrl() != null) existing.setPhotoUrl(updates.getPhotoUrl());
        if (updates.getCouplePhotoUrl() != null) existing.setCouplePhotoUrl(updates.getCouplePhotoUrl());
        if (updates.getCoupleAbout() != null) existing.setCoupleAbout(updates.getCoupleAbout());
        if (updates.getEducation() != null) existing.setEducation(updates.getEducation());
        if (updates.getProfession() != null) existing.setProfession(updates.getProfession());
        if (updates.getBusiness() != null) existing.setBusiness(updates.getBusiness());
        if (updates.getBirthPlace() != null) existing.setBirthPlace(updates.getBirthPlace());
        if (updates.getCurrentCity() != null) existing.setCurrentCity(updates.getCurrentCity());
        if (updates.getBiography() != null) existing.setBiography(updates.getBiography());
        if (updates.getPhone() != null) existing.setPhone(updates.getPhone());
        if (updates.getEmail() != null) existing.setEmail(updates.getEmail());
        if (updates.getAddress() != null) existing.setAddress(updates.getAddress());
        if (updates.getNotes() != null) existing.setNotes(updates.getNotes());
        if (updates.getNoSpouse() != null) existing.setNoSpouse(updates.getNoSpouse());
        if (updates.getNoChildren() != null) existing.setNoChildren(updates.getNoChildren());
        // Validate death date vs birth date
        boolean isDec = updates.getIsDeceased() != null ? updates.getIsDeceased() : existing.isDeceased();
        String bDate = updates.getBirthDate() != null ? updates.getBirthDate() : existing.getBirthDate();
        String dDate = updates.getDeathDate() != null ? updates.getDeathDate() : existing.getDeathDate();
        if (isDec && bDate != null && dDate != null && !bDate.trim().isEmpty() && !dDate.trim().isEmpty()) {
            if (dDate.compareTo(bDate) < 0) {
                throw new IllegalArgumentException("Date of demise cannot be earlier than date of birth");
            }
        }

        // Auto-recalculate generation if linked to parent
        int oldGen = existing.getGeneration();
        if (existing.getFatherId() != null) {
            memberRepository.findById(existing.getFatherId()).ifPresent(f -> {
                existing.setGeneration(f.getGeneration() + 1);
            });
        } else if (existing.getMotherId() != null) {
            memberRepository.findById(existing.getMotherId()).ifPresent(m -> {
                existing.setGeneration(m.getGeneration() + 1);
            });
        } else if (updates.getGeneration() > 0) {
            existing.setGeneration(updates.getGeneration());
        }

        if (existing.getGeneration() != oldGen && existing.getGeneration() > 0) {
            propagateGenerationToChildren(existing);
        }

        String oldBranchId = existing.getBranchId();
        if (updates.getBranchId() != null) {
            existing.setBranchId(updates.getBranchId());
            if (!updates.getBranchId().trim().isEmpty() && !updates.getBranchId().equals("root")) {
                if (!branchRepository.existsById(updates.getBranchId())) {
                    FamilyBranch newBranch = new FamilyBranch(
                        updates.getBranchId(),
                        updates.getBranchName() != null ? updates.getBranchName() : "Family Branch",
                        updates.getBranchNameTamil() != null ? updates.getBranchNameTamil() : updates.getBranchName(),
                        "#997641",
                        "bg-heritage-gold-100 text-heritage-gold-900 border-heritage-gold-300",
                        "border-heritage-gold-500",
                        existing.getId(),
                        "Branch established in family archive"
                    );
                    branchRepository.save(newBranch);
                } else if (updates.getBranchName() != null) {
                    branchRepository.findById(updates.getBranchId()).ifPresent(b -> {
                        b.setName(updates.getBranchName());
                        if (updates.getBranchNameTamil() != null) b.setTamilName(updates.getBranchNameTamil());
                        branchRepository.save(b);
                    });
                }
            }
        }
        if (updates.getBranchName() != null) existing.setBranchName(updates.getBranchName());
        if (updates.getBranchNameTamil() != null) existing.setBranchNameTamil(updates.getBranchNameTamil());

        // If existing member still has root or empty branch, auto-inherit from parent or marrying spouse
        if (existing.getBranchId() == null || "root".equals(existing.getBranchId())) {
            String pId = (existing.getFatherId() != null && !existing.getFatherId().trim().isEmpty()) ? existing.getFatherId() : existing.getMotherId();
            if (pId != null && !pId.trim().isEmpty()) {
                memberRepository.findById(pId).ifPresent(parent -> {
                    if (parent.getBranchId() != null && !parent.getBranchId().trim().isEmpty() && !"root".equals(parent.getBranchId())) {
                        existing.setBranchId(parent.getBranchId());
                        existing.setBranchName(parent.getBranchName());
                        existing.setBranchNameTamil(parent.getBranchNameTamil());
                    }
                });
            } else if (existing.getSpouseIds() != null && !existing.getSpouseIds().isEmpty()) {
                for (String spId : existing.getSpouseIds()) {
                    memberRepository.findById(spId).ifPresent(sp -> {
                        if (sp.getBranchId() != null && !sp.getBranchId().trim().isEmpty() && !"root".equals(sp.getBranchId())) {
                            existing.setBranchId(sp.getBranchId());
                            existing.setBranchName(sp.getBranchName());
                            existing.setBranchNameTamil(sp.getBranchNameTamil());
                        }
                    });
                }
            }
        }

        // If this member's branch changed from root or another branch, propagate to direct children who shared the old branch
        if (existing.getBranchId() != null && !existing.getBranchId().equals(oldBranchId) && !"root".equals(existing.getBranchId())) {
            propagateBranchToChildren(existing);
        }

        if (updates.getChildIds() != null && !updates.getChildIds().isEmpty()) {
            existing.setChildIds(updates.getChildIds());
        }
        if (updates.getTags() != null) {
            existing.setTags(updates.getTags());
        }

        return memberRepository.save(existing);
    }

    private void propagateGenerationToChildren(FamilyMember parent) {
        if (parent.getChildIds() == null || parent.getChildIds().isEmpty()) return;
        for (String childId : parent.getChildIds()) {
            memberRepository.findById(childId).ifPresent(child -> {
                int expectedGen = parent.getGeneration() + 1;
                if (child.getGeneration() != expectedGen) {
                    child.setGeneration(expectedGen);
                    memberRepository.save(child);
                    propagateGenerationToChildren(child);
                }
            });
        }
    }

    private void propagateBranchToChildren(FamilyMember parent) {
        if (parent.getChildIds() == null || parent.getChildIds().isEmpty()) return;
        for (String childId : parent.getChildIds()) {
            memberRepository.findById(childId).ifPresent(child -> {
                if (child.getBranchId() == null || "root".equals(child.getBranchId()) || child.getBranchId().equals(parent.getBranchId())) {
                    child.setBranchId(parent.getBranchId());
                    child.setBranchName(parent.getBranchName());
                    child.setBranchNameTamil(parent.getBranchNameTamil());
                    memberRepository.save(child);
                    // Also propagate to child's spouses if spouse has root branch
                    if (child.getSpouseIds() != null) {
                        for (String spId : child.getSpouseIds()) {
                            memberRepository.findById(spId).ifPresent(sp -> {
                                if (sp.getBranchId() == null || "root".equals(sp.getBranchId())) {
                                    sp.setBranchId(parent.getBranchId());
                                    sp.setBranchName(parent.getBranchName());
                                    sp.setBranchNameTamil(parent.getBranchNameTamil());
                                    memberRepository.save(sp);
                                }
                            });
                        }
                    }
                    propagateBranchToChildren(child);
                }
            });
        }
    }

    /**
     * A woman can have only one husband in the family tree. A man may have more than one wife
     * (some elders did), so that stays allowed. People whose gender is not known are not checked.
     */
    static void checkOneHusband(String memberId, String gender, List<String> spouseIds,
                                java.util.function.Function<String, Optional<FamilyMember>> find) {
        if (spouseIds == null) return;
        List<String> targets = spouseIds.stream()
                .filter(sid -> sid != null && !sid.isBlank() && !sid.equals(memberId))
                .distinct().toList();
        if ("female".equals(gender) && targets.size() > 1) {
            throw new IllegalArgumentException("A woman can have only one husband in the family tree. Remove the current husband first.");
        }
        for (String sid : targets) {
            Optional<FamilyMember> spouse = find.apply(sid);
            if (spouse.isEmpty() || !"female".equals(spouse.get().getGender())) continue;
            FamilyMember wife = spouse.get();
            List<String> herHusbands = new ArrayList<>(wife.getSpouseIds() != null ? wife.getSpouseIds() : List.of());
            if (wife.getSpouseId() != null && !herHusbands.contains(wife.getSpouseId())) herHusbands.add(wife.getSpouseId());
            herHusbands.removeIf(h -> h == null || h.isBlank() || h.equals(memberId));
            if (!herHusbands.isEmpty()) {
                String name = wife.getFullName() != null ? wife.getFullName() : "She";
                throw new IllegalArgumentException(name + " already has a husband in the family tree. A woman can have only one husband.");
            }
        }
    }

    private void validateKinshipRelations(String memberId, String fatherId, String motherId, List<String> childIds, List<String> spouseIds, String birthDate) {
        // 1. Father and Mother collision / self parentage
        if (fatherId != null && motherId != null && !fatherId.trim().isEmpty() && fatherId.equals(motherId)) {
            throw new IllegalArgumentException("Father and mother cannot be the same person");
        }
        if (memberId != null) {
            if (memberId.equals(fatherId) || memberId.equals(motherId)) {
                throw new IllegalArgumentException("A person cannot be their own parent");
            }
        }

        // Parent and Spouse collision: A person cannot marry their own father or mother
        if (spouseIds != null && !spouseIds.isEmpty()) {
            if (fatherId != null && !fatherId.trim().isEmpty() && spouseIds.contains(fatherId.trim())) {
                throw new IllegalArgumentException("Cannot select father as spouse under Tamil Hindu kinship tradition");
            }
            if (motherId != null && !motherId.trim().isEmpty() && spouseIds.contains(motherId.trim())) {
                throw new IllegalArgumentException("Cannot select mother as spouse under Tamil Hindu kinship tradition");
            }
        }

        // Collect all descendants of the member (children, grandchildren...)
        java.util.Set<String> descendants = new java.util.HashSet<>();
        java.util.Queue<String> dQueue = new java.util.LinkedList<>();
        if (childIds != null) dQueue.addAll(childIds);

        while (!dQueue.isEmpty()) {
            String currId = dQueue.poll();
            if (descendants.add(currId)) {
                memberRepository.findById(currId).ifPresent(c -> {
                    if (c.getChildIds() != null) dQueue.addAll(c.getChildIds());
                });
            }
        }

        // Parent cycle prevention
        if (fatherId != null && descendants.contains(fatherId)) {
            throw new IllegalArgumentException("Cannot select a descendant as father (creates a circular ancestry loop)");
        }
        if (motherId != null && descendants.contains(motherId)) {
            throw new IllegalArgumentException("Cannot select a descendant as mother (creates a circular ancestry loop)");
        }

        // Parent gender checks & birth date chronology checks
        if (fatherId != null && !fatherId.trim().isEmpty()) {
            memberRepository.findById(fatherId).ifPresent(f -> {
                if ("female".equalsIgnoreCase(f.getGender())) {
                    throw new IllegalArgumentException("Selected father record must be male");
                }
                if (birthDate != null && !birthDate.trim().isEmpty() && f.getBirthDate() != null && !f.getBirthDate().trim().isEmpty()) {
                    if (birthDate.compareTo(f.getBirthDate()) <= 0) {
                        throw new IllegalArgumentException("Child birth date cannot be before or equal to father's birth date (" + f.getBirthDate() + ")");
                    }
                }
                if (birthDate != null && !birthDate.trim().isEmpty() && f.isDeceased() && f.getDeathDate() != null && !f.getDeathDate().trim().isEmpty()) {
                    try {
                        java.time.LocalDate cBirth = java.time.LocalDate.parse(birthDate.trim());
                        java.time.LocalDate fDeath = java.time.LocalDate.parse(f.getDeathDate().trim());
                        if (cBirth.isAfter(fDeath.plusDays(300))) {
                            throw new IllegalArgumentException("Child birth date cannot be more than 10 months after father's date of demise (" + f.getDeathDate() + ")");
                        }
                    } catch (java.time.format.DateTimeParseException ignored) {
                        if (birthDate.compareTo(f.getDeathDate()) > 0) {
                            throw new IllegalArgumentException("Child birth date cannot be after father's date of demise (" + f.getDeathDate() + ")");
                        }
                    }
                }
            });
        }
        if (motherId != null && !motherId.trim().isEmpty()) {
            memberRepository.findById(motherId).ifPresent(m -> {
                if ("male".equalsIgnoreCase(m.getGender())) {
                    throw new IllegalArgumentException("Selected mother record must be female");
                }
                if (birthDate != null && !birthDate.trim().isEmpty() && m.getBirthDate() != null && !m.getBirthDate().trim().isEmpty()) {
                    if (birthDate.compareTo(m.getBirthDate()) <= 0) {
                        throw new IllegalArgumentException("Child birth date cannot be before or equal to mother's birth date (" + m.getBirthDate() + ")");
                    }
                }
                if (birthDate != null && !birthDate.trim().isEmpty() && m.isDeceased() && m.getDeathDate() != null && !m.getDeathDate().trim().isEmpty()) {
                    if (birthDate.compareTo(m.getDeathDate()) > 0) {
                        throw new IllegalArgumentException("Child birth date cannot be after mother's date of demise (" + m.getDeathDate() + ")");
                    }
                }
            });
        }

        // 2. Spouse checks (supports multiple wives / multiple husbands / remarriages)
        if (spouseIds == null || spouseIds.isEmpty()) {
            return;
        }

        // Collect all ancestors of the member (parents, grandparents, great-grandparents...)
        java.util.Set<String> ancestors = new java.util.HashSet<>();
        java.util.Queue<String> aQueue = new java.util.LinkedList<>();
        if (fatherId != null && !fatherId.trim().isEmpty()) aQueue.add(fatherId);
        if (motherId != null && !motherId.trim().isEmpty()) aQueue.add(motherId);

        while (!aQueue.isEmpty()) {
            String currId = aQueue.poll();
            if (ancestors.add(currId)) {
                memberRepository.findById(currId).ifPresent(p -> {
                    if (p.getFatherId() != null && !p.getFatherId().trim().isEmpty()) aQueue.add(p.getFatherId());
                    if (p.getMotherId() != null && !p.getMotherId().trim().isEmpty()) aQueue.add(p.getMotherId());
                });
            }
        }

        for (String spouseId : spouseIds) {
            if (spouseId == null || spouseId.trim().isEmpty()) continue;
            if (memberId != null && memberId.equals(spouseId)) {
                throw new IllegalArgumentException("A person cannot be their own spouse");
            }
            if (descendants.contains(spouseId)) {
                throw new IllegalArgumentException("Cannot select children or grandchildren as spouse");
            }
            if (ancestors.contains(spouseId)) {
                throw new IllegalArgumentException("Cannot select father, mother, grandfather, or grandmother as spouse under Tamil Hindu kinship tradition");
            }

            // Check siblings (brother, sister sharing same father or mother)
            if ((fatherId != null && !fatherId.trim().isEmpty()) || (motherId != null && !motherId.trim().isEmpty())) {
                Optional<FamilyMember> spouseOpt = memberRepository.findById(spouseId);
                if (spouseOpt.isPresent()) {
                    FamilyMember sp = spouseOpt.get();
                    if ((fatherId != null && !fatherId.trim().isEmpty() && fatherId.equals(sp.getFatherId())) ||
                        (motherId != null && !motherId.trim().isEmpty() && motherId.equals(sp.getMotherId()))) {
                        throw new IllegalArgumentException("Cannot select brother or sister as spouse under Tamil Hindu lineage tradition");
                    }
                }
            }

            // In Tamil Hindu tradition, cannot marry a descendant's spouse (daughter-in-law / son-in-law)
            for (String descId : descendants) {
                memberRepository.findById(descId).ifPresent(d -> {
                    if ((d.getSpouseIds() != null && d.getSpouseIds().contains(spouseId)) ||
                        spouseId.equals(d.getSpouseId())) {
                        throw new IllegalArgumentException("Cannot select child's or descendant's spouse (daughter-in-law / son-in-law) under Tamil Hindu kinship tradition");
                    }
                });
            }

            // Cannot marry parent's spouse
            for (String ancId : ancestors) {
                memberRepository.findById(ancId).ifPresent(a -> {
                    if ((a.getSpouseIds() != null && a.getSpouseIds().contains(spouseId)) ||
                        spouseId.equals(a.getSpouseId())) {
                        throw new IllegalArgumentException("Cannot select parent's spouse under Tamil Hindu kinship tradition");
                    }
                });
            }
        }
    }

    public void deleteMember(String id) {
        // Detach from parents & spouses
        memberRepository.findAll().forEach(m -> {
            boolean modified = false;
            if (m.getChildIds() != null && m.getChildIds().remove(id)) {
                modified = true;
            }
            if (id.equals(m.getFatherId())) {
                m.setFatherId(null);
                modified = true;
            }
            if (id.equals(m.getMotherId())) {
                m.setMotherId(null);
                modified = true;
            }
            if (m.getSpouseIds() != null && m.getSpouseIds().remove(id)) {
                if (m.getSpouseIds().isEmpty()) {
                    m.setSpouseId(null);
                } else {
                    m.setSpouseId(m.getSpouseIds().get(0));
                }
                modified = true;
            } else if (id.equals(m.getSpouseId())) {
                m.setSpouseId(null);
                modified = true;
            }
            if (modified) {
                memberRepository.save(m);
            }
        });

        // Reassign or cleanup branch root if this member was branch root
        List<FamilyMember> allMembers = memberRepository.findAll();
        branchRepository.findAll().forEach(b -> {
            if (id.equals(b.getRootPersonId())) {
                List<FamilyMember> remaining = allMembers.stream()
                        .filter(m -> !m.getId().equals(id) && b.getId().equals(m.getBranchId()))
                        .toList();
                if (!remaining.isEmpty()) {
                    b.setRootPersonId(remaining.get(0).getId());
                    branchRepository.save(b);
                } else if (!"root".equalsIgnoreCase(b.getId())) {
                    branchRepository.delete(b);
                }
            }
        });

        memberRepository.deleteById(id);
    }

    public FamilyStatsDto calculateStats() {
        List<FamilyMember> all = memberRepository.findAll();
        int totalMembers = all.size();
        int maxGen = 0;
        int living = 0;
        int deceased = 0;
        int missingPhotos = 0;
        int missingDetails = 0;
        java.util.Set<String> activeBranches = new java.util.HashSet<>();

        for (FamilyMember m : all) {
            if (m.getGeneration() > maxGen) {
                maxGen = m.getGeneration();
            }
            if (m.getBranchId() != null && !m.getBranchId().trim().isEmpty() && !"root".equalsIgnoreCase(m.getBranchId())) {
                activeBranches.add(m.getBranchId());
            }
            if (m.isDeceased()) {
                deceased++;
            } else {
                living++;
            }
            if (m.getPhotoUrl() == null || m.getPhotoUrl().trim().isEmpty()) {
                missingPhotos++;
            }
            if (m.getProfession() == null || m.getEducation() == null || m.getBirthDate() == null
                    || m.getProfession().trim().isEmpty() || m.getEducation().trim().isEmpty()) {
                missingDetails++;
            }
        }

        int totalBranches = activeBranches.size();

        return new FamilyStatsDto(
                totalMembers,
                maxGen,
                totalBranches,
                living,
                deceased,
                missingPhotos,
                missingDetails
        );
    }
}
