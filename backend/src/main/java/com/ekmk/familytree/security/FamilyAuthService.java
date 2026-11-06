package com.ekmk.familytree.security;

import com.ekmk.familytree.model.AdminCredential;
import com.ekmk.familytree.repository.AdminCredentialRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.Deque;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The family website's one shared password. Bare minimum on purpose: one password for everyone.
 *
 * Where it comes from, first match wins:
 * 1. the admin site (Share the link → Family website password), kept PBKDF2-hashed in
 *    admin_credentials under the id "family"; the admin can also turn it off there;
 * 2. FAMILY_PASSWORD on the server, as a starting value;
 * 3. none: the family website is open, as it was before.
 *
 * Signing in returns a token "expiry.signature" valid for {@code app.family.session-days},
 * signed with a key derived from the current password: changing the password signs every
 * phone out.
 */
@Service
public class FamilyAuthService {

    private static final Logger log = LoggerFactory.getLogger(FamilyAuthService.class);

    /** More tries than the admin gets: many elders share one password and typos happen. */
    public static final int MAX_FAILURES = 10;
    public static final Duration LOCKOUT = Duration.ofMinutes(5);
    public static final int MIN_LENGTH = 6;
    public static final int MAX_LENGTH = 100;

    /** Row id in admin_credentials. */
    public static final String CREDENTIAL_ID = "family";
    /** Stored in the algorithm column when the admin turned the password off. */
    static final String OFF = "OFF";

    public enum Result { OK, WRONG_PASSWORD, LOCKED_OUT, NOT_CONFIGURED }

    /** Where the password in use comes from. */
    public enum Source { ADMIN, SERVER, NONE }

    public record Status(boolean on, Source source, Instant changedAt) {}

    private final AdminCredentialRepository repository;
    private final String serverPassword;
    private final Duration sessionLength;
    private final Clock clock;
    private final Map<String, Deque<Long>> failures = new ConcurrentHashMap<>();

    /** The password in use, read from the database once and refreshed whenever the admin changes it. */
    private volatile Current current;

    private record Current(Source source, byte[] signingKey, AdminCredential stored, byte[] serverDigest, Instant changedAt) {
        boolean on() { return source != Source.NONE; }
    }

    @Autowired
    public FamilyAuthService(AdminCredentialRepository repository,
                             @Value("${app.family.password:}") String password,
                             @Value("${app.family.session-days:180}") int sessionDays) {
        this(repository, password, Duration.ofDays(Math.max(1, sessionDays)), Clock.systemUTC());
    }

    FamilyAuthService(String password, Duration sessionLength, Clock clock) {
        this(null, password, sessionLength, clock);
    }

    FamilyAuthService(AdminCredentialRepository repository, String password, Duration sessionLength, Clock clock) {
        this.repository = repository;
        this.serverPassword = password == null ? "" : password.trim();
        this.sessionLength = sessionLength;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- what is in use

    private Current current() {
        Current c = current;
        if (c == null) {
            c = load();
            current = c;
            if (!c.on()) log.warn("No family password is set: the family website is open to anyone with the link.");
        }
        return c;
    }

    private Current load() {
        Optional<AdminCredential> stored = Optional.empty();
        if (repository != null) {
            try {
                stored = repository.findById(CREDENTIAL_ID);
            } catch (Exception e) {
                log.warn("Could not read the family password from the database: {}", e.getMessage());
            }
        }
        if (stored.isPresent()) {
            AdminCredential s = stored.get();
            if (OFF.equals(s.getAlgorithm())) return new Current(Source.NONE, null, null, null, s.getUpdatedAt());
            return new Current(Source.ADMIN, sha256("kmk-family-session-key:" + s.getPasswordHash()), s, null, s.getUpdatedAt());
        }
        if (!serverPassword.isEmpty()) {
            return new Current(Source.SERVER, sha256("kmk-family-session-key:" + serverPassword),
                    null, sha256("kmk-family-password:" + serverPassword), null);
        }
        return new Current(Source.NONE, null, null, null, null);
    }

    /** True when the family website asks for the password. */
    public boolean isRequired() {
        return current().on();
    }

    public Status status() {
        Current c = current();
        return new Status(c.on(), c.source(), c.changedAt());
    }

    // ---------------------------------------------------------------- the admin changes it

    /** Sets a new family password (admin site). Every phone signed in with the old one is asked again. */
    public Status setPassword(String password) {
        String p = password == null ? "" : password.trim();
        if (p.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("Please use at least " + MIN_LENGTH + " letters or numbers.");
        }
        if (p.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("That password is too long.");
        }
        String salt = AdminCrypto.generateSalt();
        String hash = AdminCrypto.hashPassword(p, salt, AdminCrypto.DEFAULT_ITERATIONS);
        save(hash, salt, AdminCrypto.DEFAULT_ITERATIONS, AdminCrypto.ALGORITHM);
        failures.clear();
        log.info("The family password was changed in the admin site.");
        return status();
    }

    /** Turns the family password off (admin site): the website opens without one. */
    public Status turnOff() {
        save("-", "-", 0, OFF);
        log.info("The family password was turned off in the admin site.");
        return status();
    }

    private void save(String hash, String salt, int iterations, String algorithm) {
        if (repository == null) throw new IllegalStateException("No database to keep the family password in.");
        Instant now = clock.instant();
        AdminCredential row = repository.findById(CREDENTIAL_ID)
                .orElseGet(() -> new AdminCredential(CREDENTIAL_ID, hash, salt, iterations, algorithm));
        row.setPasswordHash(hash);
        row.setSalt(salt);
        row.setIterations(iterations);
        row.setAlgorithm(algorithm);
        row.setUpdatedAt(now);
        repository.save(row);
        current = load();
    }

    // ---------------------------------------------------------------- signing in

    public Result login(String password, String fromAddress) {
        if (!isRequired()) return Result.NOT_CONFIGURED;
        String who = fromAddress == null ? "unknown" : fromAddress;
        long now = clock.millis();
        Deque<Long> recent = failures.computeIfAbsent(who, k -> new ArrayDeque<>());
        synchronized (recent) {
            while (!recent.isEmpty() && now - recent.peekFirst() > LOCKOUT.toMillis()) recent.pollFirst();
            if (recent.size() >= MAX_FAILURES) return Result.LOCKED_OUT;
            if (matches(password)) {
                recent.clear();
                return Result.OK;
            }
            recent.addLast(now);
            log.info("Wrong family password from {} ({} of {})", who, recent.size(), MAX_FAILURES);
            return Result.WRONG_PASSWORD;
        }
    }

    private boolean matches(String password) {
        // Spaces around the password are ignored: phones like to add one after a word.
        String given = password == null ? "" : password.trim();
        Current c = current();
        if (c.source() == Source.ADMIN) {
            AdminCredential s = c.stored();
            return AdminCrypto.verify(given, s.getPasswordHash(), s.getSalt(), s.getIterations());
        }
        if (c.source() == Source.SERVER) {
            return MessageDigest.isEqual(c.serverDigest(), sha256("kmk-family-password:" + given));
        }
        return false;
    }

    public String issueToken() {
        long expiry = clock.instant().plus(sessionLength).getEpochSecond();
        return expiry + "." + sign(current().signingKey(), expiry);
    }

    public boolean isValid(String token) {
        Current c = current();
        if (!c.on() || token == null) return false;
        int dot = token.indexOf('.');
        if (dot <= 0) return false;
        long expiry;
        try {
            expiry = Long.parseLong(token.substring(0, dot));
        } catch (NumberFormatException e) {
            return false;
        }
        if (expiry < clock.instant().getEpochSecond()) return false;
        byte[] expected = sign(c.signingKey(), expiry).getBytes(StandardCharsets.US_ASCII);
        byte[] given = token.substring(dot + 1).getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, given);
    }

    /**
     * Who is trying, for the wrong-password pause. Behind Nginx every request comes from
     * 127.0.0.1, so then the last X-Forwarded-For entry (the one Nginx adds) is used.
     * Without that header everyone shares one counter.
     */
    public static String clientAddress(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank() && isLoopback(remote)) {
            String[] hops = forwarded.split(",");
            return hops[hops.length - 1].trim();
        }
        return remote;
    }

    private static boolean isLoopback(String address) {
        if (address == null) return false;
        try {
            return InetAddress.getByName(address).isLoopbackAddress();
        } catch (Exception e) {
            return false;
        }
    }

    private static String sign(byte[] key, long expiry) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] sig = mac.doFinal(("kmk-family:" + expiry).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign the family session", e);
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
