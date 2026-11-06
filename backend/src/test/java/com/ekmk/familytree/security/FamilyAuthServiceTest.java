package com.ekmk.familytree.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The family website's shared password. */
class FamilyAuthServiceTest {

    private static final Clock NOW = Clock.fixed(Instant.parse("2026-11-05T10:00:00Z"), ZoneOffset.UTC);

    private FamilyAuthService service(String password) {
        return new FamilyAuthService(password, Duration.ofDays(180), NOW);
    }

    @Test
    void openWhenNoPasswordIsSet() {
        FamilyAuthService s = service("");
        assertFalse(s.isRequired());
        assertEquals(FamilyAuthService.Result.NOT_CONFIGURED, s.login("anything", "1.2.3.4"));
    }

    @Test
    void rightPasswordGivesAWorkingToken() {
        FamilyAuthService s = service("kmk-erode");
        assertTrue(s.isRequired());
        assertEquals(FamilyAuthService.Result.OK, s.login(" kmk-erode ", "1.2.3.4"));
        assertTrue(s.isValid(s.issueToken()));
    }

    @Test
    void wrongPasswordAndBadTokensAreRefused() {
        FamilyAuthService s = service("kmk-erode");
        assertEquals(FamilyAuthService.Result.WRONG_PASSWORD, s.login("KMK-ERODE", "1.2.3.4"));
        assertFalse(s.isValid(null));
        assertFalse(s.isValid("garbage"));
        assertFalse(s.isValid("99999999999.forged"));
    }

    @Test
    void changingThePasswordSignsEveryoneOut() {
        String token = service("old-password").issueToken();
        assertFalse(service("new-password").isValid(token));
    }

    @Test
    void tokensExpire() {
        String token = service("kmk-erode").issueToken();
        FamilyAuthService later = new FamilyAuthService("kmk-erode", Duration.ofDays(180), Clock.offset(NOW, Duration.ofDays(181)));
        assertFalse(later.isValid(token));
    }

    @Test
    void tooManyWrongTriesPause() {
        FamilyAuthService s = service("kmk-erode");
        for (int i = 0; i < FamilyAuthService.MAX_FAILURES; i++) s.login("wrong", "1.2.3.4");
        assertEquals(FamilyAuthService.Result.LOCKED_OUT, s.login("kmk-erode", "1.2.3.4"));
        // Someone else (another phone) can still sign in.
        assertEquals(FamilyAuthService.Result.OK, s.login("kmk-erode", "5.6.7.8"));
    }

    @Test
    void behindNginxTheForwardedAddressCounts() {
        MockHttpServletRequest viaNginx = new MockHttpServletRequest();
        viaNginx.setRemoteAddr("127.0.0.1");
        viaNginx.addHeader("X-Forwarded-For", "10.0.0.9, 49.37.1.2");
        assertEquals("49.37.1.2", FamilyAuthService.clientAddress(viaNginx));

        MockHttpServletRequest direct = new MockHttpServletRequest();
        direct.setRemoteAddr("49.37.1.2");
        direct.addHeader("X-Forwarded-For", "6.6.6.6");
        assertEquals("49.37.1.2", FamilyAuthService.clientAddress(direct));
    }

    @Test
    void whichRequestsNeedTheFamilyPassword() {
        assertTrue(FamilyAuthInterceptor.needsFamily("GET", "/api/members"));
        assertTrue(FamilyAuthInterceptor.needsFamily("GET", "/api/settings"));
        assertTrue(FamilyAuthInterceptor.needsFamily("GET", "/api/stats"));
        assertFalse(FamilyAuthInterceptor.needsFamily("GET", "/api/family/session"));
        assertFalse(FamilyAuthInterceptor.needsFamily("POST", "/api/family/login"));
        assertFalse(FamilyAuthInterceptor.needsFamily("GET", "/api/media/photos/photo_ab12.jpg"));
        assertFalse(FamilyAuthInterceptor.needsFamily("GET", "/api/admin/members"));
        assertFalse(FamilyAuthInterceptor.needsFamily("OPTIONS", "/api/members"));
        // Signing in to the family website needs no admin token either.
        assertFalse(AdminAuthInterceptor.needsAdmin("POST", "/api/family/login"));
    }
}
