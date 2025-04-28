package com.projet.molarisse.user;

import org.springframework.data.jpa.repository.JpaRepository;
import com.projet.molarisse.role.Role;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);
    
    List<User> findByRoleAndEnabledTrue(Role role);
    
    List<User> findByAssignedDoctorIdAndSecretaryStatus(Integer doctorId, SecretaryStatus status);

    Optional<User> findByIdAndRole(Integer id, Role role);
    
    /**
     * Find users by role where assignedDoctor is null (unassigned secretaries)
     */
    List<User> findByRoleAndAssignedDoctorIsNull(Role role);
}

