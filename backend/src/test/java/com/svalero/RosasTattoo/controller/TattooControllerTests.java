package com.svalero.RosasTattoo.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.svalero.RosasTattoo.dto.TattooDto;
import com.svalero.RosasTattoo.dto.TattooInDto;
import com.svalero.RosasTattoo.exception.TattooNotFoundException;
import com.svalero.RosasTattoo.service.TattooService;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TattooController.class)
public class TattooControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TattooService tattooService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetAll() throws Exception {
        List<TattooDto> tattoos = List.of(
                new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true)
        );

        when(tattooService.findAll(null, null, null)).thenReturn(tattoos);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/tattoos")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        List<TattooDto> listResponse = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

        assertNotNull(listResponse);
        assertEquals(1, listResponse.size());
        assertEquals("David el Titi", listResponse.getFirst().getProfessionalName());
    }

    @Test
    public void testGetById() throws Exception {
        TattooDto tattooDto = new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        when(tattooService.findById(1L)).thenReturn(tattooDto);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/tattoos/1")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        TattooDto response = objectMapper.readValue(jsonResponse, TattooDto.class);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("David el Titi", response.getProfessionalName());
    }

    @Test
    public void testGetByIdNotFound() throws Exception {
        when(tattooService.findById(999L)).thenThrow(new TattooNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.get("/tattoos/999")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testAddTattoo() throws Exception {
        TattooInDto tattooInDto = new TattooInDto(1L, 1L, LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        TattooDto savedDto = new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        when(tattooService.add(any(TattooInDto.class))).thenReturn(savedDto);

        String jsonBody = objectMapper.writeValueAsString(tattooInDto);

        mockMvc.perform(MockMvcRequestBuilders.post("/tattoos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.professionalName").value("David el Titi"))
                .andExpect(jsonPath("$.clientId").value(1L));
    }

    @Test
    public void testAddTattooBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.post("/tattoos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testModifyOk() throws Exception {
        TattooInDto tattooInDto = new TattooInDto(1L, 1L, LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        TattooDto response = new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo modificado", "t1.png", 1, false, true);

        when(tattooService.modify(eq(1L), any(TattooInDto.class))).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.put("/tattoos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tattooInDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.professionalName").value("David el Titi"));
    }

    @Test
    public void testModifyNotFound() throws Exception {
        TattooInDto tattooInDto = new TattooInDto(1L, 1L, LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        when(tattooService.modify(eq(1L), any(TattooInDto.class)))
                .thenThrow(new TattooNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.put("/tattoos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tattooInDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testModifyBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.put("/tattoos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testDeleteOk() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/tattoos/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testDeleteNotFound() throws Exception {
        doThrow(new TattooNotFoundException()).when(tattooService).delete(1L);

        mockMvc.perform(MockMvcRequestBuilders.delete("/tattoos/1"))
                .andExpect(status().isNotFound());
    }
}
