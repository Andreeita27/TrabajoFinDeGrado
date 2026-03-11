package com.svalero.RosasTattoo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MonthlyAvailabilityDayDto {
    private LocalDate date;
    private String status; // AVAILABLE | BLOCKED | NO_WINDOWS | FULL | WEEKEND
    private boolean weekend;
    private boolean past;
    private String reason;
}