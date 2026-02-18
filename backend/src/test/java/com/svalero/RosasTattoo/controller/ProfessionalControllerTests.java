package com.svalero.RosasTattoo.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.svalero.RosasTattoo.dto.ProfessionalDto;
import com.svalero.RosasTattoo.dto.ProfessionalInDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.service.ProfessionalService;
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

@WebMvcTest(ProfessionalController.class)
public class ProfessionalControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProfessionalService professionalService;

    @MockitoBean
    private ModelMapper modelMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetAll() throws Exception {
        List<ProfessionalDto> professionals = List.of(
                new ProfessionalDto(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15),
                new ProfessionalDto(2L, "Acerete", LocalDate.of(1995, 2, 2), "Tradicional", "acerete.png", false, 2)
        );

        when(professionalService.findAll(null, null, null)).thenReturn(professionals);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/professionals")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        List<ProfessionalDto> professionalsListResponse =
                objectMapper.readValue(jsonResponse, new TypeReference<>() {});

        assertNotNull(professionalsListResponse);
        assertEquals(2, professionalsListResponse.size());
        assertEquals("David el Titi", professionalsListResponse.getFirst().getProfessionalName());
    }

    @Test
    public void testGetById() throws Exception {
        ProfessionalDto professionalDto = new ProfessionalDto(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        when(professionalService.findById(1)).thenReturn(professionalDto);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/professionals/1")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        ProfessionalDto professionalResponse = objectMapper.readValue(jsonResponse, ProfessionalDto.class);

        assertNotNull(professionalResponse);
        assertEquals("David el Titi", professionalResponse.getProfessionalName());
    }

    @Test
    public void testGetByIdNotFound() throws Exception {
        when(professionalService.findById(999)).thenThrow(new ProfessionalNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.get("/professionals/999")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testAddProfessional() throws Exception {
        ProfessionalInDto professionalInDto = new ProfessionalInDto(
                "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15
        );

        ProfessionalDto savedProfessional = new ProfessionalDto(
                1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15
        );

        when(professionalService.add(any(ProfessionalInDto.class))).thenReturn(savedProfessional);

        String jsonBody = objectMapper.writeValueAsString(professionalInDto);

        mockMvc.perform(MockMvcRequestBuilders.post("/professionals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.professionalName").value("David el Titi"))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    public void testAddProfessionalBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.post("/professionals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testModifyOk() throws Exception {
        ProfessionalInDto dto = new ProfessionalInDto(
                "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional modificado", "titi.png", true, 15
        );

        ProfessionalDto response = new ProfessionalDto(
                1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional modificado", "titi.png", true, 15
        );

        when(professionalService.modify(eq(1L), any(ProfessionalInDto.class))).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.put("/professionals/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.professionalName").value("David el Titi"))
                .andExpect(jsonPath("$.description").value("Neotradicional modificado"));
    }

    @Test
    public void testModifyNotFound() throws Exception {
        ProfessionalInDto dto = new ProfessionalInDto(
                "Acerete", LocalDate.of(1995, 2, 2), "Tradicional", "acerete.png", false, 2
        );

        when(professionalService.modify(eq(1L), any(ProfessionalInDto.class)))
                .thenThrow(new ProfessionalNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.put("/professionals/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testModifyBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.put("/professionals/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testDeleteOk() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/professionals/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testDeleteNotFound() throws Exception {
        doThrow(new ProfessionalNotFoundException()).when(professionalService).delete(1L);

        mockMvc.perform(MockMvcRequestBuilders.delete("/professionals/1"))
                .andExpect(status().isNotFound());
    }
}


