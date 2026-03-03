package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.UnavailabilityBlock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UnavailabilityBlockRepository extends CrudRepository<UnavailabilityBlock, Long> {

    @Query("SELECT b FROM unavailability_block b WHERE " +
            "b.professional.id = :professionalId AND b.enabled = true AND " +
            "b.endDateTime > :from AND b.startDateTime < :to " +
            "ORDER BY b.startDateTime ASC")
    List<UnavailabilityBlock> findActiveIntersecting(
            @Param("professionalId") long professionalId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("SELECT b FROM unavailability_block b WHERE " +
            "b.professional.id = :professionalId " +
            "ORDER BY b.startDateTime DESC")
    List<UnavailabilityBlock> findAllByProfessional(@Param("professionalId") long professionalId);
}