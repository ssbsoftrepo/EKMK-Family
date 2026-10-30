package com.ekmk.familytree.model;

import jakarta.persistence.*;

@Entity
@Table(name = "family_branches")
public class FamilyBranch {

    @Id
    @Column(nullable = false, unique = true)
    private String id;

    private String name;
    private String tamilName;
    private String color;
    private String badgeBg;
    private String badgeBorder;
    private String rootPersonId;

    @Column(length = 2000)
    private String description;

    public FamilyBranch() {
    }

    public FamilyBranch(String id, String name, String tamilName, String color, String badgeBg,
                        String badgeBorder, String rootPersonId, String description) {
        this.id = id;
        this.name = name;
        this.tamilName = tamilName;
        this.color = color;
        this.badgeBg = badgeBg;
        this.badgeBorder = badgeBorder;
        this.rootPersonId = rootPersonId;
        this.description = description;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTamilName() {
        return tamilName;
    }

    public void setTamilName(String tamilName) {
        this.tamilName = tamilName;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getBadgeBg() {
        return badgeBg;
    }

    public void setBadgeBg(String badgeBg) {
        this.badgeBg = badgeBg;
    }

    public String getBadgeBorder() {
        return badgeBorder;
    }

    public void setBadgeBorder(String badgeBorder) {
        this.badgeBorder = badgeBorder;
    }

    public String getRootPersonId() {
        return rootPersonId;
    }

    public void setRootPersonId(String rootPersonId) {
        this.rootPersonId = rootPersonId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
