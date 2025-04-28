package com.projet.molarisse.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Service
@RequiredArgsConstructor
// bch nrj3ouha filter lezm el extends ethika
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getServletPath();
        logger.info("Request path: {}", path);
        
        // Skip filter for auth endpoints
        if(path.contains("/auth")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Skip filter for CV file requests with token parameter
        if((path.contains("/api/users/cv/") || path.contains("/api/v1/api/users/cv/")) && 
           request.getParameter("token") != null) {
            logger.info("CV request with token parameter detected, skipping JWT filter");
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            logger.info("Authorization Header: {}", authHeader);
            final String jwt;
            final String userEmail;
            if(authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("Authorization header is missing or invalid.");
                filterChain.doFilter(request, response);
                return;
            }
            jwt = authHeader.substring(7);
            logger.info("Extracted JWT Token: {}", jwt);
            userEmail = jwtService.extractUsername(jwt);
            logger.info("Extracted Username: {}", userEmail);
            if(userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                if(jwtService.isTokenValid(jwt, userDetails)) {
                    logger.info("Token is valid for user: {}", userEmail);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    logger.warn("Token is invalid for user: {}", userEmail);
                }
            }
        } catch (Exception e) {
            logger.error("JWT processing error: {}", e.getMessage(), e);
            throw new AuthenticationServiceException("JWT validation failed", e);
        }
        filterChain.doFilter(request, response);
    }
}
