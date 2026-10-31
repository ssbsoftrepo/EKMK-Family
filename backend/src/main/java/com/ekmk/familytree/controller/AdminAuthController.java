package com.ekmk.familytree.controller;

import com.ekmk.familytree.security.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Signing in to the admin site with the shared admin password. */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminAuthController {

    private final AdminAuthService auth;

    public AdminAuthController(AdminAuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody(required = false) Map<String, String> body, HttpServletRequest request) {
        String password = body == null ? null : body.get("password");
        return switch (auth.login(password, request.getRemoteAddr())) {
            case OK -> ResponseEntity.ok(Map.of("token", auth.issueToken()));
            case WRONG_PASSWORD -> ResponseEntity.status(401).body(Map.of("error", "That password isn't right. Please try again."));
            case LOCKED_OUT -> ResponseEntity.status(429).body(Map.of("error",
                    "Too many wrong tries. Please wait " + AdminAuthService.LOCKOUT.toMinutes() + " minutes and try again."));
            case NOT_CONFIGURED -> ResponseEntity.status(503).body(Map.of("error",
                    "The admin password is not set on the server yet. Set ADMIN_PASSWORD and restart the backend."));
        };
    }

    /** 200 when the session token is still good (the interceptor rejects it otherwise). */
    @GetMapping("/session")
    public ResponseEntity<Map<String, Boolean>> session() {
        return ResponseEntity.ok(Map.of("signedIn", true));
    }
}
