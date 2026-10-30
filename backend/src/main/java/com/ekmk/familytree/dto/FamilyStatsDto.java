package com.ekmk.familytree.dto;

public class FamilyStatsDto {
    private int totalMembers;
    private int totalGenerations;
    private int totalBranches;
    private int livingCount;
    private int deceasedCount;
    private int missingPhotosCount;
    private int missingDetailsCount;

    public FamilyStatsDto() {
    }

    public FamilyStatsDto(int totalMembers, int totalGenerations, int totalBranches,
                          int livingCount, int deceasedCount, int missingPhotosCount, int missingDetailsCount) {
        this.totalMembers = totalMembers;
        this.totalGenerations = totalGenerations;
        this.totalBranches = totalBranches;
        this.livingCount = livingCount;
        this.deceasedCount = deceasedCount;
        this.missingPhotosCount = missingPhotosCount;
        this.missingDetailsCount = missingDetailsCount;
    }

    public int getTotalMembers() {
        return totalMembers;
    }

    public void setTotalMembers(int totalMembers) {
        this.totalMembers = totalMembers;
    }

    public int getTotalGenerations() {
        return totalGenerations;
    }

    public void setTotalGenerations(int totalGenerations) {
        this.totalGenerations = totalGenerations;
    }

    public int getTotalBranches() {
        return totalBranches;
    }

    public void setTotalBranches(int totalBranches) {
        this.totalBranches = totalBranches;
    }

    public int getLivingCount() {
        return livingCount;
    }

    public void setLivingCount(int livingCount) {
        this.livingCount = livingCount;
    }

    public int getDeceasedCount() {
        return deceasedCount;
    }

    public void setDeceasedCount(int deceasedCount) {
        this.deceasedCount = deceasedCount;
    }

    public int getMissingPhotosCount() {
        return missingPhotosCount;
    }

    public void setMissingPhotosCount(int missingPhotosCount) {
        this.missingPhotosCount = missingPhotosCount;
    }

    public int getMissingDetailsCount() {
        return missingDetailsCount;
    }

    public void setMissingDetailsCount(int missingDetailsCount) {
        this.missingDetailsCount = missingDetailsCount;
    }
}
