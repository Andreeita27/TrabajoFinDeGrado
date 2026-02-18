package com.svalero.RosasTattoo.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.domain.enums.TattooSize;
import com.svalero.RosasTattoo.dto.AppointmentDto;
import com.svalero.RosasTattoo.dto.AppointmentInDto;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.service.AppointmentService;
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

@WebMvcTest(AppointmentController.class)
public class AppointmentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppointmentService appointmentService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetAll() throws Exception {
        List<AppointmentDto> appointments = List.of(
                new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false)
        );

        when(appointmentService.findAll(null, null, null)).thenReturn(appointments);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/appointments")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        List<AppointmentDto> listResponse = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

        assertNotNull(listResponse);
        assertEquals(1, listResponse.size());
        assertEquals("David el Titi", listResponse.getFirst().getProfessionalName());
    }

    @Test
    public void testGetById() throws Exception {
        AppointmentDto appointmentDto = new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false);

        when(appointmentService.findById(1L)).thenReturn(appointmentDto);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/appointments/1")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        AppointmentDto response = objectMapper.readValue(jsonResponse, AppointmentDto.class);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("David el Titi", response.getProfessionalName());
    }

    @Test
    public void testGetByIdNotFound() throws Exception {
        when(appointmentService.findById(999L)).thenThrow(new AppointmentNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.get("/appointments/999")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testAddAppointment() throws Exception {
        AppointmentInDto appointmentInDto = new AppointmentInDto(1L, 1L, LocalDateTime.of(2026, 1, 10, 10, 0), "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png");

        AppointmentDto savedDto = new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false);

        when(appointmentService.add(any(AppointmentInDto.class))).thenReturn(savedDto);

        String jsonBody = objectMapper.writeValueAsString(appointmentInDto);

        mockMvc.perform(MockMvcRequestBuilders.post("/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.professionalName").value("David el Titi"))
                .andExpect(jsonPath("$.clientId").value(1L));
    }

    @Test
    public void testAddAppointmentBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.post("/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testModifyOk() throws Exception {
        AppointmentInDto appointmentInDto = new AppointmentInDto(1L, 1L, LocalDateTime.of(2026, 1, 10, 10, 0), "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png");

        AppointmentDto response = new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional modificado", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false);

        when(appointmentService.modify(eq(1L), any(AppointmentInDto.class))).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.put("/appointments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointmentInDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.professionalName").value("David el Titi"));
    }

    @Test
    public void testModifyNotFound() throws Exception {
        AppointmentInDto appointmentInDto = new AppointmentInDto(1L, 1L, LocalDateTime.of(2026, 1, 10, 10, 0), "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png");

        when(appointmentService.modify(eq(1L), any(AppointmentInDto.class)))
                .thenThrow(new AppointmentNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.put("/appointments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointmentInDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testModifyBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.put("/appointments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testDeleteOk() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/appointments/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testDeleteNotFound() throws Exception {
        doThrow(new AppointmentNotFoundException()).when(appointmentService).delete(1L);

        mockMvc.perform(MockMvcRequestBuilders.delete("/appointments/1"))
                .andExpect(status().isNotFound());
    }
}
