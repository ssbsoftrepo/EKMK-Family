package com.ekmk.familytree.security;

import com.ekmk.familytree.model.AdminCredential;
import com.ekmk.familytree.repository.AdminCredentialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.Deque;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Admin authentication supporting encrypted database credentials (PBKDF2)
 * with fallback to the environment variable ADMIN_PASSWORD.
 *
 * Signing in returns a signed token valid for {@code app.admin.session-days}. The token is
 * "expiry.signature", signed with a key derived from the password hash, so it survives a restart
 * and stops working as soon as the password is changed. After too many wrong passwords from
 * one address, signing in pauses for a while.
 */
@Service
public class AdminAuthService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthService.class);

    public static final int MAX_FAILURES = 5;
    public static final Duration LOCKOUT = Duration.ofMinutes(10);

    public enum Result { OK, WRONG_PASSWORD, LOCKED_OUT, NOT_CONFIGURED }

    private final AdminCredentialRepository credentialRepository;
    private final byte[] passwordDigest;
    private final byte[] envSigningKey;
    private final Duration sessionLength;
    private final Clock clock;
    private final Map<String, Deque<Long>> failures = new ConcurrentHashMap<>();

    @Autowired
    public AdminAuthService(AdminCredentialRepository credentialRepository,
                            @Value("${app.admin.password:}") String password,
                            @Value("${app.admin.session-days:30}") int sessionDays) {
        this(credentialRepository, password, Duration.ofDays(Math.max(1, sessionDays)), Clock.systemUTC());
    }

    AdminAuthService(String password, Duration sessionLength, Clock clock) {
        this(null, password, sessionLength, clock);
    }

    AdminAuthService(AdminCredentialRepository credentialRepository, String password, Duration sessionLength, Clock clock) {
        this.credentialRepository = credentialRepository;
        String p = password == null ? "" : password;
        this.passwordDigest = p.isEmpty() ? null : sha256("kmk-admin-password:" + p);
        this.envSigningKey = p.isEmpty() ? null : sha256("kmk-admin-session-key:" + p);
        this.sessionLength = sessionLength;
        this.clock = clock;

        if (p.isEmpty() && (credentialRepository == null)) {
            log.warn("ADMIN_PASSWORD is not set: admin access is dependent on database credentials.");
        } else if (!p.isEmpty() && p.length() < 8) {
            log.warn("ADMIN_PASSWORD is shorter than 8 characters; please choose a longer one.");
        }
    }

    public boolean isConfigured() {
        if (hasDbCredential()) {
            return true;
        }
        return passwordDigest != null;
    }

    private boolean hasDbCredential() {
        if (credentialRepository == null) return false;
        try {
            return credentialRepository.findById("admin").isPresent();
        } catch (Exception e) {
            log.debug("Could not query admin_credentials: {}", e.getMessage());
            return false;
        }
    }

    private Optional<AdminCredential> getDbCredential() {
        if (credentialRepository == null) return Optional.empty();
        try {
            return credentialRepository.findById("admin");
        } catch (Exception e) {
            log.warn("Error reading admin credential from database: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /** Checks the password. On success {@link #issueToken()} gives the session token. */
    public Result login(String password, String fromAddress) {
        if (!isConfigured()) return Result.NOT_CONFIGURED;
        String who = fromAddress == null ? "unknown" : fromAddress;
        long now = clock.millis();
        Deque<Long> recent = failures.computeIfAbsent(who, k -> new ArrayDeque<>());
        synchronized (recent) {
            while (!recent.isEmpty() && now - recent.peekFirst() > LOCKOUT.toMillis()) recent.pollFirst();
            if (recent.size() >= MAX_FAILURES) return Result.LOCKED_OUT;

            boolean ok = checkPassword(password);
            if (ok) {
                recent.clear();
                return Result.OK;
            }
            recent.addLast(now);
            log.info("Wrong admin password from {} ({} of {})", who, recent.size(), MAX_FAILURES);
            return Result.WRONG_PASSWORD;
        }
    }

    private boolean checkPassword(String password) {
        if (password == null) return false;

        // 1. Check encrypted password in database
        Optional<AdminCredential> dbCred = getDbCredential();
        if (dbCred.isPresent()) {
            AdminCredential cred = dbCred.get();
            boolean match = AdminCrypto.verify(password, cred.getPasswordHash(), cred.getSalt(), cred.getIterations());
            if (match) return true;
        }

        // 2. Fallback to env variable password if provided
        if (passwordDigest != null) {
            return MessageDigest.isEqual(passwordDigest, sha256("kmk-admin-password:" + password));
        }

        return false;
    }

    public String issueToken() {
        long expiry = clock.instant().plus(sessionLength).getEpochSecond();
        return expiry + "." + sign(expiry);
    }

    public boolean isValid(String token) {
        if (!isConfigured() || token == null) return false;
        int dot = token.indexOf('.');
        if (dot <= 0) return false;
        long expiry;
        try {
            expiry = Long.parseLong(token.substring(0, dot));
        } catch (NumberFormatException e) {
            return false;
        }
        if (expiry < clock.instant().getEpochSecond()) return false;
        byte[] expected = sign(expiry).getBytes(StandardCharsets.US_ASCII);
        byte[] given = token.substring(dot + 1).getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, given);
    }

    private byte[] getSigningKey() {
        Optional<AdminCredential> dbCred = getDbCredential();
        if (dbCred.isPresent()) {
            return sha256("kmk-admin-session-key:" + dbCred.get().getPasswordHash());
        }
        return envSigningKey;
    }

    private String sign(long expiry) {
        byte[] key = getSigningKey();
        if (key == null) {
            throw new IllegalStateException("Could not sign session: no signing key configured");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] sig = mac.doFinal(("kmk-admin:" + expiry).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign the admin session", e);
        }
    }

    private static byte[] sha256(String s) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
