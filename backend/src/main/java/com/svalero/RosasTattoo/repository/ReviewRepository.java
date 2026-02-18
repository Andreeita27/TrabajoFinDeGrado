package com.svalero.RosasTattoo.repository;

import com.svalero.RosasTattoo.domain.Review;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends CrudRepository<Review, Long> {

    List<Review> findAll();

    boolean existsByAppointment_Id(long appointmentId);

    @Query("SELECT r FROM review r WHERE " +
            "(:rating IS NULL OR r.rating = :rating) AND " +
            "(:professionalId IS NULL OR r.appointment.professional.id = :professionalId) AND " +
            "(:recommend IS NULL OR r.wouldRecommend = :recommend)")
    List<Review> findByFilters(
            @Param("rating") Integer rating,
            @Param("professionalId") Long profId,
            @Param("recommend") Boolean recommend
    );
}