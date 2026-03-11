package com.svalero.RosasTattoo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleReviewDto {
    private String authorName;
    private String authorPhotoUri;
    private String authorUri;
    private Integer rating;
    private String text;
    private String relativePublishTimeDescription;
    private String publishTime;
}