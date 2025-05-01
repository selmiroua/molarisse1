package com.projet.molarisse.patient;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"}, allowCredentials = "true", maxAge = 3600)
public class PatientController {
    // ... existing code ...
} 