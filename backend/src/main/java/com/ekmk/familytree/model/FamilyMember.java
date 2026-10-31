package com.ekmk.familytree.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "family_members")
public class FamilyMember {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    private String firstName;
    private String lastName;
    private String fullName;
    private String tamilName;
    private String gender; // "male", "female", "other"
    private String birthDate;
    private String deathDate;
    private Boolean isDeceased = false;
    
    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    @Column(columnDefinition = "TEXT")
    private String couplePhotoUrl;

    @Column(length = 4000)
    private String coupleAbout;

    private String education;
    private String profession;
    private String business;
    private String birthPlace;
    private String currentCity;

    @Column(length = 4000)
    private String biography;

    private int generation;
    private String branchId;
    private String branchName;
    private String branchNameTamil;

    private String fatherId;
    private String motherId;
    private String spouseId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "member_spouses", joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "spouse_id")
    private List<String> spouseIds;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "member_children", joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "child_id")
    private List<String> childIds;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "member_tags", joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "tag")
    private List<String> tags;

    public FamilyMember() {
    }

    public FamilyMember(String id, String firstName, String lastName, String fullName, String tamilName,
                        String gender, String birthDate, String deathDate, boolean isDeceased, String photoUrl,
                        String education, String profession, String business, String birthPlace, String currentCity,
                        String biography, int generation, String branchId, String branchName, String branchNameTamil,
                        String fatherId, String motherId, String spouseId, List<String> childIds, List<String> tags) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fullName = fullName;
        this.tamilName = tamilName;
        this.gender = gender;
        this.birthDate = birthDate;
        this.deathDate = deathDate;
        this.isDeceased = isDeceased;
        this.photoUrl = photoUrl;
        this.education = education;
        this.profession = profession;
        this.business = business;
        this.birthPlace = birthPlace;
        this.currentCity = currentCity;
        this.biography = biography;
        this.generation = generation;
        this.branchId = branchId;
        this.branchName = branchName;
        this.branchNameTamil = branchNameTamil;
        this.fatherId = fatherId;
        this.motherId = motherId;
        this.spouseId = spouseId;
        if (childIds != null) {
            this.childIds = new ArrayList<>(childIds);
        }
        if (tags != null) {
            this.tags = new ArrayList<>(tags);
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getTamilName() {
        return tamilName;
    }

    public void setTamilName(String tamilName) {
        this.tamilName = tamilName;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public String getDeathDate() {
        return deathDate;
    }

    public void setDeathDate(String deathDate) {
        this.deathDate = deathDate;
    }

    public Boolean getIsDeceased() {
        return isDeceased;
    }

    public Boolean isDeceased() {
        return isDeceased != null ? isDeceased : false;
    }

    public void setDeceased(Boolean deceased) {
        this.isDeceased = deceased;
    }

    public void setIsDeceased(Boolean isDeceased) {
        this.isDeceased = isDeceased;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getCouplePhotoUrl() {
        return couplePhotoUrl;
    }

    public void setCouplePhotoUrl(String couplePhotoUrl) {
        this.couplePhotoUrl = couplePhotoUrl;
    }

    public String getCoupleAbout() {
        return coupleAbout;
    }

    public void setCoupleAbout(String coupleAbout) {
        this.coupleAbout = coupleAbout;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public String getProfession() {
        return profession;
    }

    public void setProfession(String profession) {
        this.profession = profession;
    }

    public String getBusiness() {
        return business;
    }

    public void setBusiness(String business) {
        this.business = business;
    }

    public String getBirthPlace() {
        return birthPlace;
    }

    public void setBirthPlace(String birthPlace) {
        this.birthPlace = birthPlace;
    }

    public String getCurrentCity() {
        return currentCity;
    }

    public void setCurrentCity(String currentCity) {
        this.currentCity = currentCity;
    }

    public String getBiography() {
        return biography;
    }

    public void setBiography(String biography) {
        this.biography = biography;
    }

    public int getGeneration() {
        return generation;
    }

    public void setGeneration(int generation) {
        this.generation = generation;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getBranchNameTamil() {
        return branchNameTamil;
    }

    public void setBranchNameTamil(String branchNameTamil) {
        this.branchNameTamil = branchNameTamil;
    }

    public String getFatherId() {
        return fatherId;
    }

    public void setFatherId(String fatherId) {
        this.fatherId = fatherId;
    }

    public String getMotherId() {
        return motherId;
    }

    public void setMotherId(String motherId) {
        this.motherId = motherId;
    }

    public String getSpouseId() {
        if (spouseId != null && !spouseId.trim().isEmpty()) {
            return spouseId;
        }
        if (spouseIds != null && !spouseIds.isEmpty()) {
            return spouseIds.get(0);
        }
        return null;
    }

    public void setSpouseId(String spouseId) {
        this.spouseId = spouseId;
        if (spouseId != null && !spouseId.trim().isEmpty()) {
            if (this.spouseIds == null) {
                this.spouseIds = new ArrayList<>();
            }
            if (!this.spouseIds.contains(spouseId)) {
                this.spouseIds.add(0, spouseId);
            }
        }
    }

    public List<String> getSpouseIds() {
        if ((spouseIds == null || spouseIds.isEmpty()) && spouseId != null && !spouseId.trim().isEmpty()) {
            List<String> list = new ArrayList<>();
            list.add(spouseId);
            return list;
        }
        return spouseIds;
    }

    public void setSpouseIds(List<String> spouseIds) {
        this.spouseIds = spouseIds != null ? new ArrayList<>(spouseIds) : new ArrayList<>();
        if (!this.spouseIds.isEmpty()) {
            this.spouseId = this.spouseIds.get(0);
        } else {
            this.spouseId = null;
        }
    }

    public List<String> getChildIds() {
        if (childIds == null) {
            childIds = new ArrayList<>();
        }
        return childIds;
    }

    public void setChildIds(List<String> childIds) {
        this.childIds = childIds != null ? new ArrayList<>(childIds) : new ArrayList<>();
    }

    public List<String> getTags() {
        if (tags == null) {
            tags = new ArrayList<>();
        }
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
    }
}
