package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.Client;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends CrudRepository<Client, Long> {

    List<Client> findAll();

    @Query("SELECT c FROM client c WHERE " +
            "(:name IS NULL OR c.clientName LIKE %:name%) AND " +
            "(:surname IS NULL OR c.clientSurname LIKE %:surname%) AND " +
            "(:showPhoto IS NULL OR c.showPhoto = :showPhoto)")
    List<Client> findByFilters(
            @Param("name") String name,
            @Param("surname") String surname,
            @Param("showPhoto") Boolean showPhoto
    );
}