package com.projet.molarisse.appointment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.projet.molarisse.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Appointment> bookAppointment(@RequestBody AppointmentRequest request) {
        Appointment appointment = appointmentService.bookAppointment(
                request.getPatientId(),
                request.getDoctorId(),
                request.getAppointmentDateTime(),
                request.getCaseType(),
                request.getAppointmentType(),
                request.getNotes());
        return ResponseEntity.ok(appointment);
    }

  


    @GetMapping("/my-doctor-appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<Map<String, Object>>> getMyDoctorAppointments() {
        // Get the authenticated doctor
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User doctor = (User) authentication.getPrincipal();
        Integer doctorId = doctor.getId();
        
        List<Appointment> appointments = appointmentService.getAppointmentsForDoctor(doctorId);
        
        List<Map<String, Object>> simplifiedAppointments = appointments.stream()
            .map(appointment -> {
                Map<String, Object> simplified = new HashMap<>();
                simplified.put("id", appointment.getId());
                simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                simplified.put("status", appointment.getStatus());
                simplified.put("appointmentType", appointment.getAppointmentType());
                simplified.put("caseType", appointment.getCaseType());
                simplified.put("notes", appointment.getNotes());
                
                if (appointment.getPatient() != null) {
                    Map<String, Object> patient = new HashMap<>();
                    patient.put("id", appointment.getPatient().getId());
                    patient.put("nom", appointment.getPatient().getNom());
                    patient.put("prenom", appointment.getPatient().getPrenom());
                    patient.put("email", appointment.getPatient().getEmail());
                    patient.put("phoneNumber", appointment.getPatient().getPhoneNumber());
                    simplified.put("patient", patient);
                }
                
                return simplified;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(simplifiedAppointments);
    }

   

    @GetMapping("/secretary/{secretaryId}")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<List<Appointment>> getAppointmentsForSecretary(
            @PathVariable Integer secretaryId,
            Authentication authentication
    ) {
        // Verify the authenticated user is the requested secretary
        User authenticatedUser = (User) authentication.getPrincipal();
        if (!authenticatedUser.getId().equals(secretaryId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Appointment> appointments = appointmentService.getAppointmentsForSecretary(secretaryId);
            return ResponseEntity.ok(appointments);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(List.of());
        }
    }

    @PutMapping("/status/{appointmentId}")
    @PreAuthorize("hasRole('SECRETAIRE')")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Integer appointmentId,
            @RequestBody Map<String, String> statusMap,
            Authentication authentication
    ) {
        User secretary = (User) authentication.getPrincipal();
        Appointment.AppointmentStatus status = Appointment.AppointmentStatus.valueOf(statusMap.get("status"));
        
        try {
            Appointment updatedAppointment = appointmentService.updateAppointmentStatus(appointmentId, status, secretary.getId());
            return ResponseEntity.ok(updatedAppointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping("/my-appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Map<String, Object>>> getMyAppointments() {
        // Get the authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        Integer patientId = user.getId();
        
        List<Appointment> appointments = appointmentService.getAppointmentsForPatient(patientId);
        
        List<Map<String, Object>> simplifiedAppointments = appointments.stream()
            .map(appointment -> {
                Map<String, Object> simplified = new HashMap<>();
                simplified.put("id", appointment.getId());
                simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                simplified.put("status", appointment.getStatus());
                simplified.put("appointmentType", appointment.getAppointmentType());
                simplified.put("caseType", appointment.getCaseType());
                simplified.put("notes", appointment.getNotes());
                
                if (appointment.getDoctor() != null) {
                    Map<String, Object> doctor = new HashMap<>();
                    doctor.put("id", appointment.getDoctor().getId());
                    doctor.put("nom", appointment.getDoctor().getNom());
                    doctor.put("prenom", appointment.getDoctor().getPrenom());
                    doctor.put("email", appointment.getDoctor().getEmail());
                    doctor.put("phoneNumber", appointment.getDoctor().getPhoneNumber());
                    simplified.put("doctor", doctor);
                }
                
                return simplified;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(simplifiedAppointments);
    }

    // Keep the old method for backward compatibility but make it admin-only
    @GetMapping("/patient/{patientId}/simplified")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPatientAppointmentsSimplified(@PathVariable Integer patientId) {
        List<Appointment> appointments = appointmentService.getAppointmentsForPatient(patientId);
        
        List<Map<String, Object>> simplifiedAppointments = appointments.stream()
            .map(appointment -> {
                Map<String, Object> simplified = new HashMap<>();
                simplified.put("id", appointment.getId());
                simplified.put("appointmentDateTime", appointment.getAppointmentDateTime());
                simplified.put("status", appointment.getStatus());
                simplified.put("appointmentType", appointment.getAppointmentType());
                simplified.put("caseType", appointment.getCaseType());
                simplified.put("notes", appointment.getNotes());
                
                if (appointment.getDoctor() != null) {
                    Map<String, Object> doctor = new HashMap<>();
                    doctor.put("id", appointment.getDoctor().getId());
                    doctor.put("nom", appointment.getDoctor().getNom());
                    doctor.put("prenom", appointment.getDoctor().getPrenom());
                    doctor.put("email", appointment.getDoctor().getEmail());
                    doctor.put("phoneNumber", appointment.getDoctor().getPhoneNumber());
                    simplified.put("doctor", doctor);
                }
                
                return simplified;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(simplifiedAppointments);
    }

    @PutMapping("/update-my-appointment-status")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Appointment> updateMyAppointmentStatus(
            @RequestParam Integer appointmentId,
            @RequestBody Map<String, String> statusMap,
            Authentication authentication
    ) {
        User doctor = (User) authentication.getPrincipal();
        Appointment.AppointmentStatus status = Appointment.AppointmentStatus.valueOf(statusMap.get("status"));
        
        try {
            // Verify the doctor owns this appointment
            Appointment appointment = appointmentService.findById(appointmentId);
            if (appointment == null || !appointment.getDoctor().getId().equals(doctor.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            Appointment updatedAppointment = appointmentService.updateAppointmentStatusByDoctor(appointmentId, status);
            return ResponseEntity.ok(updatedAppointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{appointmentId}/fiche-patient")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<?> saveFichePatient(
            @PathVariable Integer appointmentId,
            @RequestParam("patientData") String patientData,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication
    ) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            Map<String, Object> result = appointmentService.saveFichePatient(appointmentId, patientData, files, currentUser);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{appointmentId}/fiche-patient")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<?> getFichePatient(
            @PathVariable Integer appointmentId,
            Authentication authentication
    ) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            Map<String, Object> fichePatient = appointmentService.getFichePatient(appointmentId, currentUser);
            return ResponseEntity.ok(fichePatient);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{appointmentId}/interventions")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'SECRETAIRE')")
    public ResponseEntity<?> getInterventions(
            @PathVariable Integer appointmentId,
            Authentication authentication
    ) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            List<DentalIntervention> interventions = appointmentService.getInterventions(appointmentId, currentUser);
            return ResponseEntity.ok(interventions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{appointmentId}/interventions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> addIntervention(
            @PathVariable Integer appointmentId,
            @RequestBody DentalIntervention intervention,
            Authentication authentication
    ) {
        try {
            User doctor = (User) authentication.getPrincipal();
            DentalIntervention savedIntervention = appointmentService.addIntervention(appointmentId, intervention, doctor);
            return ResponseEntity.ok(savedIntervention);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}