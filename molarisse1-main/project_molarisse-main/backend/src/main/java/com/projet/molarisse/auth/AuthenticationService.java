package com.projet.molarisse.auth;

import com.projet.molarisse.email.EmailService;
import com.projet.molarisse.email.EmailTemplateName;
import com.projet.molarisse.role.RoleRepository;
import com.projet.molarisse.security.JwtService;
import com.projet.molarisse.user.Token;
import com.projet.molarisse.user.TokenRepository;
import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    @Value("${application.mailing.frontend.activation:http://localhost:4200/activate-account}")
    private String activationUrl;

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    public void register(RegistrationRequest request) throws MessagingException {
        log.info("Starting registration process for user: {}", request.getEmail());
        var userRole =roleRepository.findByNom(request.getRole())
                .orElseThrow(()-> new IllegalStateException("Role " + request.getRole() + " n'est pas initialisé"));
        userRole.setNumbers(userRole.getNumbers() + 1);
        roleRepository.save(userRole);
        var user= User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .accountLocked(false)
                .enabled(false)  // ensure new users remain disabled by default for secure authentication
                .role(userRole)
                .build();
        userRepository.save(user);
        sendValidateEmail(user);
    }

    private void sendValidateEmail(User user) throws MessagingException {
        var newToken =generateAndSaveActivationToken(user);
        //send email

        emailService.sendEmail(
                user.getEmail(),
                user.fullname(),
                EmailTemplateName.ACTIVATE_ACCOUNT,
                activationUrl,
                newToken,
                "Account activation"



        );




    }

    private String generateAndSaveActivationToken(User user) {
        //generate a token
        String generatedToken =generateActivationCode (6);
        var token = Token.builder()
                .token(generatedToken)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .user(user)
                .build();
        tokenRepository.save(token);
        return generatedToken;
    }

    private String generateActivationCode(int length) {
        //elements that will compose my token
        String characters ="0123456789";
        StringBuilder codeBuilder =new StringBuilder();
        SecureRandom secureRandom =new SecureRandom();
        for (int i = 0; i < length; i++) {
            int index =secureRandom.nextInt(characters.length());//0..9
            codeBuilder.append(characters.charAt(index));
        }
        return codeBuilder.toString();
    }

    public AuthenticationResponse authenticate(@Valid AuthentificateRequest request) {
        log.info("Starting authentication process for user: {}", request.getEmail());

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        log.info("User found: {}, enabled status: {}", user.getEmail(), user.isEnabled());

        if (!user.isEnabled()) {
            throw new RuntimeException("Account is not enabled. Please activate your account.");
        }

        try {
            log.info("Attempting to authenticate user with email: {}", request.getEmail());
            var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
            log.info("Authentication successful for user: {}", request.getEmail());
            
            var claims = new HashMap<String, Object>();
            var authenticatedUser = ((User) auth.getPrincipal());
            claims.put("fullName", authenticatedUser.fullname());
            var jwtToken = jwtService.generateToken(claims, authenticatedUser);
            log.info("JWT token generated successfully");
            
            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .role(authenticatedUser.getRole().getNom())
                    .build();
        } catch (Exception e) {
            log.error("Authentication failed for user: {}, error: {}", request.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Authentication failed. Please check your credentials and try again.");
        }
    }
    @Transactional
    public void activateAccount(String token) throws MessagingException {
        log.info("Validating token: {}", token);
        Token savedToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token. Please request a new one."));

        if (LocalDateTime.now().isAfter(savedToken.getExpiresAt())) {
            log.warn("Token expired. Generating a new token and sending it to the user.");
            sendValidateEmail(savedToken.getUser());
            throw new RuntimeException("Token is expired. A new token has been sent to your email address.");
        }

        var user = userRepository.findById(savedToken.getUser().getId())
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        user.setEnabled(true);
        savedToken.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(savedToken);
        log.info("Account activated successfully for user: {}", user.getEmail());
    }

    public List<String> getRoles() {
        return roleRepository.findAll().stream()
                .map(role -> role.getNom())
                .collect(Collectors.toList());
    }
}
