package com.projet.molarisse.user;

import com.projet.molarisse.dto.ProfileUpdateRequest;
import com.projet.molarisse.handler.BusinessErrorCodes;
import com.projet.molarisse.service.FileStorageService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import com.projet.molarisse.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;
import com.projet.molarisse.dto.SecretaryApplicationRequest;
import com.projet.molarisse.dto.SecretaryActionRequest;
import com.projet.molarisse.role.Role;
import com.projet.molarisse.notifications.NotificationService;
import com.projet.molarisse.notification.NotificationType;
import com.projet.molarisse.user.SecretaryStatus;
import com.projet.molarisse.role.RoleRepository;

@Service
@RequiredArgsConstructor
public class UserService {
    private  final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateProfile(Authentication authentication, UpdateProfileRequest request) {
        // First verify if the oldEmail matches the authenticated user
        String authenticatedEmail = authentication.getName();
        if (request.getOldEmail() != null && !request.getOldEmail().equals(authenticatedEmail)) {
            throw new IllegalArgumentException(BusinessErrorCodes.UNAUTHORIZED_PROFILE_MODIFICATION.getDescription());
        }

        User user = userRepository.findByEmail(request.getOldEmail() != null ? request.getOldEmail() : authenticatedEmail)
                .orElseThrow(() -> new EntityNotFoundException(BusinessErrorCodes.USER_NOT_FOUND.getDescription()));
        
        if (request.getNom() != null) {
            user.setNom(request.getNom());
        }
        if (request.getPrenom() != null) {
            user.setPrenom(request.getPrenom());
        }
        if (request.getEmail() != null && !user.getEmail().equals(request.getEmail())) {
            // Check if email is already taken
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalArgumentException(BusinessErrorCodes.EMAIL_ALREADY_EXISTS.getDescription());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getDateNaissance() != null) {
            user.setDateNaissance(request.getDateNaissance());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userRepository.save(user);
    }

    @Transactional
    public User updateProfile(Authentication authentication, ProfileUpdateRequest profileUpdateRequest) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Update user fields only if they are provided
        if (profileUpdateRequest.getNom() != null && !profileUpdateRequest.getNom().isEmpty()) {
            user.setNom(profileUpdateRequest.getNom());
        }
        
        if (profileUpdateRequest.getPrenom() != null && !profileUpdateRequest.getPrenom().isEmpty()) {
            user.setPrenom(profileUpdateRequest.getPrenom());
        }
        
        if (profileUpdateRequest.getEmail() != null && !profileUpdateRequest.getEmail().isEmpty()) {
            // Check if email is already taken by another user
            if (!user.getEmail().equals(profileUpdateRequest.getEmail()) && 
                userRepository.findByEmail(profileUpdateRequest.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(profileUpdateRequest.getEmail());
        }
        
        if (profileUpdateRequest.getAddress() != null && !profileUpdateRequest.getAddress().isEmpty()) {
            user.setAddress(profileUpdateRequest.getAddress());
        }
        
        if (profileUpdateRequest.getPhoneNumber() != null && !profileUpdateRequest.getPhoneNumber().isEmpty()) {
            user.setPhoneNumber(profileUpdateRequest.getPhoneNumber());
        }
        
        if (profileUpdateRequest.getDateNaissance() != null) {
            user.setDateNaissance(profileUpdateRequest.getDateNaissance());
        }

        return userRepository.save(user);
    }

    @Transactional
    public User updateProfilePicture(Authentication authentication, MultipartFile file) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Delete old profile picture if it exists
        if (user.getProfilePicturePath() != null) {
            fileStorageService.deleteFile(user.getProfilePicturePath());
        }

        // Store new profile picture
        String fileName = fileStorageService.storeFile(file);
        user.setProfilePicturePath(fileName);

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Authentication authentication, ChangePasswordRequest request) {
        User user = getCurrentUser(authentication);
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
   
    @Transactional
    public User updateUserFiles(Authentication authentication, UpdateProfileRequest request) {
        User user = getCurrentUser(authentication);
        // Update user files based on the request
        if (request.getCertificationFilePath() != null) {
            user.setCertificationFilePath(request.getCertificationFilePath());
        }
        if (request.getPatenteFilePath() != null) {
            user.setPatenteFilePath(request.getPatenteFilePath());
        }
        if (request.getSpecialities() != null) {
            user.setSpecialities(request.getSpecialities());
        }

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<User> getAllEnabledDoctors() {
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
        return userRepository.findByRoleAndEnabledTrue(doctorRole);
    }

    /**
     * Get all doctors who are not assigned to any secretary
     * 
     * @return List of doctors without an assigned secretary
     */
    @Transactional(readOnly = true)
    public List<User> getUnassignedDoctors() {
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
        
        // Get all enabled doctors
        List<User> allDoctors = userRepository.findByRoleAndEnabledTrue(doctorRole);
        
        // Filter out doctors who already have secretaries
        return allDoctors.stream()
                .filter(doctor -> doctor.getSecretaries() == null || doctor.getSecretaries().isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional
    public User applyAsSecretary(Authentication authentication, SecretaryApplicationRequest request, MultipartFile cvFile) {
        User secretary = getCurrentUser(authentication);
        
        // Verify user is a secretary
        if (!secretary.getRole().getNom().equalsIgnoreCase("secretaire")) {
            throw new IllegalArgumentException("Only users with secretary role can apply");
        }
        
        // Check if already assigned to a doctor
        if (secretary.getAssignedDoctor() != null && secretary.getSecretaryStatus() == SecretaryStatus.APPROVED) {
            throw new IllegalArgumentException("You are already assigned to a doctor");
        }
        
        // Find the doctor
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));
        
        // Verify doctor has doctor role
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Selected user is not a doctor");
        }
        
        // Store the CV file
        if (cvFile != null && !cvFile.isEmpty()) {
            // Delete old CV if exists
            if (secretary.getCvFilePath() != null) {
                fileStorageService.deleteFile(secretary.getCvFilePath());
            }
            
            String fileName = fileStorageService.storeFile(cvFile);
            secretary.setCvFilePath(fileName);
        }
        
        // Update secretary data
        secretary.setAssignedDoctor(doctor);
        secretary.setSecretaryStatus(SecretaryStatus.PENDING);
        
        // Create notification for the doctor
        String message = "Secretary " + secretary.fullname() + " has applied to work with you";
        String link = "/doctor/secretary-applications";
        notificationService.createNotification(doctor, message, NotificationType.SECRETARY_APPLICATION, link);
        
        return userRepository.save(secretary);
    }
    
    @Transactional
    public User processSecretaryApplication(Authentication authentication, SecretaryActionRequest request) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can process secretary applications");
        }
        
        // Find the secretary
        User secretary = userRepository.findById(request.getSecretaryId())
                .orElseThrow(() -> new EntityNotFoundException("Secretary not found"));
        
        // Verify this secretary has applied to this doctor
        if (secretary.getAssignedDoctor() == null || !secretary.getAssignedDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("This secretary has not applied to work with you");
        }
        
        // Update secretary status
        secretary.setSecretaryStatus(request.getAction());
        
        // If rejected, clear the assignedDoctor
        if (request.getAction() == SecretaryStatus.REJECTED) {
            secretary.setAssignedDoctor(null);
        }
        
        // Create notification for the secretary
        String statusText = request.getAction() == SecretaryStatus.APPROVED ? "approved" : "rejected";
        String message = "Doctor " + doctor.fullname() + " has " + statusText + " your application";
        String link = "/secretary/dashboard";
        notificationService.createNotification(secretary, message, NotificationType.SECRETARY_APPLICATION_RESPONSE, link);
        
        return userRepository.save(secretary);
    }
    
    @Transactional
    public User removeSecretary(Authentication authentication, Integer secretaryId) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can remove assigned secretaries");
        }
        
        // Find the secretary
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new EntityNotFoundException("Secretary not found"));
        
        // Verify this secretary is assigned to this doctor
        if (secretary.getAssignedDoctor() == null || !secretary.getAssignedDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("This secretary is not assigned to you");
        }
        
        // Remove assignment
        secretary.setAssignedDoctor(null);
        secretary.setSecretaryStatus(SecretaryStatus.NONE);
        
        // Create notification for the secretary
        String message = "Doctor " + doctor.fullname() + " has removed you from their team";
        String link = "/secretary/dashboard";
        notificationService.createNotification(secretary, message, NotificationType.SECRETARY_REMOVED, link);
        
        return userRepository.save(secretary);
    }
    
    @Transactional(readOnly = true)
    public List<User> getSecretaryApplications(Authentication authentication) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can view secretary applications");
        }
        
        return userRepository.findByAssignedDoctorIdAndSecretaryStatus(doctor.getId(), SecretaryStatus.PENDING);
    }
    
    @Transactional(readOnly = true)
    public List<User> getAssignedSecretaries(Authentication authentication) {
        User doctor = getCurrentUser(authentication);
        
        // Verify user is a doctor
        if (!doctor.getRole().getNom().equalsIgnoreCase("doctor")) {
            throw new IllegalArgumentException("Only doctors can view their secretaries");
        }
        
        return userRepository.findByAssignedDoctorIdAndSecretaryStatus(doctor.getId(), SecretaryStatus.APPROVED);
    }
    
    @Transactional(readOnly = true)
    public User getAssignedDoctor(Authentication authentication) {
        User secretary = getCurrentUser(authentication);
        
        // Verify user is a secretary
        if (!secretary.getRole().getNom().equalsIgnoreCase("secretaire")) {
            throw new IllegalArgumentException("Only secretaries can view their assigned doctor");
        }
        
        if (secretary.getAssignedDoctor() == null) {
            throw new EntityNotFoundException("You are not assigned to any doctor");
        }
        
        return secretary.getAssignedDoctor();
    }

    @Transactional(readOnly = true)
    public User getDoctorById(Integer id) {
        Role doctorRole = roleRepository.findByNom("doctor")
                .orElseThrow(() -> new EntityNotFoundException("Doctor role not found"));
                
        return userRepository.findByIdAndRole(id, doctorRole)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with id: " + id));
    }
}
