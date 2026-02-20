package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends CrudRepository<Appointment, Long> {

    List<Appointment> findAll();

    @Query("SELECT a FROM appointment a WHERE " +
            "(:state IS NULL OR a.state = :state) AND " +
            "(:clientId IS NULL OR a.client.id = :clientId) AND " +
            "(:professionalId IS NULL OR a.professional.id = :professionalId)")
    List<Appointment> findByFilters(
            @Param("state") AppointmentState state,
            @Param("clientId") Long clientId,
            @Param("professionalId") Long professionalId
    );

    /*
     * Comprueba si existe solape para un profesional en el rango [start, end).
     * Ignora citas CANCELLED.
     * excludeId: para modificaciones (no se compara contra sí misma).
     * MariaDB: TIMESTAMPADD(MINUTE, duration_minutes, start_date_time)
     */

    @Query(value = """
    SELECT COUNT(*)
    FROM `appointment` a
    WHERE a.`professional_id` = :professionalId
      AND a.`appointment_state` <> 'CANCELLED'
      AND a.`start_date_time` < :endDateTime
      AND TIMESTAMPADD(MINUTE, a.`duration_minutes`, a.`start_date_time`) > :startDateTime
      AND (:excludeId IS NULL OR a.`id` <> :excludeId)
    """, nativeQuery = true)
    int countOverlapping(
            @Param("professionalId") long professionalId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("excludeId") Long excludeId
    );
}
