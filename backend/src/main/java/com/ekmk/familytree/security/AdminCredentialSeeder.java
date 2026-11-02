package com.ekmk.familytree.security;

import com.ekmk.familytree.model.AdminCredential;
import com.ekmk.familytree.repository.AdminCredentialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Ensures encrypted admin credentials are seeded in the database on startup.
 */
@Component
@Order(1)
public class AdminCredentialSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminCredentialSeeder.class);

    public static final String DEFAULT_ADMIN_ID = "admin";
    public static final String SEED_PASSWORD = "kmkfamilyadmin1@3$";

    private final AdminCredentialRepository repository;

    public AdminCredentialSeeder(AdminCredentialRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        repository.findById(DEFAULT_ADMIN_ID).ifPresentOrElse(
                existing -> log.info("Admin credential found in database (updated: {})", existing.getUpdatedAt()),
                () -> {
                    log.info("Seeding encrypted admin password into database...");
                    String salt = AdminCrypto.generateSalt();
                    String hash = AdminCrypto.hashPassword(SEED_PASSWORD, salt, AdminCrypto.DEFAULT_ITERATIONS);

                    AdminCredential credential = new AdminCredential(
                            DEFAULT_ADMIN_ID,
                            hash,
                            salt,
                            AdminCrypto.DEFAULT_ITERATIONS,
                            AdminCrypto.ALGORITHM
                    );
                    credential.setCreatedAt(Instant.now());
                    credential.setUpdatedAt(Instant.now());
                    repository.save(credential);
                    log.info("Encrypted admin password successfully seeded into database for '{}'", DEFAULT_ADMIN_ID);
                }
        );
    }

    /**
     * Force reset/seed the admin password to the target password.
     */
    public void seedPassword(String newPassword) {
        String salt = AdminCrypto.generateSalt();
        String hash = AdminCrypto.hashPassword(newPassword, salt, AdminCrypto.DEFAULT_ITERATIONS);
        AdminCredential credential = repository.findById(DEFAULT_ADMIN_ID).orElseGet(() -> new AdminCredential(
                DEFAULT_ADMIN_ID, hash, salt, AdminCrypto.DEFAULT_ITERATIONS, AdminCrypto.ALGORITHM
        ));
        credential.setPasswordHash(hash);
        credential.setSalt(salt);
        credential.setIterations(AdminCrypto.DEFAULT_ITERATIONS);
        credential.setAlgorithm(AdminCrypto.ALGORITHM);
        credential.setUpdatedAt(Instant.now());
        repository.save(credential);
        log.info("Admin password updated/seeded into database.");
    }
}

