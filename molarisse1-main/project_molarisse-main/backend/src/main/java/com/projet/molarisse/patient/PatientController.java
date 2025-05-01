package com.projet.molarisse.patient;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import com.projet.molarisse.user.UserService;
import com.projet.molarisse.user.User;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.ArrayList;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import com.projet.molarisse.appointment.AppointmentDocument;
import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;
import java.nio.file.StandardCopyOption;
import org.springframework.transaction.annotation.Transactional;
import com.projet.molarisse.appointment.AppointmentDocumentRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import com.projet.molarisse.service.FileStorageService;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", 
    allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
    allowCredentials = "true",
    maxAge = 3600)
public class PatientController {
    private static final Logger logger = LoggerFactory.getLogger(PatientController.class);
    private final FichePatientRepository fichePatientRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final AppointmentDocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    @Value("${file.upload-dir}")
    private String uploadDir;

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

    @GetMapping("/me/fiche")
    public ResponseEntity<?> getCurrentPatientFiche(Authentication authentication) {
        logger.info("Fetching fiche for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            var fichePatient = fichePatientRepository.findByPatientId(currentUser.getId());
            
            if (fichePatient.isPresent()) {
                logger.info("Found fiche for current patient");
                return ResponseEntity.ok(fichePatient.get());
            } else {
                logger.warn("No fiche found for current patient");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching current patient fiche: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching patient fiche");
        }
    }

    @PostMapping("/me/fiche")
    @Transactional
    public ResponseEntity<?> createOrUpdateCurrentPatientFiche(
            @RequestBody FichePatient fichePatient,
            Authentication authentication) {
        logger.info("Creating/Updating fiche for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            fichePatient.setPatientId(currentUser.getId());
            
            // Save the fiche patient
            FichePatient savedFiche = fichePatientRepository.save(fichePatient);
            logger.info("Successfully saved fiche patient with ID: {}", savedFiche.getId());
            
            return ResponseEntity.ok(savedFiche);
        } catch (Exception e) {
            logger.error("Error in createOrUpdateCurrentPatientFiche: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error saving patient fiche: " + e.getMessage());
        }
    }

    @PutMapping("/me/fiche")
    public ResponseEntity<?> updateCurrentPatientFiche(
            @RequestBody FichePatient fichePatient,
            Authentication authentication) {
        logger.info("Updating fiche for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            return fichePatientRepository.findByPatientId(currentUser.getId())
                    .map(existing -> {
                        fichePatient.setId(existing.getId());
                        fichePatient.setPatientId(currentUser.getId());
                        FichePatient updated = fichePatientRepository.save(fichePatient);
                        logger.info("Successfully updated fiche for current patient");
                        return ResponseEntity.ok(updated);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating current patient fiche: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error updating patient fiche");
        }
    }

    @GetMapping("/{patientId}/fiche")
    public ResponseEntity<?> getFichePatient(@PathVariable Integer patientId) {
        logger.info("Fetching fiche for patient ID: {}", patientId);
        
        var fichePatient = fichePatientRepository.findByPatientId(patientId);
        
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
        
        fichePatient.setPatientId(patientId);
        FichePatient saved = fichePatientRepository.save(fichePatient);
        logger.info("Successfully saved fiche for patient ID: {}", patientId);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{patientId}/fiche")
    public ResponseEntity<?> updateFichePatient(
            @PathVariable Integer patientId,
            @RequestBody FichePatient fichePatient) {
        logger.info("Updating fiche for patient ID: {}", patientId);
        
        return fichePatientRepository.findByPatientId(patientId)
                .map(existing -> {
                    fichePatient.setId(existing.getId());
                    fichePatient.setPatientId(patientId);
                    FichePatient updated = fichePatientRepository.save(fichePatient);
                    logger.info("Successfully updated fiche for patient ID: {}", patientId);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/fiche/document")
    public ResponseEntity<?> getCurrentPatientDocument(Authentication authentication) {
        logger.info("Fetching document for current patient");
        try {
            User currentUser = userService.getCurrentUser(authentication);
            var fichePatient = fichePatientRepository.findByPatientId(currentUser.getId());
            
            if (fichePatient.isPresent() && fichePatient.get().getDocumentPath() != null) {
                FichePatient fiche = fichePatient.get();
                logger.info("Found document path: {}", fiche.getDocumentPath());
                
                try {
                    String documentPath = fiche.getDocumentPath();
                    logger.info("Loading document from path: {}", documentPath);
                    
                    // If the documentPath doesn't already include a subdirectory, add the documents prefix
                    if (!documentPath.contains("/")) {
                        documentPath = "documents/" + documentPath;
                    }
                    
                    Resource resource = fileStorageService.loadFileAsResource(documentPath);
                    logger.info("Successfully loaded document resource");
                    
                    // Determine content type
                    String contentType = fiche.getDocumentType();
                    if (contentType == null || contentType.isEmpty()) {
                        contentType = "application/octet-stream";
                    }
                    logger.info("Using content type: {}", contentType);
                    
                    // Set filename
                    String filename = fiche.getDocumentName();
                    if (filename == null || filename.isEmpty()) {
                        filename = "document";
                    }
                    logger.info("Using filename: {}", filename);
                    
                    // Build response
                    return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                        .header(HttpHeaders.PRAGMA, "no-cache")
                        .header(HttpHeaders.EXPIRES, "0")
                        .body(resource);
                } catch (Exception e) {
                    logger.error("Error loading document: {}", e.getMessage(), e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("error", "Error loading document: " + e.getMessage()));
                }
            }
            
            logger.warn("No document found for patient ID: {}", currentUser.getId());
            return ResponseEntity.notFound()
                .build();
        } catch (Exception e) {
            logger.error("Error retrieving document: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("error", "Error retrieving document: " + e.getMessage()));
        }
    }

    @GetMapping("/me/fiche/document/download")
    public ResponseEntity<Resource> downloadDocument(Authentication authentication) {
        try {
            User currentUser = userService.getCurrentUser(authentication);
            var fichePatient = fichePatientRepository.findByPatientId(currentUser.getId());
            
            if (fichePatient.isPresent() && fichePatient.get().getDocumentPath() != null) {
                FichePatient fiche = fichePatient.get();
                // Combine base upload path with stored relative path
                Path filePath = Paths.get(uploadDir).resolve(fiche.getDocumentPath());
                
                if (!Files.exists(filePath)) {
                    logger.error("Document file not found: {}", filePath);
                    return ResponseEntity.notFound().build();
                }
                
                Resource resource = new UrlResource(filePath.toUri());
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fiche.getDocumentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fiche.getDocumentName() + "\"")
                    .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error downloading document: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/me/fiche/document")
    @Transactional
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        logger.info("Starting document upload process");
        try {
            if (file.isEmpty()) {
                logger.error("Failed to upload empty file");
                return ResponseEntity.badRequest().body("Please select a file to upload");
            }

            logger.info("File details - Name: {}, Size: {}, Content Type: {}", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());

            User currentUser = userService.getCurrentUser(authentication);
            logger.info("Processing upload for user ID: {}", currentUser.getId());

            // First, try to find existing fiche
            var fichePatient = fichePatientRepository.findByPatientId(currentUser.getId());
            FichePatient fiche;

            if (fichePatient.isEmpty()) {
                logger.info("No existing fiche found, creating new one");
                fiche = new FichePatient();
                fiche.setPatientId(currentUser.getId());
                fiche.setNom(currentUser.getNom());
                fiche.setPrenom(currentUser.getPrenom());
                // Initialize documents list
                fiche.setDocuments(new ArrayList<>());
                // Save the initial fiche to get an ID
                fiche = fichePatientRepository.save(fiche);
                logger.info("Created new fiche with ID: {}", fiche.getId());
            } else {
                logger.info("Found existing fiche with ID: {}", fichePatient.get().getId());
                fiche = fichePatient.get();
                if (fiche.getDocuments() == null) {
                    fiche.setDocuments(new ArrayList<>());
                }
            }

            // Validate file type
            String contentType = file.getContentType();
            logger.info("Validating file type: {}", contentType);

            if (contentType != null && (contentType.startsWith("image/") || contentType.equals("application/pdf"))) {
                try {
                    // Delete old document if exists
                    if (fiche.getDocumentPath() != null) {
                        logger.info("Deleting old document: {}", fiche.getDocumentPath());
                        fileStorageService.deleteFile(fiche.getDocumentPath());
                        // Clear existing documents
                        fiche.getDocuments().clear();
                    }

                    // Store the file in the documents subdirectory
                    logger.info("Storing new document in documents subdirectory");
                    String storedFileName = fileStorageService.storeFile(file, "documents");
                    logger.info("File stored successfully with name: {}", storedFileName);

                    // Update fiche with document info first
                    fiche.setDocumentName(file.getOriginalFilename());
                    fiche.setDocumentPath(storedFileName);
                    fiche.setDocumentType(file.getContentType());
                    fiche.setDocumentSize(file.getSize());

                    // Save the fiche first to ensure it exists
                    fiche = fichePatientRepository.save(fiche);

                    // Create and save the document
                    AppointmentDocument document = AppointmentDocument.builder()
                        .documentType(AppointmentDocument.DocumentType.PATIENT)
                        .name(file.getOriginalFilename())
                        .filePath(storedFileName)
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .uploadDate(LocalDateTime.now())
                        .fichePatient(fiche)  // Set the relationship directly
                        .build();

                    // Save the document
                    document = documentRepository.save(document);

                    // Add document to fiche's documents list
                    fiche.getDocuments().add(document);

                    // Save the final fiche
                    FichePatient updatedFiche = fichePatientRepository.save(fiche);
                    logger.info("Successfully saved fiche with document");

                    return ResponseEntity.ok(updatedFiche);
                } catch (Exception e) {
                    logger.error("Failed to store file: {}", e.getMessage(), e);
                    throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
                }
            } else {
                logger.warn("Invalid file type: {}", contentType);
                return ResponseEntity.badRequest().body("Invalid file type. Only images and PDFs are allowed");
            }
        } catch (Exception e) {
            logger.error("Error in document upload process: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error uploading document: " + e.getMessage());
        }
    }
}