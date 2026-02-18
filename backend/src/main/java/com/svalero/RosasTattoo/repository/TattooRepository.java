package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.Tattoo;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TattooRepository extends CrudRepository<Tattoo, Long> {

    List<Tattoo> findAll();

    @Query("SELECT t FROM tattoo t WHERE " +
            "(:style IS NULL OR t.style LIKE %:style%) AND " +
            "(:coverUp IS NULL OR t.coverUp = :coverUp) AND " +
            "(:color IS NULL OR t.color = :color)")
    List<Tattoo> findByFilters(
            @Param("style") String style,
            @Param("coverUp") Boolean coverUp,
            @Param("color") Boolean color
    );
}