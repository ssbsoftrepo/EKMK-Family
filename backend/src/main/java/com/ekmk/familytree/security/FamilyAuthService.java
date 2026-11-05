package com.ekmk.familytree.security;

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
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The family website's one shared password (FAMILY_PASSWORD). Bare minimum on purpose:
 * one static password for everyone, set on the server, never stored in the code.
 *
 * Signing in returns a token "expiry.signature" valid for {@code app.family.session-days},
 * signed with a key derived from the password: it survives a restart and stops working
 * for everyone as soon as the password is changed.
 *
 * When FAMILY_PASSWORD is not set the family website stays open, as it was before.
 */
@Service
public class FamilyAuthService {

    private static final Logger log = LoggerFactory.getLogger(FamilyAuthService.class);

    /** More tries than the admin gets: many elders share one password and typos happen. */
    public static final int MAX_FAILURES = 10;
    public static final Duration LOCKOUT = Duration.ofMinutes(5);

    public enum Result { OK, WRONG_PASSWORD, LOCKED_OUT, NOT_CONFIGURED }

    private final byte[] passwordDigest;
    private final byte[] signingKey;
    private final Duration sessionLength;
    private final Clock clock;
    private final Map<String, Deque<Long>> failures = new ConcurrentHashMap<>();

    @Autowired
    public FamilyAuthService(@Value("${app.family.password:}") String password,
                             @Value("${app.family.session-days:180}") int sessionDays) {
        this(password, Duration.ofDays(Math.max(1, sessionDays)), Clock.systemUTC());
    }

    FamilyAuthService(String password, Duration sessionLength, Clock clock) {
        String p = password == null ? "" : password.trim();
        this.passwordDigest = p.isEmpty() ? null : sha256("kmk-family-password:" + p);
        this.signingKey = p.isEmpty() ? null : sha256("kmk-family-session-key:" + p);
        this.sessionLength = sessionLength;
        this.clock = clock;
        if (p.isEmpty()) {
            log.warn("FAMILY_PASSWORD is not set: the family website is open to anyone with the link.");
        }
    }

    /** True when the family website asks for the password. */
    public boolean isRequired() {
        return passwordDigest != null;
    }

    public Result login(String password, String fromAddress) {
        if (!isRequired()) return Result.NOT_CONFIGURED;
        String who = fromAddress == null ? "unknown" : fromAddress;
        long now = clock.millis();
        Deque<Long> recent = failures.computeIfAbsent(who, k -> new ArrayDeque<>());
        synchronized (recent) {
            while (!recent.isEmpty() && now - recent.peekFirst() > LOCKOUT.toMillis()) recent.pollFirst();
            if (recent.size() >= MAX_FAILURES) return Result.LOCKED_OUT;
            // Spaces around the password are ignored: phones like to add one after a word.
            String given = password == null ? "" : password.trim();
            if (MessageDigest.isEqual(passwordDigest, sha256("kmk-family-password:" + given))) {
                recent.clear();
                return Result.OK;
            }
            recent.addLast(now);
            log.info("Wrong family password from {} ({} of {})", who, recent.size(), MAX_FAILURES);
            return Result.WRONG_PASSWORD;
        }
    }

    public String issueToken() {
        long expiry = clock.instant().plus(sessionLength).getEpochSecond();
        return expiry + "." + sign(expiry);
    }

    public boolean isValid(String token) {
        if (!isRequired() || token == null) return false;
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

    private String sign(long expiry) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
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
