package com.ekmk.familytree.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Encrypted admin credentials stored in the database.
 */
@Entity
@Table(name = "admin_credentials")
public class AdminCredential {

    @Id
    @Column(name = "id", length = 50, nullable = false)
    private String id = "admin";

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Column(name = "salt", length = 100, nullable = false)
    private String salt;

    @Column(name = "iterations", nullable = false)
    private int iterations = 65536;

    @Column(name = "algorithm", length = 50, nullable = false)
    private String algorithm = "PBKDF2WithHmacSHA256";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public AdminCredential() {
    }

    public AdminCredential(String id, String passwordHash, String salt, int iterations, String algorithm) {
        this.id = id;
        this.passwordHash = passwordHash;
        this.salt = salt;
        this.iterations = iterations;
        this.algorithm = algorithm;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getSalt() {
        return salt;
    }

    public void setSalt(String salt) {
        this.salt = salt;
    }

    public int getIterations() {
        return iterations;
    }

    public void setIterations(int iterations) {
        this.iterations = iterations;
    }

    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

