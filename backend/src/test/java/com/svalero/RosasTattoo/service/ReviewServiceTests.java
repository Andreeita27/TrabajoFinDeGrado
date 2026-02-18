package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.Review;
import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.dto.ReviewDto;
import com.svalero.RosasTattoo.dto.ReviewInDto;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.exception.ReviewNotFoundException;
import com.svalero.RosasTattoo.repository.AppointmentRepository;
import com.svalero.RosasTattoo.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTests {

    @InjectMocks
    private ReviewService reviewService;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ModelMapper modelMapper;

    @Test
    public void testFindAll() {
        Review r1 = new Review();
        r1.setId(1L);

        List<Review> mockReviewList = List.of(r1);

        List<ReviewDto> modelMapperOut = List.of(
                new ReviewDto(1L, 1L, 1L, 1L, 5, "Increíble", true, LocalDateTime.of(2025, 12, 1, 10, 0))
        );

        when(reviewRepository.findByFilters(null, null, null)).thenReturn(mockReviewList);
        when(modelMapper.map(mockReviewList, new TypeToken<List<ReviewDto>>() {}.getType()))
                .thenReturn(modelMapperOut);

        List<ReviewDto> actual = reviewService.findAll(null, null, null);

        assertEquals(1, actual.size());
        assertEquals(5, actual.getFirst().getRating());
        assertEquals("Increíble", actual.getFirst().getComment());

        verify(reviewRepository, times(1)).findByFilters(null, null, null);
    }

    @Test
    public void testFindById() throws ReviewNotFoundException {
        Review mockReview = new Review();
        mockReview.setId(1L);

        ReviewDto mockOutDto = new ReviewDto(1L, 1L, 1L, 1L, 5, "Increíble", true, LocalDateTime.of(2025, 12, 1, 10, 0));

        when(reviewRepository.findById(eq(1L))).thenReturn(Optional.of(mockReview));
        when(modelMapper.map(mockReview, ReviewDto.class)).thenReturn(mockOutDto);

        ReviewDto result = reviewService.findById(1L);

        assertEquals(1L, result.getId());
        assertEquals(5, result.getRating());

        verify(reviewRepository, times(1)).findById(1L);
    }

    @Test
    public void testFindByIdNotFound() {
        when(reviewRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ReviewNotFoundException.class, () -> {
            reviewService.findById(999L);
        });

        verify(reviewRepository, times(1)).findById(999L);
    }

    @Test
    public void testAdd() throws AppointmentNotFoundException {
        ReviewInDto reviewInDto = new ReviewInDto(1L, 5, "Increíble", true);

        Appointment appointment = new Appointment();
        appointment.setId(1L);
        appointment.setState(AppointmentState.CONFIRMED);

        Review mapped = new Review();
        mapped.setId(0L);

        Review saved = new Review();
        saved.setId(1L);

        ReviewDto savedDto = new ReviewDto(1L, 1L, 1L, 1L, 5, "Increíble", true, LocalDateTime.of(2025, 12, 1, 10, 0));

        when(appointmentRepository.findById(eq(1L))).thenReturn(Optional.of(appointment));

        doNothing().when(modelMapper).map(any(ReviewInDto.class), any(Review.class));

        when(reviewRepository.save(any(Review.class))).thenReturn(saved);
        when(modelMapper.map(any(Review.class), eq(ReviewDto.class))).thenReturn(savedDto);

        ReviewDto result = reviewService.add(reviewInDto);

        assertEquals(1L, result.getId());
        assertEquals(5, result.getRating());
        assertEquals(AppointmentState.COMPLETED, appointment.getState());
        verify(appointmentRepository, times(1)).save(appointment);

        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    public void testAddAppointmentNotFound() {
        ReviewInDto reviewInDto = new ReviewInDto();
        reviewInDto.setAppointmentId(999L);

        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(AppointmentNotFoundException.class, () -> {
            reviewService.add(reviewInDto);
        });

        verify(appointmentRepository, times(1)).findById(999L);
    }

    @Test
    public void testModify() throws ReviewNotFoundException {
        ReviewInDto reviewInDto = new ReviewInDto(1L, 4, "Muy bien", true);

        Review existing = new Review();
        existing.setId(1L);
        existing.setCreatedAt(LocalDateTime.of(2025, 12, 1, 10, 0));

        Appointment a1 = new Appointment();
        a1.setId(1L);
        existing.setAppointment(a1);

        Review updated = new Review();
        updated.setId(1L);

        ReviewDto updatedDto = new ReviewDto(1L, 1L, 1L, 1L, 5, "Muy bien", true, LocalDateTime.of(2025, 12, 1, 10, 0));

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(existing));
        doNothing().when(modelMapper).map(any(ReviewInDto.class), any(Review.class));

        when(reviewRepository.save(any(Review.class))).thenReturn(updated);
        when(modelMapper.map(eq(updated), eq(ReviewDto.class))).thenReturn(updatedDto);

        ReviewDto result = reviewService.modify(1L, reviewInDto);

        assertEquals(5, result.getRating());
        assertEquals("Muy bien", result.getComment());

        verify(reviewRepository, times(1)).findById(1L);
        verify(reviewRepository, times(1)).save(any(Review.class));
    }

    @Test
    public void testModifyNotFound() {
        ReviewInDto reviewInDto = new ReviewInDto();
        reviewInDto.setAppointmentId(1L);

        when(reviewRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ReviewNotFoundException.class, () -> {
            reviewService.modify(999L, reviewInDto);
        });

        verify(reviewRepository, times(1)).findById(999L);
    }

    @Test
    public void testDelete() throws ReviewNotFoundException {
        Review mockReview = new Review();
        mockReview.setId(1L);

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(mockReview));

        reviewService.delete(1L);

        verify(reviewRepository, times(1)).findById(1L);
        verify(reviewRepository, times(1)).delete(mockReview);
    }

    @Test
    public void testDeleteNotFound() {
        when(reviewRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ReviewNotFoundException.class, () -> {
            reviewService.delete(999L);
        });

        verify(reviewRepository, times(1)).findById(999L);
    }
}
