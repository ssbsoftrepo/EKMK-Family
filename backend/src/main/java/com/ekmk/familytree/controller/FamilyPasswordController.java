package com.ekmk.familytree.controller;

import com.ekmk.familytree.security.FamilyAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The admin site's "Family website password" card: see whether it is on, set a new one, or turn it off.
 * Under /api/admin, so only the signed-in admin can use it (AdminAuthInterceptor).
 * The password itself is never sent back: it is kept hashed.
 */
@RestController
@RequestMapping("/api/admin/family-password")
@CrossOrigin(origins = "*")
public class FamilyPasswordController {

    private final FamilyAuthService family;

    public FamilyPasswordController(FamilyAuthService family) {
        this.family = family;
    }

    @GetMapping
    public Map<String, Object> status() {
        return body(family.status());
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> set(@RequestBody(required = false) Map<String, String> request) {
        String password = request == null ? null : request.get("password");
        try {
            return ResponseEntity.ok(body(family.setPassword(password)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping
    public Map<String, Object> turnOff() {
        return body(family.turnOff());
    }

    private static Map<String, Object> body(FamilyAuthService.Status s) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("on", s.on());
        out.put("source", s.source().name().toLowerCase());
        out.put("changedAt", s.changedAt() == null ? null : s.changedAt().toString());
        out.put("minLength", FamilyAuthService.MIN_LENGTH);
        return out;
    }
}
