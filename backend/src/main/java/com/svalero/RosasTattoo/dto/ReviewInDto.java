package com.svalero.RosasTattoo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewInDto {

    @NotNull(message = "Appointment is mandatory")
    private long appointmentId;

    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private int rating;

    @NotBlank(message = "Describe your experience")
    private String comment;

    private boolean wouldRecommend;
}