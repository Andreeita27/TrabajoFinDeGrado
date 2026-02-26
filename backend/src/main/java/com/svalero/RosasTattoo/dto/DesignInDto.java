package com.svalero.RosasTattoo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DesignInDto {
    @NotNull(message = "professionalId is required")
    private Long professionalId;

    private String title;

    @NotBlank(message = "imageUrl is required")
    private String imageUrl;

    private Boolean active;
}
