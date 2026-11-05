package com.ekmk.familytree.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * When FAMILY_PASSWORD is set, the family website's reads (members, settings, stats…) need
 * the family session token, or the admin's (the admin site reads the same endpoints).
 * Changes and /api/admin reads are guarded by {@link AdminAuthInterceptor} as before.
 *
 * Left open: signing in, the session check, the health check and the photo files
 * (an &lt;img&gt; cannot send a token; photo names are random and only appear in the
 * protected member data).
 */
@Component
public class FamilyAuthInterceptor implements HandlerInterceptor {

    private static final String BEARER = "Bearer ";

    private final FamilyAuthService family;
    private final AdminAuthService admin;

    public FamilyAuthInterceptor(FamilyAuthService family, AdminAuthService admin) {
        this.family = family;
        this.admin = admin;
    }

    public static boolean needsFamily(String method, String path) {
        boolean read = "GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method);
        if (!read) return false; // OPTIONS passes; changes are the admin interceptor's job
        if (path.startsWith("/api/admin/") || "/api/admin".equals(path)) return false;
        if (path.startsWith("/api/family/")) return false;
        return !path.startsWith("/api/media/photos/");
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if (!family.isRequired()) return true;
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (!needsFamily(request.getMethod(), path)) return true;
        String token = bearer(request);
        if (family.isValid(token) || admin.isValid(token)) return true;
        response.setStatus(401);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"Please enter the family password.\"}");
        return false;
    }

    static String bearer(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return header != null && header.startsWith(BEARER) ? header.substring(BEARER.length()).trim() : null;
    }
}
