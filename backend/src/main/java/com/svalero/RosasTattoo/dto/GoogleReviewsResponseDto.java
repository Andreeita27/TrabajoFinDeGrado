package com.svalero.RosasTattoo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleReviewsResponseDto {
    private String placeDisplayName;
    private Double rating;
    private Integer userRatingCount;
    private String googleMapsUri;
    private String reviewsSortInfo;
    private List<GoogleReviewDto> reviews = new ArrayList<>();
}