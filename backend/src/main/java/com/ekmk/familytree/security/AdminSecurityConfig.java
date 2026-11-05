package com.ekmk.familytree.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Puts the password checks in front of every /api route: the admin password for changes and
 * admin reads ({@link AdminAuthInterceptor}), then the family password for the family website's
 * reads ({@link FamilyAuthInterceptor}).
 */
@Configuration
public class AdminSecurityConfig implements WebMvcConfigurer {

    private final AdminAuthInterceptor interceptor;
    private final FamilyAuthInterceptor familyInterceptor;

    public AdminSecurityConfig(AdminAuthInterceptor interceptor, FamilyAuthInterceptor familyInterceptor) {
        this.interceptor = interceptor;
        this.familyInterceptor = familyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor).addPathPatterns("/api/**");
        registry.addInterceptor(familyInterceptor).addPathPatterns("/api/**");
    }
}
