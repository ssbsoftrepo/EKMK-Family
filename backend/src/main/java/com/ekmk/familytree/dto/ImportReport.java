package com.ekmk.familytree.dto;

import java.util.ArrayList;
import java.util.List;

/** What happened during a Google Form import, in a shape the admin page can show directly. */
public class ImportReport {

    private int totalRows;
    private int added;
    private int updated;
    private int unchanged;
    private int skippedEmpty;
    private final List<String> addedIds = new ArrayList<>();
    private final List<String> fixes = new ArrayList<>();
    private final List<DuplicatePair> possibleDuplicates = new ArrayList<>();

    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }

    public int getAdded() { return added; }
    public void setAdded(int added) { this.added = added; }

    public int getUpdated() { return updated; }
    public void setUpdated(int updated) { this.updated = updated; }

    public int getUnchanged() { return unchanged; }
    public void setUnchanged(int unchanged) { this.unchanged = unchanged; }

    public int getSkippedEmpty() { return skippedEmpty; }
    public void setSkippedEmpty(int skippedEmpty) { this.skippedEmpty = skippedEmpty; }

    public List<String> getAddedIds() { return addedIds; }
    public List<String> getFixes() { return fixes; }
    public List<DuplicatePair> getPossibleDuplicates() { return possibleDuplicates; }

    public record DuplicatePair(String firstId, String firstName, String secondId, String secondName, String reason) {
    }
}
