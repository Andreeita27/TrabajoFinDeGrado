package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.Professional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfessionalRepository extends CrudRepository<Professional, Long> {

    List<Professional> findAll();

    @Query("SELECT p FROM professional p WHERE " +
            "(:name IS NULL OR p.professionalName LIKE %:name%) AND " +
            "(:books IS NULL OR p.booksOpened = :books) AND " +
            "(:years IS NULL OR p.yearsExperience = :years)")
    List<Professional> findByFilters(
            @Param("name") String name,
            @Param("books") Boolean books,
            @Param("years") Integer years
    );

    List<Professional> findByProfessionalName(String professionalName);
}
