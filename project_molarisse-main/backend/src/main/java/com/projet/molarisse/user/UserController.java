package com.projet.molarisse.user;

import com.projet.molarisse.dto.ProfileUpdateRequest;
import com.projet.molarisse.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.projet.molarisse.dto.SecretaryApplicationRequest;
import com.projet.molarisse.dto.SecretaryActionRequest;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600, allowCredentials = "true")
public class UserController {
    private final UserService userService;
    private final FileStorageService fileStorageService;
    
   

    @GetMapping("/profile")
    public ResponseEntity<User> getCurrentUserProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest profileUpdateRequest
    ) {
        return ResponseEntity.ok(userService.updateProfile(authentication, profileUpdateRequest));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<User> uploadProfilePicture(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/") || file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().build();
        }
        User updatedUser = userService.updateProfilePicture(authentication, file);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/profile/picture/{fileName:.+}")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable String fileName) {
        try {
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(authentication, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Backend is working correctly");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<User>> getAllEnabledDoctors() {
        List<User> doctors = userService.getAllEnabledDoctors();
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/doctors/unassigned")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<List<User>> getUnassignedDoctors() {
        List<User> unassignedDoctors = userService.getUnassignedDoctors();
        return ResponseEntity.ok(unassignedDoctors);
    }

    @PostMapping("/secretary/apply")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<User> applyAsSecretary(
            Authentication authentication,
            @RequestParam("doctorId") Integer doctorId,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "file", required = false) MultipartFile cvFile
    ) {
        SecretaryApplicationRequest request = new SecretaryApplicationRequest();
        request.setDoctorId(doctorId);
        request.setMessage(message);
        
        User secretary = userService.applyAsSecretary(authentication, request, cvFile);
        return ResponseEntity.ok(secretary);
    }
    
    @GetMapping("/cv/{fileName:.+}")
    public ResponseEntity<Resource> getCVFile(@PathVariable String fileName) {
        try {
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/doctor/secretary-applications")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<User>> getSecretaryApplications(Authentication authentication) {
        List<User> applications = userService.getSecretaryApplications(authentication);
        return ResponseEntity.ok(applications);
    }
    
    @GetMapping("/doctor/secretaries")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<User>> getAssignedSecretaries(Authentication authentication) {
        List<User> secretaries = userService.getAssignedSecretaries(authentication);
        return ResponseEntity.ok(secretaries);
    }
    
    @PostMapping("/doctor/process-secretary")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<User> processSecretaryApplication(
            Authentication authentication,
            @Valid @RequestBody SecretaryActionRequest request
    ) {
        User secretary = userService.processSecretaryApplication(authentication, request);
        return ResponseEntity.ok(secretary);
    }
    
    @DeleteMapping("/doctor/secretary/{secretaryId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<User> removeSecretary(
            Authentication authentication,
            @PathVariable Integer secretaryId
    ) {
        User secretary = userService.removeSecretary(authentication, secretaryId);
        return ResponseEntity.ok(secretary);
    }
    
    @GetMapping("/secretary/doctor")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<User> getAssignedDoctor(Authentication authentication) {
        try {
            User doctor = userService.getAssignedDoctor(authentication);
            return ResponseEntity.ok(doctor);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/doctors/{id}")
    public ResponseEntity<User> getDoctorById(@PathVariable Integer id) {
        User doctor = userService.getDoctorById(id);
        return ResponseEntity.ok(doctor);
    }
}
