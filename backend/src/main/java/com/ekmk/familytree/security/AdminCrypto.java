package com.ekmk.familytree.security;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

/**
 * Standard PBKDF2 with HMAC-SHA256 password encryption and verification.
 */
public final class AdminCrypto {

    public static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    public static final int DEFAULT_ITERATIONS = 65536;
    public static final int KEY_LENGTH = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    private AdminCrypto() {}

    public static String generateSalt() {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    public static String hashPassword(String password, String saltBase64, int iterations) {
        if (password == null || saltBase64 == null) {
            throw new IllegalArgumentException("Password and salt cannot be null");
        }
        try {
            byte[] salt = Base64.getDecoder().decode(saltBase64);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, KEY_LENGTH);
            SecretKeyFactory skf = SecretKeyFactory.getInstance(ALGORITHM);
            byte[] hash = skf.generateSecret(spec).getEncoded();
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Failed to hash password with " + ALGORITHM, e);
        }
    }

    public static boolean verify(String rawPassword, String storedHashBase64, String saltBase64, int iterations) {
        if (rawPassword == null || storedHashBase64 == null || saltBase64 == null) {
            return false;
        }
        try {
            String computed = hashPassword(rawPassword, saltBase64, iterations);
            byte[] expected = Base64.getDecoder().decode(storedHashBase64);
            byte[] actual = Base64.getDecoder().decode(computed);
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception e) {
            return false;
        }
    }
}

