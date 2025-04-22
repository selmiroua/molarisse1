package com.projet.molarisse.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;



@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfig {
    private final JwtFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200")); // Update with your frontend URL
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(req -> 
                    req.requestMatchers(
                            "/api/v1/v2/api-docs",
                            "/api/v1/v3/api-docs",
                            "/api/v1/swagger-resources/**",
                            "/api/v1/configuration/ui",
                            "/api/v1/configuration/security",
                            "/api/v1/swagger-ui/**",
                            "/api/v1/webjars/**",
                            "/api/v1/swagger-ui.html"
                    ).permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/appointments/book").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/appointments/patient").hasRole("PATIENT")
                    .requestMatchers(HttpMethod.GET, "/api/appointments/patient/**").hasRole("PATIENT")
                    .requestMatchers(HttpMethod.PUT, "/api/appointments/{appointmentId}").hasAnyRole("PATIENT", "DOCTOR", "SECRETAIRE")
                    .requestMatchers(HttpMethod.GET, "/api/appointments/doctor/{doctorId}/appointments").hasAnyRole("PATIENT", "DOCTOR", "SECRETAIRE")
                    .requestMatchers(HttpMethod.GET, "/api/appointments/doctor/**").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.GET, "/api/appointments/my-doctor-appointments").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.GET, "/api/appointments/secretary/**").hasRole("SECRETAIRE")
                    .requestMatchers(HttpMethod.PUT, "/api/appointments/status/{appointmentId}").hasRole("SECRETAIRE")
                    .requestMatchers(HttpMethod.PUT, "/api/appointments/update-status").hasRole("SECRETAIRE")
                    .requestMatchers(HttpMethod.POST, "/api/appointments/{appointmentId}/fiche-patient").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/fiche-patient").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/appointments/{appointmentId}/interventions").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/interventions").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/appointments/{appointmentId}/interventions/{interventionId}").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.DELETE, "/api/appointments/{appointmentId}/interventions/{interventionId}").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.POST, "/api/appointments/{appointmentId}/documents").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/documents").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/appointments/{appointmentId}/documents/{documentId}").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/appointments/{appointmentId}/documents/{documentId}").hasAnyRole("DOCTOR", "SECRETAIRE")
                    .requestMatchers(HttpMethod.GET,"/api/painets/me").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/patients/{patientId}/fiche").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/patients/{patientId}/fiche").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/users/doctors/{id}").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/users/profile").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/users/profile").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/users/profile/picture/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/users/profile/picture").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/users/password").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/users/test").permitAll()
                     // Allow demande pictures viewing
                                .requestMatchers(HttpMethod.GET, "/api/v1/demandes/pictures/**").permitAll()
                                // Allow doctors endpoints
                                .requestMatchers(HttpMethod.GET, "/api/users/doctors/accepted").permitAll()
                                // Demande endpoints (authenticated but no specific role required)
                                .requestMatchers(HttpMethod.POST, "/api/v1/demandes").permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/v1/demandes/secretary").permitAll() // Allow secretary requests
                                .requestMatchers(HttpMethod.GET, "/api/v1/demandes/check").authenticated()
                                // Demande management endpoints (admin only)
                                .requestMatchers(HttpMethod.GET, "/api/v1/demandes/all").hasRole("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/v1/demandes/{id}/status").hasRole("ADMIN")
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/notifications/**").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/notifications/**").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/users/secretary/apply").hasRole("SECRETAIRE")
                    .requestMatchers(HttpMethod.GET, "/api/users/doctor/secretary-applications").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.GET, "/api/users/doctor/secretaries").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.POST, "/api/users/doctor/process-secretary").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.DELETE, "/api/users/doctor/secretary/**").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.GET, "/api/users/secretary/requests").hasRole("DOCTOR")
                    .requestMatchers(HttpMethod.GET, "/api/users/secretary/doctor").hasRole("SECRETAIRE")
                    .requestMatchers(HttpMethod.GET, "/api/users/cv/**").authenticated()
                    .requestMatchers("/api/doctor-verifications/pending").hasRole("ADMIN")
                    .requestMatchers("/api/doctor-verifications/status/*").hasRole("ADMIN")
                    .requestMatchers("/api/doctor-verifications/check/*").authenticated()
                    .requestMatchers("/api/doctor-verifications/approved").permitAll()
                    .requestMatchers("/api/doctor-verifications/**").hasRole("DOCTOR")
                    .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
    
}

