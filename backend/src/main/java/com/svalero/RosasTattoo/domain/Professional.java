package com.svalero.RosasTattoo.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Setter
@Getter
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity(name = "professional")
public class Professional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "professional_name")
    @NotBlank(message = "Name is mandatory")
    private String professionalName;

    @Column(name = "birth_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    @Column
    @NotBlank(message = "A description must be provided")
    private String description;

    @Column(name = "profile_photo")
    private String profilePhoto;

    @Column(name = "books_opened")
    private boolean booksOpened;

    @Column(name = "years_experience")
    private int yearsExperience;
}