package com.projet.molarisse.patient;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "fiche_patient")
public class FichePatient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "doctor_id")
    private Long doctorId;

    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String profession;
    private String telephone;
    private String adresse;
    private String adressePar;
    private String sexe;

    @Column(length = 1000)
    private String observationsDentaires;

    @Column(length = 1000)
    private String etatGeneral;

    @Column(length = 1000)
    private String antecedentsChirurgicaux;

    @Column(length = 1000)
    private String priseMedicaments;

    @Column(length = 1000)
    private String allergies;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        updatedAt = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }
} 