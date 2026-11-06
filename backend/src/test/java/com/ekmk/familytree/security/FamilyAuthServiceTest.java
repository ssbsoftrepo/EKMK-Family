package com.ekmk.familytree.security;

import com.ekmk.familytree.model.AdminCredential;
import com.ekmk.familytree.repository.AdminCredentialRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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

    // ---------------------------------------------------------------- set in the admin site

    /** A stand-in for the admin_credentials table. */
    private static AdminCredentialRepository table() {
        Map<String, AdminCredential> rows = new HashMap<>();
        AdminCredentialRepository repo = mock(AdminCredentialRepository.class);
        when(repo.findById(anyString())).thenAnswer(i -> Optional.ofNullable(rows.get(i.<String>getArgument(0))));
        when(repo.save(any(AdminCredential.class))).thenAnswer(i -> {
            AdminCredential c = i.getArgument(0);
            rows.put(c.getId(), c);
            return c;
        });
        return repo;
    }

    @Test
    void theAdminCanSetANewPasswordAndOldPhonesAreAskedAgain() {
        FamilyAuthService s = new FamilyAuthService(table(), "server-password", Duration.ofDays(180), NOW);
        assertEquals(FamilyAuthService.Source.SERVER, s.status().source());
        String oldToken = s.issueToken();

        FamilyAuthService.Status st = s.setPassword("  muthuthatha1962 ");
        assertTrue(st.on());
        assertEquals(FamilyAuthService.Source.ADMIN, st.source());
        assertFalse(s.isValid(oldToken));
        assertEquals(FamilyAuthService.Result.WRONG_PASSWORD, s.login("server-password", "1.2.3.4"));
        assertEquals(FamilyAuthService.Result.OK, s.login("muthuthatha1962", "1.2.3.4"));
        assertTrue(s.isValid(s.issueToken()));
    }

    @Test
    void theAdminCanTurnItOffEvenWhenTheServerHasOne() {
        FamilyAuthService s = new FamilyAuthService(table(), "server-password", Duration.ofDays(180), NOW);
        String token = s.issueToken();
        FamilyAuthService.Status st = s.turnOff();
        assertFalse(st.on());
        assertFalse(s.isRequired());
        assertFalse(s.isValid(token));
        // ...and on again with a new one.
        assertTrue(s.setPassword("kamalapaati").on());
        assertEquals(FamilyAuthService.Result.OK, s.login("kamalapaati", "1.2.3.4"));
    }

    @Test
    void tooShortPasswordsAreRefused() {
        FamilyAuthService s = new FamilyAuthService(table(), "", Duration.ofDays(180), NOW);
        assertThrows(IllegalArgumentException.class, () -> s.setPassword("abc"));
        assertThrows(IllegalArgumentException.class, () -> s.setPassword("   "));
        assertFalse(s.isRequired());
    }

    @Test
    void aNewPasswordEndsAPauseForWrongTries() {
        FamilyAuthService s = new FamilyAuthService(table(), "server-password", Duration.ofDays(180), NOW);
        for (int i = 0; i < FamilyAuthService.MAX_FAILURES; i++) s.login("wrong", "1.2.3.4");
        assertEquals(FamilyAuthService.Result.LOCKED_OUT, s.login("server-password", "1.2.3.4"));
        s.setPassword("vaanga-vaanga");
        assertEquals(FamilyAuthService.Result.OK, s.login("vaanga-vaanga", "1.2.3.4"));
    }
}
