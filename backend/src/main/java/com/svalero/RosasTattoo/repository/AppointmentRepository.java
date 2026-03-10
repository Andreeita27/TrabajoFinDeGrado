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
            "(:professionalId IS NULL OR a.professional.id = :professionalId) AND " +
            "(:depositPaid IS NULL OR a.depositPaid = :depositPaid) AND " +
            "(:dateFrom IS NULL OR a.startDateTime >= :dateFrom) AND " +
            "(:dateTo IS NULL OR a.startDateTime <= :dateTo) AND " +
            "(:professionalName IS NULL OR " +
            "   LOWER(a.professional.professionalName) LIKE LOWER(CONCAT('%', :professionalName, '%'))" +
            ") AND " +
            "(:clientName IS NULL OR " +
            "   LOWER(a.client.clientName) LIKE LOWER(CONCAT('%', :clientName, '%')) OR " +
            "   LOWER(a.client.clientSurname) LIKE LOWER(CONCAT('%', :clientName, '%')) OR " +
            "   LOWER(CONCAT(a.client.clientName, ' ', a.client.clientSurname)) LIKE LOWER(CONCAT('%', :clientName, '%'))" +
            ") " +
            "ORDER BY a.startDateTime DESC")
    List<Appointment> findByFilters(
            @Param("state") AppointmentState state,
            @Param("clientId") Long clientId,
            @Param("professionalId") Long professionalId,
            @Param("depositPaid") Boolean depositPaid,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            @Param("professionalName") String professionalName,
            @Param("clientName") String clientName
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

    @Query(value = """
    SELECT *
    FROM `appointment` a
    WHERE a.`professional_id` = :professionalId
      AND a.`appointment_state` <> 'CANCELLED'
      AND a.`start_date_time` < :to
      AND TIMESTAMPADD(MINUTE, a.`duration_minutes`, a.`start_date_time`) > :from
    ORDER BY a.`start_date_time` ASC
    """, nativeQuery = true)
    List<Appointment> findActiveIntersecting(
            @Param("professionalId") long professionalId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
