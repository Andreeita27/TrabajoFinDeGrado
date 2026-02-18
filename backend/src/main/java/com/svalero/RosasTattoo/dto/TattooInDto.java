package com.svalero.RosasTattoo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TattooInDto {

    @NotNull(message = "Client is mandatory")
    private long clientId;

    @NotNull(message = "Professional is mandatory")
    private long professionalId;

    @NotNull(message = "This field is mandatory")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tattooDate;

    @NotBlank(message = "Style is mandatory")
    private String style;

    @NotBlank(message = "Description is mandatory")
    private String tattooDescription;

    @NotBlank(message = "An image must be uploaded")
    private String imageUrl;

    private int sessions;
    private boolean coverUp;
    private boolean color;
}