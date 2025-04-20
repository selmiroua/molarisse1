package com.projet.molarisse.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    private String prenom;

    private String nom;

    @Email(message = "Please provide a valid email address")
    private String email;

    private String address;

    @Pattern(regexp = "^[0-9]{8}$", message = "Phone number must be 8 digits")
    private String phoneNumber;
    
    private LocalDate dateNaissance;
}
