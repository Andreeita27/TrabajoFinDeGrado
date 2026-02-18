package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.dto.ProfessionalDto;
import com.svalero.RosasTattoo.dto.ProfessionalInDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfessionalServiceTests {

    @InjectMocks
    private ProfessionalService professionalService;

    @Mock
    private ProfessionalRepository professionalRepository;

    @Mock
    private ModelMapper modelMapper;

    @Test
    public void testFindAll() {
        List<Professional> mockProfessionalList = List.of(
                new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15),
                new Professional(2L, "Acerete", LocalDate.of(1995, 2, 2), "Tradicional", "acerete.png", false, 2)
        );

        List<ProfessionalDto> modelMapperOut = List.of(
                new ProfessionalDto(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15),
                new ProfessionalDto(2L, "Acerete", LocalDate.of(1995, 2, 2), "Tradicional", "acerete.png", false, 2)
        );

        when(professionalRepository.findByFilters(null, null, null)).thenReturn(mockProfessionalList);

        when(modelMapper.map(mockProfessionalList, new TypeToken<List<ProfessionalDto>>() {}.getType()))
                .thenReturn(modelMapperOut);

        List<ProfessionalDto> actualProfessionalList = professionalService.findAll(null, null, null);

        assertEquals(2, actualProfessionalList.size());
        assertEquals("David el Titi", actualProfessionalList.getFirst().getProfessionalName());
        assertEquals("Acerete", actualProfessionalList.getLast().getProfessionalName());

        verify(professionalRepository, times(1)).findByFilters(null, null, null);
    }

    @Test
    public void testFindById() throws ProfessionalNotFoundException {
        Professional mockProfessional = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        ProfessionalDto mockOutDto = new ProfessionalDto(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        when(professionalRepository.findById(eq(1L))).thenReturn(Optional.of(mockProfessional));
        when(modelMapper.map(mockProfessional, ProfessionalDto.class)).thenReturn(mockOutDto);

        ProfessionalDto result = professionalService.findById(1L);

        assertEquals("David el Titi", result.getProfessionalName());
        verify(professionalRepository, times(1)).findById(1L);
    }

    @Test
    public void testFindByIdNotFound() {
        when(professionalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ProfessionalNotFoundException.class, () -> {
            professionalService.findById(999L);
        });

        verify(professionalRepository, times(1)).findById(999L);
    }

    @Test
    public void testAdd() {
        ProfessionalInDto professionalInDto = new ProfessionalInDto("David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        Professional mappedProfessional = new Professional(0L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        Professional savedProfessional = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        ProfessionalDto savedDto = new ProfessionalDto(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        when(modelMapper.map(any(ProfessionalInDto.class), eq(Professional.class))).thenReturn(mappedProfessional);
        when(professionalRepository.save(any(Professional.class))).thenReturn(savedProfessional);
        when(modelMapper.map(any(Professional.class), eq(ProfessionalDto.class))).thenReturn(savedDto);

        ProfessionalDto result = professionalService.add(professionalInDto);

        assertEquals(1L, result.getId());
        assertEquals("David el Titi", result.getProfessionalName());

        verify(professionalRepository, times(1)).save(any(Professional.class));
    }

    @Test
    public void testModify() throws ProfessionalNotFoundException {
        ProfessionalInDto newProfessionalData = new ProfessionalInDto(
                "David el Titi", LocalDate.of(1986, 12, 5),
                "Neotradicional modificado", "titi.png", true, 15
        );

        Professional existingProfessional = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5),
                "Neotradicional", "titi.png", true, 15);

        Professional updatedProfessional = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5),
                "Neotradicional modificado", "titi.png", true, 15);

        ProfessionalDto updatedDto = new ProfessionalDto(1L, "David el Titi", LocalDate.of(1986, 12, 5),
                "Neotradicional modificado", "titi.png", true, 15);

        when(professionalRepository.findById(1L)).thenReturn(Optional.of(existingProfessional));
        when(professionalRepository.save(any(Professional.class))).thenReturn(updatedProfessional);
        when(modelMapper.map(eq(updatedProfessional), eq(ProfessionalDto.class))).thenReturn(updatedDto);

        doNothing().when(modelMapper).map(any(ProfessionalInDto.class), any(Professional.class));

        ProfessionalDto result = professionalService.modify(1L, newProfessionalData);

        assertEquals("Neotradicional modificado", result.getDescription());

        verify(professionalRepository, times(1)).findById(1L);
        verify(professionalRepository, times(1)).save(any(Professional.class));
    }

    @Test
    public void testModifyNotFound() {
        ProfessionalInDto newProfessionalData = new ProfessionalInDto();
        newProfessionalData.setProfessionalName("Nombre nuevo");

        when(professionalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ProfessionalNotFoundException.class, () -> {
            professionalService.modify(999L, newProfessionalData);
        });

        verify(professionalRepository, times(1)).findById(999L);
    }

    @Test
    public void testDelete() throws ProfessionalNotFoundException {
        Professional mockProfessional = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        when(professionalRepository.findById(1L)).thenReturn(Optional.of(mockProfessional));

        professionalService.delete(1L);

        verify(professionalRepository, times(1)).findById(1L);
        verify(professionalRepository, times(1)).delete(mockProfessional);
    }

    @Test
    public void testDeleteNotFound() {
        when(professionalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ProfessionalNotFoundException.class, () -> {
            professionalService.delete(999L);
        });

        verify(professionalRepository, times(1)).findById(999L);
    }
}