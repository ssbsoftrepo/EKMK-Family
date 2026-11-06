package com.ekmk.familytree.controller;

import com.ekmk.familytree.security.AdminAuthService;
import com.ekmk.familytree.security.FamilyAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Signing in to the family website with the shared family password. */
@RestController
@RequestMapping("/api/family")
@CrossOrigin(origins = "*")
public class FamilyAuthController {

    private final FamilyAuthService family;
    private final AdminAuthService admin;

    public FamilyAuthController(FamilyAuthService family, AdminAuthService admin) {
        this.family = family;
        this.admin = admin;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody(required = false) Map<String, String> body, HttpServletRequest request) {
        String password = body == null ? null : body.get("password");
        return switch (family.login(password, FamilyAuthService.clientAddress(request))) {
            case OK -> ResponseEntity.ok(Map.of("token", family.issueToken()));
            case WRONG_PASSWORD -> ResponseEntity.status(401).body(Map.of("error", "That password isn't right. Please try again."));
            case LOCKED_OUT -> ResponseEntity.status(429).body(Map.of("error",
                    "Too many wrong tries. Please wait " + FamilyAuthService.LOCKOUT.toMinutes() + " minutes and try again."));
            // No password set: the website is open, so any sign-in simply works.
            case NOT_CONFIGURED -> ResponseEntity.ok(Map.of("token", ""));
        };
    }

    /** Whether the website asks for the password, and whether the given token (if any) is still good. */
    @GetMapping("/session")
    public Map<String, Boolean> session(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7).trim() : null;
        boolean required = family.isRequired();
        boolean signedIn = !required || family.isValid(token) || admin.isValid(token);
        return Map.of("required", required, "signedIn", signedIn);
    }
}
