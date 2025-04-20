package com.projet.molarisse.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface FichePatientRepository extends JpaRepository<FichePatient, Long> {
    @Query("SELECT f FROM FichePatient f WHERE f.patientId = ?1 ORDER BY f.updatedAt DESC")
    List<FichePatient> findAllByPatientIdOrderByUpdatedAtDesc(Long patientId);

    default Optional<FichePatient> findByPatientId(Long patientId) {
        List<FichePatient> fiches = findAllByPatientIdOrderByUpdatedAtDesc(patientId);
        return fiches.isEmpty() ? Optional.empty() : Optional.of(fiches.get(0));
    }

    default Optional<FichePatient> findByPatientId(Integer patientId) {
        return findByPatientId(patientId.longValue());
    }
} 