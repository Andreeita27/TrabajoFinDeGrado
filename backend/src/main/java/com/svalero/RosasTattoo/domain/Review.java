package com.svalero.RosasTattoo.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity(name = "review")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private int rating;

    @Column
    private String comment;

    @Column(name = "would_recommend")
    private boolean wouldRecommend;

    @Column(name = "created_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    @NotNull(message = "Appointment is mandatory")
    private Appointment appointment;

}
