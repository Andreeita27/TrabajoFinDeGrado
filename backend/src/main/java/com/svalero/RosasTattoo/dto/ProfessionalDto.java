package com.svalero.RosasTattoo.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalDto {
    private long id;
    private String professionalName;
    private LocalDate birthDate;
    private String description;
    private String profilePhoto;
    private boolean booksOpened;
    private int yearsExperience;
}