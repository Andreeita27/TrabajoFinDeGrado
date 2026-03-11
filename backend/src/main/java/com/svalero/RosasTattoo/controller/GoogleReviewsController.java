package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.GoogleReviewsResponseDto;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.service.GoogleReviewsService;
import org.springframework.http.HttpStatus;
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

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException e) {
        ErrorResponse error = ErrorResponse.generalError(
                500,
                "google-reviews-error",
                e.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}