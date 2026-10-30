package com.ekmk.familytree.service;

import com.ekmk.familytree.dto.FamilyStatsDto;
import com.ekmk.familytree.model.FamilyBranch;
import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.repository.FamilyBranchRepository;
import com.ekmk.familytree.repository.FamilyMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

    public Optional<FamilyMember> getMemberById(String id) {
        return memberRepository.findById(id);
    }

    public FamilyMember createMember(FamilyMember member) {
        if (member.getId() == null || member.getId().trim().isEmpty()) {
            member.setId("ekmk-" + (System.currentTimeMillis() % 1000000));
        }

        if (member.getChildIds() == null) {
            member.setChildIds(new ArrayList<>());
        }
        if (member.getTags() == null) {
            member.setTags(new ArrayList<>());
        }

        FamilyMember saved = memberRepository.save(member);
        String newId = saved.getId();

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

        // Update Spouse reciprocal link
        if (saved.getSpouseId() != null && !saved.getSpouseId().trim().isEmpty()) {
            memberRepository.findById(saved.getSpouseId()).ifPresent(spouse -> {
                if (spouse.getSpouseId() != null && !spouse.getSpouseId().equals(newId)) {
                    memberRepository.findById(spouse.getSpouseId()).ifPresent(prevPartner -> {
                        prevPartner.setSpouseId(null);
                        memberRepository.save(prevPartner);
                    });
                }
                spouse.setSpouseId(newId);
                memberRepository.save(spouse);
            });
        }

        return saved;
    }

    public FamilyMember updateMember(String id, FamilyMember updates) {
        FamilyMember existing = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with id: " + id));

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

        // Detect spouse change
        if (updates.getSpouseId() != null && !updates.getSpouseId().equals(existing.getSpouseId())) {
            if (existing.getSpouseId() != null) {
                memberRepository.findById(existing.getSpouseId()).ifPresent(oldSpouse -> {
                    if (id.equals(oldSpouse.getSpouseId())) {
                        oldSpouse.setSpouseId(null);
                        memberRepository.save(oldSpouse);
                    }
                });
            }
            if (!updates.getSpouseId().trim().isEmpty()) {
                memberRepository.findById(updates.getSpouseId()).ifPresent(newSpouse -> {
                    if (newSpouse.getSpouseId() != null && !newSpouse.getSpouseId().equals(id)) {
                        memberRepository.findById(newSpouse.getSpouseId()).ifPresent(prevPartner -> {
                            prevPartner.setSpouseId(null);
                            memberRepository.save(prevPartner);
                        });
                    }
                    newSpouse.setSpouseId(id);
                    memberRepository.save(newSpouse);
                });
            }
            existing.setSpouseId(updates.getSpouseId().trim().isEmpty() ? null : updates.getSpouseId());
        }

        // Update scalar fields
        if (updates.getFirstName() != null) existing.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) existing.setLastName(updates.getLastName());
        if (updates.getFullName() != null) existing.setFullName(updates.getFullName());
        if (updates.getTamilName() != null) existing.setTamilName(updates.getTamilName());
        if (updates.getGender() != null) existing.setGender(updates.getGender());
        if (updates.getBirthDate() != null) existing.setBirthDate(updates.getBirthDate());
        if (updates.getDeathDate() != null) existing.setDeathDate(updates.getDeathDate());
        existing.setDeceased(updates.isDeceased());
        if (updates.getPhotoUrl() != null) existing.setPhotoUrl(updates.getPhotoUrl());
        if (updates.getEducation() != null) existing.setEducation(updates.getEducation());
        if (updates.getProfession() != null) existing.setProfession(updates.getProfession());
        if (updates.getBusiness() != null) existing.setBusiness(updates.getBusiness());
        if (updates.getBirthPlace() != null) existing.setBirthPlace(updates.getBirthPlace());
        if (updates.getCurrentCity() != null) existing.setCurrentCity(updates.getCurrentCity());
        if (updates.getBiography() != null) existing.setBiography(updates.getBiography());
        if (updates.getGeneration() > 0) existing.setGeneration(updates.getGeneration());
        if (updates.getBranchId() != null) existing.setBranchId(updates.getBranchId());
        if (updates.getBranchName() != null) existing.setBranchName(updates.getBranchName());
        if (updates.getBranchNameTamil() != null) existing.setBranchNameTamil(updates.getBranchNameTamil());
        if (updates.getChildIds() != null && !updates.getChildIds().isEmpty()) {
            existing.setChildIds(updates.getChildIds());
        }
        if (updates.getTags() != null) {
            existing.setTags(updates.getTags());
        }

        return memberRepository.save(existing);
    }

    public void deleteMember(String id) {
        // Detach from parents
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
            if (id.equals(m.getSpouseId())) {
                m.setSpouseId(null);
                modified = true;
            }
            if (modified) {
                memberRepository.save(m);
            }
        });

        memberRepository.deleteById(id);
    }

    public FamilyStatsDto calculateStats() {
        List<FamilyMember> all = memberRepository.findAll();
        int totalMembers = all.size();
        int maxGen = 1;
        int living = 0;
        int deceased = 0;
        int missingPhotos = 0;
        int missingDetails = 0;

        for (FamilyMember m : all) {
            if (m.getGeneration() > maxGen) {
                maxGen = m.getGeneration();
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

        int totalBranches = (int) branchRepository.count();

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
