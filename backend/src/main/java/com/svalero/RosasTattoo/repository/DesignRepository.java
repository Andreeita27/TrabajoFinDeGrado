package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.Design;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface DesignRepository extends CrudRepository<Design, Long> {
    List<Design> findByActiveTrueOrderByIdDesc();
    List<Design> findAllByOrderByIdDesc();
}