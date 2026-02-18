package com.svalero.RosasTattoo.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private long id;
    private long appointmentId;
    private long clientId;
    private long professionalId;
    private int rating;
    private String comment;
    private boolean wouldRecommend;
    private LocalDateTime createdAt;
}
