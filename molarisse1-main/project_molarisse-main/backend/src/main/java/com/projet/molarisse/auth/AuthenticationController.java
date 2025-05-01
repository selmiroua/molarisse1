package com.projet.molarisse.auth;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.projet.molarisse.user.UserService;
import com.projet.molarisse.user.User;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name= "Authentication")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthenticationController {
    private final AuthenticationService service;
    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<?> register(
            @RequestBody @Valid RegistrationRequest request

    ) throws MessagingException {
        service.register(request);
        return ResponseEntity.accepted().build();


    }
    @PostMapping("/authenticate")
    public  ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody @Valid AuthentificateRequest request
    ){
        return ResponseEntity.ok(service.authenticate(request));
    }
    @GetMapping("/activate-account")
    public  void confirm(
            @RequestParam String token
    ) throws MessagingException {
       service.activateAccount(token);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> getRoles() {
        List<String> roles = service.getRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/current-user")
    public ResponseEntity<UserBasicInfoDto> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userService.getCurrentUser(authentication);
        UserBasicInfoDto dto = new UserBasicInfoDto(user.getPrenom(), user.getNom(), user.getEmail(), user.getRole().getNom());
        return ResponseEntity.ok(dto);
    }
}

// DTO for returning basic user info
class UserBasicInfoDto {
    private String prenom;
    private String nom;
    private String email;
    private String role;

    public UserBasicInfoDto(String prenom, String nom, String email, String role) {
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.role = role;
    }

    public String getPrenom() { return prenom; }
    public String getNom() { return nom; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
