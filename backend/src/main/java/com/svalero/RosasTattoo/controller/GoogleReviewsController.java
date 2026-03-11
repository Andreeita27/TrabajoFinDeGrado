package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.GoogleReviewsResponseDto;
import com.svalero.RosasTattoo.service.GoogleReviewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class GoogleReviewsController {

    private final GoogleReviewsService googleReviewsService;

    public GoogleReviewsController(GoogleReviewsService googleReviewsService) {
        this.googleReviewsService = googleReviewsService;
    }

    @GetMapping("/google-reviews")
    public ResponseEntity<GoogleReviewsResponseDto> getGoogleReviews() {
        return ResponseEntity.ok(googleReviewsService.getGoogleReviews());
    }
}