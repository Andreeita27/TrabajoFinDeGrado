package com.svalero.RosasTattoo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccountDto {
    private String email;
    private String phone;
    private boolean showPhoto;

    private Long clientId;
    private String clientName;
    private String clientSurname;
}