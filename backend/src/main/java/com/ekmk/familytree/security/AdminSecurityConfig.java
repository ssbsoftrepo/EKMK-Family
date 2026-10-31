package com.ekmk.familytree.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Puts the admin password check in front of every /api route (see {@link AdminAuthInterceptor}). */
@Configuration
public class AdminSecurityConfig implements WebMvcConfigurer {

    private final AdminAuthInterceptor interceptor;

    public AdminSecurityConfig(AdminAuthInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor).addPathPatterns("/api/**");
    }
}
