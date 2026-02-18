package com.svalero.RosasTattoo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Setter
@Getter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDto {

    @NotBlank(message = "Name is mandatory")
    private String clientName;

    @NotBlank(message = "Surname is mandatory")
    private String clientSurname;

    @NotBlank(message = "Email is mandatory")
    private String email;

    private String phone;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    private boolean showPhoto;

    @NotBlank(message = "Password is mandatory")
    private String password;
}