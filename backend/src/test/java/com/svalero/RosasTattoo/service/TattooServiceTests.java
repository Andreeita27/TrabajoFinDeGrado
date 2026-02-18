package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.domain.Tattoo;
import com.svalero.RosasTattoo.dto.TattooDto;
import com.svalero.RosasTattoo.dto.TattooInDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.exception.TattooNotFoundException;
import com.svalero.RosasTattoo.repository.ClientRepository;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import com.svalero.RosasTattoo.repository.TattooRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TattooServiceTests {

    @InjectMocks
    private TattooService tattooService;

    @Mock
    private TattooRepository tattooRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ProfessionalRepository professionalRepository;

    @Mock
    private ModelMapper modelMapper;

    @Test
    public void testFindAll() {
        Tattoo t1 = new Tattoo();
        t1.setId(1L);

        List<Tattoo> mockTattooList = List.of(t1);

        List<TattooDto> modelMapperOut = List.of(
                new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true)
        );

        when(tattooRepository.findByFilters(null, null, null)).thenReturn(mockTattooList);
        when(modelMapper.map(mockTattooList, new TypeToken<List<TattooDto>>() {}.getType()))
                .thenReturn(modelMapperOut);

        List<TattooDto> actual = tattooService.findAll(null, null, null);

        assertEquals(1, actual.size());
        assertEquals(1L, actual.getFirst().getId());
        assertEquals("David el Titi", actual.getFirst().getProfessionalName());

        verify(tattooRepository, times(1)).findByFilters(null, null, null);
    }

    @Test
    public void testFindById() throws TattooNotFoundException {
        Tattoo mockTattoo = new Tattoo();
        mockTattoo.setId(1L);

        TattooDto mockOutDto = new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        when(tattooRepository.findById(eq(1L))).thenReturn(Optional.of(mockTattoo));
        when(modelMapper.map(mockTattoo, TattooDto.class)).thenReturn(mockOutDto);

        TattooDto result = tattooService.findById(1L);

        assertEquals(1L, result.getId());
        assertEquals("David el Titi", result.getProfessionalName());

        verify(tattooRepository, times(1)).findById(1L);
    }

    @Test
    public void testFindByIdNotFound() {
        when(tattooRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(TattooNotFoundException.class, () -> {
            tattooService.findById(999L);
        });

        verify(tattooRepository, times(1)).findById(999L);
    }

    @Test
    public void testAdd() throws ClientNotFoundException, ProfessionalNotFoundException {
        TattooInDto tattooInDto = new TattooInDto(1L, 1L, LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        Client andrea = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        Professional titi = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        Tattoo mapped = new Tattoo();
        mapped.setId(0L);

        Tattoo saved = new Tattoo();
        saved.setId(1L);

        TattooDto savedDto = new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        when(clientRepository.findById(eq(1L))).thenReturn(Optional.of(andrea));
        when(professionalRepository.findById(eq(1L))).thenReturn(Optional.of(titi));

        when(modelMapper.map(any(TattooInDto.class), eq(Tattoo.class))).thenReturn(mapped);
        when(tattooRepository.save(any(Tattoo.class))).thenReturn(saved);
        when(modelMapper.map(any(Tattoo.class), eq(TattooDto.class))).thenReturn(savedDto);

        TattooDto result = tattooService.add(tattooInDto);

        assertEquals(1L, result.getId());
        assertEquals("David el Titi", result.getProfessionalName());

        verify(tattooRepository, times(1)).save(any(Tattoo.class));
    }

    @Test
    public void testAddClientNotFound() {
        TattooInDto tattooInDto = new TattooInDto();
        tattooInDto.setClientId(999L);
        tattooInDto.setProfessionalId(1L);

        when(clientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ClientNotFoundException.class, () -> {
            tattooService.add(tattooInDto);
        });

        verify(clientRepository, times(1)).findById(999L);
    }

    @Test
    public void testAddProfessionalNotFound() {
        TattooInDto tattooInDto = new TattooInDto();
        tattooInDto.setClientId(1L);
        tattooInDto.setProfessionalId(1L);

        Client andrea = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(andrea));
        when(professionalRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ProfessionalNotFoundException.class, () -> {
            tattooService.add(tattooInDto);
        });

        verify(professionalRepository, times(1)).findById(1L);
    }

    @Test
    public void testModify() throws TattooNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {
        TattooInDto tattooInDto = new TattooInDto(1L, 1L, LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo", "t1.png", 1, false, true);

        Client andrea = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        Professional titi = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        Tattoo existing = new Tattoo();
        existing.setId(1L);

        Tattoo updated = new Tattoo();
        updated.setId(1L);

        TattooDto updatedDto = new TattooDto(1L, 1L, 1L, "David el Titi", LocalDate.of(2025, 12, 1), "Neotradicional", "Peonía neotradicional en el brazo modificado", "t1.png", 1, false, true);

        when(tattooRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(andrea));
        when(professionalRepository.findById(1L)).thenReturn(Optional.of(titi));

        when(tattooRepository.save(any(Tattoo.class))).thenReturn(updated);
        when(modelMapper.map(eq(updated), eq(TattooDto.class))).thenReturn(updatedDto);

        doNothing().when(modelMapper).map(any(TattooInDto.class), any(Tattoo.class));

        TattooDto result = tattooService.modify(1L, tattooInDto);

        assertEquals("Peonía neotradicional en el brazo modificado", result.getTattooDescription());

        verify(tattooRepository, times(1)).findById(1L);
        verify(tattooRepository, times(1)).save(any(Tattoo.class));
    }

    @Test
    public void testModifyNotFound() {
        TattooInDto tattooInDto = new TattooInDto();
        tattooInDto.setClientId(1L);
        tattooInDto.setProfessionalId(1L);

        when(tattooRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(TattooNotFoundException.class, () -> {
            tattooService.modify(999L, tattooInDto);
        });

        verify(tattooRepository, times(1)).findById(999L);
    }

    @Test
    public void testDelete() throws TattooNotFoundException {
        Tattoo mockTattoo = new Tattoo();
        mockTattoo.setId(1L);

        when(tattooRepository.findById(1L)).thenReturn(Optional.of(mockTattoo));

        tattooService.delete(1L);

        verify(tattooRepository, times(1)).findById(1L);
        verify(tattooRepository, times(1)).delete(mockTattoo);
    }

    @Test
    public void testDeleteNotFound() {
        when(tattooRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(TattooNotFoundException.class, () -> {
            tattooService.delete(999L);
        });

        verify(tattooRepository, times(1)).findById(999L);
    }
}
