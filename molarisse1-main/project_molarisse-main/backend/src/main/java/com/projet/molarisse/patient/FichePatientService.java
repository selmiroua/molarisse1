package com.projet.molarisse.patient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class FichePatientService {

    @Autowired
    private FichePatientRepository fichePatientRepository;

    public FichePatient saveFichePatient(FichePatient fichePatient) {
        return fichePatientRepository.save(fichePatient);
    }

    public Optional<FichePatient> getFichePatient(Integer patientId) {
        return fichePatientRepository.findByPatientId(patientId);
    }

    public boolean existsByPatientId(Integer patientId) {
        return fichePatientRepository.existsByPatientId(patientId);
    }
} 