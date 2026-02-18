package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.ReviewDto;
import com.svalero.RosasTattoo.dto.ReviewInDto;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.exception.ReviewNotFoundException;
import com.svalero.RosasTattoo.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewDto>> getAll(
            @RequestParam(value = "rating", required = false) Integer rating,
            @RequestParam(value = "professionalId", required = false) Long professionalId,
            @RequestParam(value = "wouldRecommend", required = false) Boolean wouldRecommend
    ) {
        return ResponseEntity.ok(reviewService.findAll(rating, professionalId, wouldRecommend));
    }

    @GetMapping("/reviews/{id}")
    public ResponseEntity<ReviewDto> getReview(@PathVariable long id) throws ReviewNotFoundException {
        return ResponseEntity.ok(reviewService.findById(id));
    }

    @PreAuthorize("hasRole('CLIENT')")
    @PostMapping("/reviews")
    public ResponseEntity<ReviewDto> addReview(@Valid @RequestBody ReviewInDto reviewInDto, Authentication authentication)
            throws AppointmentNotFoundException, ClientNotFoundException {
        String email = (String) authentication.getPrincipal();
        return new ResponseEntity<>(reviewService.addSecured(reviewInDto, email), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/reviews/{id}")
    public ResponseEntity<ReviewDto> modifyReview(@PathVariable long id, @Valid @RequestBody ReviewInDto reviewInDto) throws ReviewNotFoundException {
        return ResponseEntity.ok(reviewService.modify(id, reviewInDto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable long id) throws ReviewNotFoundException {
        reviewService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ReviewNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleException(ReviewNotFoundException rnfe) {
        return new ResponseEntity<>(ErrorResponse.notFound(rnfe.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(AppointmentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleException(AppointmentNotFoundException anfe) {
        return new ResponseEntity<>(ErrorResponse.notFound(anfe.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ClientNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleException(ClientNotFoundException cnfe) {
        return new ResponseEntity<>(ErrorResponse.notFound("Cliente no encontrado"), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ise) {
        ErrorResponse errorResponse = ErrorResponse.generalError(400, "bad_request", ise.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ade) {
        ErrorResponse errorResponse = ErrorResponse.generalError(403, "forbidden", ade.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleException(MethodArgumentNotValidException manve) {
        Map<String, String> errors = new HashMap<>();
        manve.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });
        return new ResponseEntity<>(ErrorResponse.validationError(errors), HttpStatus.BAD_REQUEST);
    }
}