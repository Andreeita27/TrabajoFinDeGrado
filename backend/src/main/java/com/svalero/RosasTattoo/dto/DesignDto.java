package com.svalero.RosasTattoo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DesignDto {
    private long id;
    private long professionalId;
    private String professionalName;
    private String title;
    private String imageUrl;
    private boolean active;
}