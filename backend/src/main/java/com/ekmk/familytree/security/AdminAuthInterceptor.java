package com.ekmk.familytree.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * The family website has no login, so it may only read the public answers.
 * Everything else under /api needs the admin session token:
 * every change (POST, PUT, PATCH, DELETE) and every read under /api/admin
 * (full records with addresses and emails), except the health check and signing in.
 */
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    public static final String HEADER = "Authorization";
    private static final String BEARER = "Bearer ";

    private final AdminAuthService auth;

    public AdminAuthInterceptor(AdminAuthService auth) {
        this.auth = auth;
    }

    public static boolean needsAdmin(String method, String path) {
        if ("OPTIONS".equalsIgnoreCase(method)) return false;
        if ("/api/admin/login".equals(path) || "/api/admin/health".equals(path)) return false;
        boolean read = "GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method);
        if (!read) return true;
        return path.startsWith("/api/admin/") || "/api/admin".equals(path);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (!needsAdmin(request.getMethod(), path)) return true;
        if (!auth.isConfigured()) {
            reject(response, 503, "The admin password is not set on the server yet. Set ADMIN_PASSWORD and restart the backend.");
            return false;
        }
        String header = request.getHeader(HEADER);
        String token = header != null && header.startsWith(BEARER) ? header.substring(BEARER.length()).trim() : null;
        if (!auth.isValid(token)) {
            reject(response, 401, "Please sign in to the admin site.");
            return false;
        }
        return true;
    }

    private static void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + message.replace("\"", "'") + "\"}");
    }
}
