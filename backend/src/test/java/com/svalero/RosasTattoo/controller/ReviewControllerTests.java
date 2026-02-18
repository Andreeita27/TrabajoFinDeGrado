package com.svalero.RosasTattoo.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.svalero.RosasTattoo.dto.ReviewDto;
import com.svalero.RosasTattoo.dto.ReviewInDto;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.exception.ReviewNotFoundException;
import com.svalero.RosasTattoo.service.ReviewService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReviewController.class)
public class ReviewControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReviewService reviewService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetAll() throws Exception {
        List<ReviewDto> reviews = List.of(
                new ReviewDto(1L, 1L, 1L, 1L, 5, "Increíble", true, LocalDateTime.of(2025, 12, 1, 10, 0))
        );

        when(reviewService.findAll(null, null, null)).thenReturn(reviews);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/reviews")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        List<ReviewDto> listResponse = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

        assertNotNull(listResponse);
        assertEquals(1, listResponse.size());
        assertEquals(5, listResponse.getFirst().getRating());
    }

    @Test
    public void testGetById() throws Exception {
        ReviewDto reviewDto = new ReviewDto(1L, 1L, 1L, 1L, 5, "Increíble", true, LocalDateTime.of(2025, 12, 1, 10, 0));

        when(reviewService.findById(1)).thenReturn(reviewDto);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/reviews/1")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        ReviewDto response = objectMapper.readValue(jsonResponse, ReviewDto.class);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Increíble", response.getComment());
    }

    @Test
    public void testGetByIdNotFound() throws Exception {
        when(reviewService.findById(999L)).thenThrow(new ReviewNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.get("/reviews/999")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testAddReview() throws Exception {
        ReviewInDto reviewInDto = new ReviewInDto(1L, 5, "Increíble", true);

        ReviewDto savedDto = new ReviewDto(1L, 1L, 1L, 1L, 5, "Increíble", true, LocalDateTime.of(2025, 12, 1, 10, 0));

        when(reviewService.add(any(ReviewInDto.class))).thenReturn(savedDto);

        String jsonBody = objectMapper.writeValueAsString(reviewInDto);

        mockMvc.perform(MockMvcRequestBuilders.post("/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.appointmentId").value(1L))
                .andExpect(jsonPath("$.rating").value(5));
    }

    @Test
    public void testAddReviewBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.post("/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testAddReviewAppointmentNotFound() throws Exception {
        ReviewInDto reviewInDto = new ReviewInDto(999L, 5, "Increíble", true);

        when(reviewService.add(any(ReviewInDto.class))).thenThrow(new AppointmentNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.post("/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewInDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testModifyOk() throws Exception {
        ReviewInDto reviewInDto = new ReviewInDto(1L, 5, "Muy bien", true);

        ReviewDto response = new ReviewDto(1L, 1L, 1L, 1L, 4, "Muy bien", true, LocalDateTime.of(2025, 12, 1, 10, 0));

        when(reviewService.modify(eq(1L), any(ReviewInDto.class))).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.put("/reviews/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewInDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.rating").value(4))
                .andExpect(jsonPath("$.comment").value("Muy bien"));
    }

    @Test
    public void testModifyNotFound() throws Exception {
        ReviewInDto reviewInDto = new ReviewInDto(1L, 5, "Increíble", true);

        when(reviewService.modify(eq(1L), any(ReviewInDto.class)))
                .thenThrow(new ReviewNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.put("/reviews/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewInDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testModifyBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.put("/reviews/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testDeleteOk() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/reviews/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testDeleteNotFound() throws Exception {
        doThrow(new ReviewNotFoundException()).when(reviewService).delete(1L);

        mockMvc.perform(MockMvcRequestBuilders.delete("/reviews/1"))
                .andExpect(status().isNotFound());
    }
}
