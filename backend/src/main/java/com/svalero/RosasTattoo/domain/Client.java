package com.svalero.RosasTattoo.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Setter
@Getter
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity(name = "client")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "client_name")
    @NotBlank(message = "Name is mandatory")
    private String clientName;

    @Column(name = "client_surname")
    @NotBlank(message = "Surname is mandatory")
    private String clientSurname;

    @Column
    @NotBlank(message = "Email is mandatory")
    private String email;

    @Column
    private String phone;

    @Column(name = "birth_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    @Column(name = "show_photo")
    private boolean showPhoto;

    @Column
    private int visits;
}
