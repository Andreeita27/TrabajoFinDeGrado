package com.svalero.RosasTattoo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleAppointmentDto {

    @NotNull(message = "startDateTime is required")
    private LocalDateTime startDateTime;
}