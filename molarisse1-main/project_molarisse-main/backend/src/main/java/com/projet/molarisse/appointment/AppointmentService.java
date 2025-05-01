package com.projet.molarisse.appointment;

import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import com.projet.molarisse.user.SecretaryStatus;
import com.projet.molarisse.notifications.NotificationService;
import com.projet.molarisse.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.io.IOException;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DentalInterventionRepository dentalInterventionRepository;
    private final ObjectMapper objectMapper;
    private final AppointmentDocumentRepository documentRepository;

    public Appointment bookAppointment(
        Integer patientId,
        Integer doctorId,
        LocalDateTime appointmentDateTime,
        CaseType caseType,
        AppointmentType appointmentType,
        String notes) {
        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDateTime(appointmentDateTime)
                .caseType(caseType)
                .appointmentType(appointmentType)
                .status(Appointment.AppointmentStatus.PENDING)
                .notes(notes)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Create notification for the doctor
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String formattedDateTime = appointmentDateTime.format(formatter);
        String message = "New appointment with patient " + patient.getNom() + " on " + formattedDateTime;
        
        String link = "/doctor/appointments/" + savedAppointment.getId();
        notificationService.createNotification(doctor, message, NotificationType.NEW_APPOINTMENT, link);
        
        return savedAppointment;
    }

    public List<Appointment> getAppointmentsForPatient(Integer patientId) {
        try {
            // Verify patient exists
            User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));
            
            // Get appointments
            List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
            System.out.println("Found " + appointments.size() + " appointments for patient " + patientId);
            return appointments;
        } catch (Exception e) {
            System.err.println("Error getting appointments for patient " + patientId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get appointments: " + e.getMessage());
        }
    }

    public List<Appointment> getAppointmentsForDoctor(Integer doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<Appointment> getAppointmentsForSecretary(Integer secretaryId) {
        // Get the secretary
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new RuntimeException("Secretary not found"));
        
        // Check if secretary is assigned to a doctor
        if (secretary.getAssignedDoctor() == null || secretary.getSecretaryStatus() != SecretaryStatus.APPROVED) {
            throw new RuntimeException("Secretary is not assigned to any doctor or not approved");
        }
        
        // Return appointments for the assigned doctor instead of the secretary
        return appointmentRepository.findByDoctorId(secretary.getAssignedDoctor().getId());
    }

    public Appointment updateAppointmentStatus(Integer appointmentId, Appointment.AppointmentStatus status, Integer secretaryId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        User secretary = userRepository.findById(secretaryId)
                .orElseThrow(() -> new RuntimeException("Secretary not found"));
        
        // Check if secretary is assigned to the doctor for this appointment
        if (secretary.getAssignedDoctor() == null || 
            !secretary.getAssignedDoctor().getId().equals(appointment.getDoctor().getId()) ||
            secretary.getSecretaryStatus() != SecretaryStatus.APPROVED) {
            throw new RuntimeException("Secretary is not authorized to manage this appointment");
        }
        
        appointment.setStatus(status);
        appointment.setSecretary(secretary);
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        // Create notification for the doctor if status is changed
        if (updatedAppointment.getDoctor() != null) {
            String message = "Appointment status updated to " + status + " by secretary " + secretary.fullname();
            String link = "/doctor/appointments/" + updatedAppointment.getId();
            notificationService.createNotification(
                updatedAppointment.getDoctor(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        // Also notify the patient
        if (updatedAppointment.getPatient() != null) {
            String message = "Your appointment status has been updated to " + status;
            String link = "/patient/appointments/" + updatedAppointment.getId();
            notificationService.createNotification(
                updatedAppointment.getPatient(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        return updatedAppointment;
    }
    
    public Appointment updateAppointmentStatusByDoctor(Integer appointmentId, Appointment.AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        appointment.setStatus(status);
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        // Create notification for the patient
        if (updatedAppointment.getPatient() != null) {
            String message = "Your appointment status has been updated to " + status + " by Dr. " + 
                             updatedAppointment.getDoctor().getNom();
            String link = "/patient/appointments/" + updatedAppointment.getId();
            notificationService.createNotification(
                updatedAppointment.getPatient(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        return updatedAppointment;
    }

    public Appointment findById(Integer appointmentId) {
        return appointmentRepository.findById(appointmentId).orElse(null);
    }

    @Transactional
    public Map<String, Object> saveFichePatient(Integer appointmentId, String patientData, List<MultipartFile> files, User currentUser) throws IOException {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify authorization
        if (!isAuthorizedForAppointment(currentUser, appointment)) {
            throw new RuntimeException("Not authorized to modify this patient file");
        }

        // Parse the patient data
        Map<String, Object> patientInfo = objectMapper.readValue(patientData, Map.class);
        
        // Update appointment with fiche patient data
        if (patientInfo.containsKey("medicalHistory")) {
            appointment.setMedicalHistory((String) patientInfo.get("medicalHistory"));
        }
        if (patientInfo.containsKey("allergies")) {
            appointment.setAllergies((String) patientInfo.get("allergies"));
        }
        if (patientInfo.containsKey("dentalObservations")) {
            appointment.setDentalObservations((String) patientInfo.get("dentalObservations"));
        }

        // Save files if provided
        List<AppointmentDocument> savedDocuments = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                AppointmentDocument document = saveDocument(appointment, file);
                savedDocuments.add(document);
            }
        }

        // Save the appointment
        appointment = appointmentRepository.save(appointment);

        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("appointment", appointment);
        response.put("documents", savedDocuments);

        // Create notification for relevant users
        notifyFichePatientUpdate(appointment);

        return response;
    }

    public Map<String, Object> getFichePatient(Integer appointmentId, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify authorization
        if (!isAuthorizedForAppointment(currentUser, appointment)) {
            throw new RuntimeException("Not authorized to view this patient file");
        }

        // Prepare response with all relevant data
        Map<String, Object> fichePatient = new HashMap<>();
        fichePatient.put("appointment", appointment);
        fichePatient.put("interventions", getInterventions(appointmentId, currentUser));
        fichePatient.put("documents", documentRepository.findByAppointmentId(appointmentId));

        return fichePatient;
    }

    public List<DentalIntervention> getInterventions(Integer appointmentId, User currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify authorization
        if (!isAuthorizedForAppointment(currentUser, appointment)) {
            throw new RuntimeException("Not authorized to view interventions");
        }

        return dentalInterventionRepository.findByAppointmentId(appointmentId);
    }

    @Transactional
    public DentalIntervention addIntervention(Integer appointmentId, DentalIntervention intervention, User doctor) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Verify that the user is the doctor for this appointment
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("Not authorized to add interventions to this appointment");
        }

        intervention.setAppointment(appointment);
        intervention.setCreationDate(LocalDateTime.now());
        
        DentalIntervention savedIntervention = dentalInterventionRepository.save(intervention);

        // Create notification for the patient
        String message = "New dental intervention added to your appointment on " + 
                        appointment.getAppointmentDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String link = "/patient/appointments/" + appointmentId;
        notificationService.createNotification(
            appointment.getPatient(),
            message,
            NotificationType.APPOINTMENT_UPDATED,
            link
        );

        return savedIntervention;
    }

    private boolean isAuthorizedForAppointment(User user, Appointment appointment) {
        return user.getId().equals(appointment.getPatient().getId()) || // Patient
               user.getId().equals(appointment.getDoctor().getId()) || // Doctor
               (appointment.getSecretary() != null && user.getId().equals(appointment.getSecretary().getId())); // Secretary
    }

    private void notifyFichePatientUpdate(Appointment appointment) {
        String message = "Patient file has been updated for appointment on " + 
                        appointment.getAppointmentDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        
        // Notify doctor
        String doctorLink = "/doctor/appointments/" + appointment.getId();
        notificationService.createNotification(
            appointment.getDoctor(),
            message,
            NotificationType.APPOINTMENT_UPDATED,
            doctorLink
        );

        // Notify patient
        String patientLink = "/patient/appointments/" + appointment.getId();
        notificationService.createNotification(
            appointment.getPatient(),
            message,
            NotificationType.APPOINTMENT_UPDATED,
            patientLink
        );

        // Notify secretary if assigned
        if (appointment.getSecretary() != null) {
            String secretaryLink = "/secretary/appointments/" + appointment.getId();
            notificationService.createNotification(
                appointment.getSecretary(),
                message,
                NotificationType.APPOINTMENT_UPDATED,
                secretaryLink
            );
        }
    }

    private AppointmentDocument saveDocument(Appointment appointment, MultipartFile file) throws IOException {
        // Implementation for saving document
        String fileName = file.getOriginalFilename();
        String fileType = file.getContentType();
        long fileSize = file.getSize();
        
        // Save file to storage (implementation needed)
        String filePath = saveFileToStorage(file);
        
        AppointmentDocument document = AppointmentDocument.builder()
            .appointment(appointment)
            .documentType(AppointmentDocument.DocumentType.APPOINTMENT) // Set as appointment document
            .name(fileName)
            .filePath(filePath)
            .fileType(fileType)
            .fileSize(fileSize)
            .uploadDate(LocalDateTime.now())
            .build();
        
        return documentRepository.save(document);
    }

    private String saveFileToStorage(MultipartFile file) throws IOException {
        // Implementation needed for actual file storage
        // This could save to local filesystem, cloud storage, etc.
        // For now, return a placeholder path
        return "uploads/" + file.getOriginalFilename();
    }

    private void validateDocumentType(AppointmentDocument document) {
        if (document.getDocumentType() == AppointmentDocument.DocumentType.APPOINTMENT && document.getAppointment() == null) {
            throw new IllegalArgumentException("Appointment documents must be associated with an appointment");
        }
        if (document.getDocumentType() == AppointmentDocument.DocumentType.PATIENT && document.getFichePatient() == null) {
            throw new IllegalArgumentException("Patient documents must be associated with a patient file");
        }
    }

    public Appointment save(Appointment appointment) {
        // Create notification for the doctor about the rescheduled appointment
        if (appointment.getDoctor() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            String formattedDateTime = appointment.getAppointmentDateTime().format(formatter);
            String message = "Appointment rescheduled by patient " + appointment.getPatient().getNom() + 
                           " to " + formattedDateTime;
            
            String link = "/doctor/appointments/" + appointment.getId();
            notificationService.createNotification(
                appointment.getDoctor(), 
                message, 
                NotificationType.APPOINTMENT_UPDATED,
                link
            );
        }
        
        return appointmentRepository.save(appointment);
    }
}