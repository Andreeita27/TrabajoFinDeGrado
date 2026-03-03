package com.svalero.RosasTattoo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccountUpdateDto {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email")
    private String email;

    private String phone;

    private boolean showPhoto;
}