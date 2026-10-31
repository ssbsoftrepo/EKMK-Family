package com.ekmk.familytree.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminAuthServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-01T10:00:00Z");

    private static AdminAuthService service(String password, Instant now) {
        return new AdminAuthService(password, Duration.ofDays(30), Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void rightPasswordGivesAWorkingToken() {
        AdminAuthService auth = service("murukku-2026", NOW);
        assertEquals(AdminAuthService.Result.OK, auth.login("murukku-2026", "1.2.3.4"));
        assertTrue(auth.isValid(auth.issueToken()));
    }

    @Test
    void wrongPasswordIsRefused() {
        AdminAuthService auth = service("murukku-2026", NOW);
        assertEquals(AdminAuthService.Result.WRONG_PASSWORD, auth.login("murukku", "1.2.3.4"));
        assertEquals(AdminAuthService.Result.WRONG_PASSWORD, auth.login(null, "1.2.3.4"));
    }

    @Test
    void tokensExpireAndCannotBeForged() {
        AdminAuthService today = service("murukku-2026", NOW);
        String token = today.issueToken();
        assertFalse(service("murukku-2026", NOW.plus(Duration.ofDays(31))).isValid(token), "expired");
        assertTrue(service("murukku-2026", NOW.plus(Duration.ofDays(29))).isValid(token), "still valid, also after a restart");
        assertFalse(service("a-new-password", NOW).isValid(token), "changing the password signs everyone out");
        String[] parts = token.split("\\.");
        assertFalse(today.isValid((Long.parseLong(parts[0]) + 999999) + "." + parts[1]), "longer expiry, same signature");
        assertFalse(today.isValid("garbage"));
        assertFalse(today.isValid(null));
    }

    @Test
    void tooManyWrongTriesPauseSigningIn() {
        AdminAuthService auth = service("murukku-2026", NOW);
        for (int i = 0; i < AdminAuthService.MAX_FAILURES; i++) auth.login("guess" + i, "5.6.7.8");
        assertEquals(AdminAuthService.Result.LOCKED_OUT, auth.login("murukku-2026", "5.6.7.8"), "even the right password waits");
        assertEquals(AdminAuthService.Result.OK, auth.login("murukku-2026", "9.9.9.9"), "other addresses are not affected");
    }

    @Test
    void withoutAPasswordNothingIsUnlocked() {
        AdminAuthService auth = service("", NOW);
        assertFalse(auth.isConfigured());
        assertEquals(AdminAuthService.Result.NOT_CONFIGURED, auth.login("", "1.2.3.4"));
        assertFalse(auth.isValid("123.abc"));
    }

    @Test
    void familyWebsiteReadsStayOpen() {
        assertFalse(AdminAuthInterceptor.needsAdmin("GET", "/api/members"));
        assertFalse(AdminAuthInterceptor.needsAdmin("GET", "/api/settings"));
        assertFalse(AdminAuthInterceptor.needsAdmin("GET", "/api/media/photos/a.jpg"));
        assertFalse(AdminAuthInterceptor.needsAdmin("GET", "/api/admin/health"));
        assertFalse(AdminAuthInterceptor.needsAdmin("POST", "/api/admin/login"));
        assertFalse(AdminAuthInterceptor.needsAdmin("OPTIONS", "/api/members/1"));
    }

    @Test
    void changesAndPrivateReadsNeedTheAdmin() {
        assertTrue(AdminAuthInterceptor.needsAdmin("GET", "/api/admin/members"));
        assertTrue(AdminAuthInterceptor.needsAdmin("GET", "/api/admin/session"));
        assertTrue(AdminAuthInterceptor.needsAdmin("PUT", "/api/members/1"));
        assertTrue(AdminAuthInterceptor.needsAdmin("POST", "/api/members"));
        assertTrue(AdminAuthInterceptor.needsAdmin("DELETE", "/api/members/1"));
        assertTrue(AdminAuthInterceptor.needsAdmin("PUT", "/api/settings"));
        assertTrue(AdminAuthInterceptor.needsAdmin("POST", "/api/media/upload"));
        assertTrue(AdminAuthInterceptor.needsAdmin("POST", "/api/admin/import"));
        assertTrue(AdminAuthInterceptor.needsAdmin("POST", "/api/branches"));
    }
}
