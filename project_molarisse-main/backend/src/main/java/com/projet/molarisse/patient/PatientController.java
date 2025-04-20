package com.projet.molarisse.patient;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import com.projet.molarisse.user.UserService;
import com.projet.molarisse.user.User;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {
    private static final Logger logger = LoggerFactory.getLogger(PatientController.class);
    private final FichePatientRepository fichePatientRepository;
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentPatient(Authentication authentication) {
        logger.info("Fetching current patient information");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            logger.info("Found current patient with ID: {}", currentUser.getId());
            return ResponseEntity.ok(currentUser);
        } catch (Exception e) {
            logger.error("Error fetching current patient: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching patient information");
        }
    }

    @GetMapping("/{patientId}/fiche")
    public ResponseEntity<?> getFichePatient(@PathVariable Integer patientId) {
        logger.info("Fetching fiche for patient ID: {}", patientId);
        
        var fichePatient = fichePatientRepository.findByPatientId(patientId.longValue());
        
        if (fichePatient.isPresent()) {
            logger.info("Found fiche for patient ID: {}", patientId);
            return ResponseEntity.ok(fichePatient.get());
        } else {
            logger.warn("No fiche found for patient ID: {}", patientId);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{patientId}/fiche")
    public ResponseEntity<?> createOrUpdateFichePatient(
            @PathVariable Integer patientId,
            @RequestBody FichePatient fichePatient) {
        logger.info("Creating/Updating fiche for patient ID: {}", patientId);
        
        fichePatient.setPatientId(patientId.longValue());
        FichePatient saved = fichePatientRepository.save(fichePatient);
        logger.info("Successfully saved fiche for patient ID: {}", patientId);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{patientId}/fiche")
    public ResponseEntity<?> updateFichePatient(
            @PathVariable Integer patientId,
            @RequestBody FichePatient fichePatient) {
        logger.info("Updating fiche for patient ID: {}", patientId);
        
        return fichePatientRepository.findByPatientId(patientId.longValue())
                .map(existing -> {
                    fichePatient.setId(existing.getId());
                    fichePatient.setPatientId(patientId.longValue());
                    FichePatient updated = fichePatientRepository.save(fichePatient);
                    logger.info("Successfully updated fiche for patient ID: {}", patientId);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
} 