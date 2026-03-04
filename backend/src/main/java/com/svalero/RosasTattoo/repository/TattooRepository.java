package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.Tattoo;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TattooRepository extends CrudRepository<Tattoo, Long> {

    List<Tattoo> findAll();

    boolean existsByClient_IdAndProfessional_IdAndTattooDate(
            Long clientId,
            Long professionalId,
            LocalDate tattooDate
    );

    @Query("SELECT t FROM tattoo t WHERE " +
            "(:style IS NULL OR t.style LIKE %:style%) AND " +
            "(:coverUp IS NULL OR t.coverUp = :coverUp) AND " +
            "(:color IS NULL OR t.color = :color) AND " +
            "(:professionalId IS NULL OR t.professional.id = :professionalId)")
    List<Tattoo> findByFilters(
            @Param("style") String style,
            @Param("coverUp") Boolean coverUp,
            @Param("color") Boolean color,
            @Param("professionalId") Long professionalId
    );

    Optional<Tattoo> findByClient_IdAndProfessional_IdAndTattooDate(
            Long clientId,
            Long professionalId,
            LocalDate tattooDate
    );
}