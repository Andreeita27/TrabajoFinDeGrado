package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.AvailabilityWindow;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AvailabilityWindowRepository extends CrudRepository<AvailabilityWindow, Long> {

    @Query("SELECT w FROM availability_window w WHERE " +
            "w.professional.id = :professionalId AND w.enabled = true AND " +
            "w.endDateTime > :from AND w.startDateTime < :to " +
            "ORDER BY w.startDateTime ASC")
    List<AvailabilityWindow> findActiveIntersecting(
            @Param("professionalId") long professionalId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("SELECT w FROM availability_window w WHERE " +
            "w.professional.id = :professionalId " +
            "ORDER BY w.startDateTime DESC")
    List<AvailabilityWindow> findAllByProfessional(@Param("professionalId") long professionalId);
}