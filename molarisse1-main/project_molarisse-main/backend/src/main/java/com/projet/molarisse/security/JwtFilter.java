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
        System.out.println("[DEBUG] Processing request for path: " + path);

        // Skip filter for OPTIONS requests
        if (request.getMethod().equals("OPTIONS")) {
            System.out.println("[DEBUG] Skipping JWT filter for OPTIONS request");
            response.setStatus(HttpServletResponse.SC_OK);
            filterChain.doFilter(request, response);
            return;
        }

        // Skip filter for authentication endpoints
        if ((path.startsWith("/api/v1/auth/authenticate") || 
             path.startsWith("/api/v1/auth/register") ||
             path.startsWith("/api/v1/auth/roles") ||
             path.startsWith("/api/v1/auth/activate-account"))) {
            System.out.println("[DEBUG] Skipping JWT filter for public auth endpoint: " + path);
            filterChain.doFilter(request, response);
            return;
        }

        // Skip filter for CV file requests with token parameter
        if (path.contains("/cv/") && request.getParameter("token") != null) {
            System.out.println("[DEBUG] Skipping JWT filter for CV request with token parameter");
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        System.out.println("[DEBUG] Authorization header: " + authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[DEBUG] No valid Authorization header found");
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt;
        final String userEmail;
        jwt = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwt);

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            System.out.println("[DEBUG] User details loaded: " + userDetails.getUsername() + ", Authorities: " + userDetails.getAuthorities());
            
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("[DEBUG] Authentication set in SecurityContext");
            } else {
                System.out.println("[DEBUG] Invalid JWT token");
            }
        }

        filterChain.doFilter(request, response);
    }
}
