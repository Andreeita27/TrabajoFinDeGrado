package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.dto.ClientInDto;
import com.svalero.RosasTattoo.dto.ClientDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.repository.ClientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClientServiceTests {

    @InjectMocks
    private ClientService clientService;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ModelMapper modelMapper;

    @Test
    public void testFindAll() {
        List<Client> mockClientList = List.of(
                new Client(1, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3),
                new Client(2, "Pepe", "Garcia", "pepe@example.com", "600999888", LocalDate.of(1990, 5, 20), false, 0)
        );

        List<ClientDto> modelMapperOut = List.of(
                new ClientDto(1, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3),
                new ClientDto(2, "Pepe", "Garcia", "pepe@example.com", "600999888", LocalDate.of(1990, 5, 20), false, 0)
        );

        when(clientRepository.findByFilters(null, null, null)).thenReturn(mockClientList);

        when(modelMapper.map(mockClientList, new TypeToken<List<ClientDto>>() {}.getType())).thenReturn(modelMapperOut);

        List<ClientDto> actualClientList = clientService.findAll(null, null, null);

        assertEquals(2, actualClientList.size());
        assertEquals("Andrea", actualClientList.getFirst().getClientName());
        assertEquals("Pepe", actualClientList.getLast().getClientName());

        verify(clientRepository, times(1)).findByFilters(null, null, null);
    }

    @Test
    public void testFindById() throws com.svalero.RosasTattoo.exception.ClientNotFoundException {
        Client mockClient = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3);
        ClientDto mockOutDto = new ClientDto(1L, "Andrea", "Fernandez", "andrea@example.com", "600123456", LocalDate.of(1998, 1, 26), true, 3);

        when(clientRepository.findById(eq(1L))).thenReturn(Optional.of(mockClient));

        when(modelMapper.map(mockClient, ClientDto.class)).thenReturn(mockOutDto);

        ClientDto result = clientService.findById(1L);

        assertEquals("Andrea", result.getClientName());

        verify(clientRepository, times(1)).findById(1L);
    }

    @Test
    public void testFindByIdNotFound() {
        when(clientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ClientNotFoundException.class, () -> {
            clientService.findById(999L);
        });

        verify(clientRepository, times(1)).findById(999L);
    }

    @Test
    public void testAdd() {
        ClientInDto clientInDto = new ClientInDto("Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true);

        Client mappedClient = new Client(0L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        Client savedClient = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        ClientDto savedDto = new ClientDto(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        when(modelMapper.map(any(ClientInDto.class), eq(Client.class))).thenReturn(mappedClient);
        when(clientRepository.save(any(Client.class))).thenReturn(savedClient);
        when(modelMapper.map(any(Client.class), eq(ClientDto.class))).thenReturn(savedDto);

        ClientDto result = clientService.add(clientInDto);

        assertEquals(1L, result.getId());
        assertEquals("Andrea", result.getClientName());

        verify(clientRepository, times(1)).save(any(Client.class));
    }

    @Test
    public void testModify() throws com.svalero.RosasTattoo.exception.ClientNotFoundException {
        ClientInDto newClientData = new ClientInDto("Andrea Modificada", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true);

        Client existingClient = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3);

        Client updatedClient = new Client(1L, "Andrea Modificada", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3);

        ClientDto updatedDto = new ClientDto(1L, "Andrea Modificada", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(existingClient));
        when(clientRepository.save(any(Client.class))).thenReturn(updatedClient);
        when(modelMapper.map(eq(updatedClient), eq(ClientDto.class))).thenReturn(updatedDto);

        doNothing().when(modelMapper).map(any(ClientInDto.class), any(Client.class));

        ClientDto result = clientService.modify(1L, newClientData);

        assertEquals("Andrea Modificada", result.getClientName());

        verify(clientRepository, times(1)).findById(1L);
        verify(clientRepository, times(1)).save(any(Client.class));
    }

    @Test
    public void testModifyNotFound() {
        ClientInDto newClientData = new ClientInDto();
        newClientData.setClientName("Nombre nuevo");

        when(clientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ClientNotFoundException.class, () -> {
            clientService.modify(999L, newClientData);
        });

        verify(clientRepository, times(1)).findById(999L);
    }

    @Test
    public void testDelete() throws com.svalero.RosasTattoo.exception.ClientNotFoundException {
        Client mockClient = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 3);

        when(clientRepository.findById(1L)).thenReturn(java.util.Optional.of(mockClient));

        clientService.delete(1L);

        verify(clientRepository, times(1)).findById(1L);
        verify(clientRepository, times(1)).delete(mockClient);
    }

    @Test
    public void testDeleteNotFound() {
        when(clientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ClientNotFoundException.class, () -> {
            clientService.delete(999L);
        });

        verify(clientRepository, times(1)).findById(999L);
    }
}