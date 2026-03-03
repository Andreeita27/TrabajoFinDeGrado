package com.svalero.RosasTattoo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AvailabilityWindowDto {
    private long id;
    private long professionalId;
    private String professionalName;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private boolean enabled;
    private String note;
}