package com.svalero.RosasTattoo.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.svalero.RosasTattoo.dto.ClientInDto;
import com.svalero.RosasTattoo.dto.ClientDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.service.ClientService;
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

@WebMvcTest(ClientController.class)
public class ClientControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClientService clientService;

    @MockitoBean
    private ModelMapper modelMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetAll() throws Exception {
        List<ClientDto> clients = List.of(
                new ClientDto(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3),
                new ClientDto(2L, "Pepe", "Garcia", "pepe@example.com", "600999888", LocalDate.of(1990, 5, 20), false, 0)
        );

        when(clientService.findAll("", "", null)).thenReturn(clients);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/clients")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        List<ClientDto> clientsListResponse = objectMapper.readValue(jsonResponse, new TypeReference<>(){});

        assertNotNull(clientsListResponse);
        assertEquals(2, clientsListResponse.size());
        assertEquals("Andrea", clientsListResponse.getFirst().getClientName());
    }

    @Test
    public void testGetById() throws Exception {
        ClientDto client = new ClientDto(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3);

        when(clientService.findById(1)).thenReturn(client);

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/clients/1")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        ClientDto clientResponse = objectMapper.readValue(jsonResponse, ClientDto.class);

        assertNotNull(clientResponse);
        assertEquals("Andrea", clientResponse.getClientName());
    }

    @Test
    public void testGetByIdNotFound() throws Exception {
        when(clientService.findById(999)).thenThrow(new ClientNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.get("/clients/999")
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testAddClient() throws Exception {
        ClientInDto clientInDto = new ClientInDto("Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true);

        ClientDto savedClient = new ClientDto(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3);

        when(clientService.add(any(ClientInDto.class))).thenReturn(savedClient);

        String jsonBody = objectMapper.writeValueAsString(clientInDto);

        mockMvc.perform(MockMvcRequestBuilders.post("/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clientName").value("Andrea"))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    public void testAddClientBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.post("/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson)
                        .accept(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testModifyOk() throws Exception {
        ClientInDto dto = new ClientInDto("Andrea","Fernandez","andrea@example.com","601375656", LocalDate.of(1998,1,26), true);

        ClientDto response = new ClientDto(1L,"Andrea Modificada","Fernandez","andrea@example.com","601375656", LocalDate.of(1998,1,26), true, 3);

        when(clientService.modify(eq(1L), any(ClientInDto.class))).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.put("/clients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.clientName").value("Andrea Modificada"));
    }

    @Test
    public void testModifyNotFound() throws Exception {
        ClientInDto dto = new ClientInDto("Andrea","Fernandez","andrea@example.com","601375656", LocalDate.of(1998,1,26), true);

        when(clientService.modify(eq(1L), any(ClientInDto.class)))
                .thenThrow(new ClientNotFoundException());

        mockMvc.perform(MockMvcRequestBuilders.put("/clients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testModifyBadRequest() throws Exception {
        String badJson = "{}";

        mockMvc.perform(MockMvcRequestBuilders.put("/clients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testDeleteOk() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/clients/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    public void testDeleteNotFound() throws Exception {
        doThrow(new ClientNotFoundException()).when(clientService).delete(1L);

        mockMvc.perform(MockMvcRequestBuilders.delete("/clients/1"))
                .andExpect(status().isNotFound());
    }
}