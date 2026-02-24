package com.svalero.RosasTattoo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AvailabilityResponseDto {
    private List<AvailabilitySlotDto> slots;
    private boolean hasPublishedWindows;
    private boolean hasBlocksInRange;
    private List<String> blockReasons;
}