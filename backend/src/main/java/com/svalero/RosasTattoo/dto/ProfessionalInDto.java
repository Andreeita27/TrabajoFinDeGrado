package com.svalero.RosasTattoo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalInDto {

    @NotBlank(message = "Name is mandatory")
    private String professionalName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    @NotBlank(message = "A description must be provided")
    private String description;

    private String profilePhoto;
    private boolean booksOpened;
    private int yearsExperience;
}