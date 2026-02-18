package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.domain.enums.TattooSize;
import com.svalero.RosasTattoo.dto.AppointmentDto;
import com.svalero.RosasTattoo.dto.AppointmentInDto;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.repository.AppointmentRepository;
import com.svalero.RosasTattoo.repository.ClientRepository;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTests {

    @InjectMocks
    private AppointmentService appointmentService;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ProfessionalRepository professionalRepository;

    @Mock
    private ModelMapper modelMapper;

    @Test
    public void testFindAll() {
        Appointment a1 = new Appointment();
        a1.setId(1L);

        List<Appointment> mockAppointmentList = List.of(a1);

        List<AppointmentDto> modelMapperOut = List.of(
                new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false));

        when(appointmentRepository.findByFilters(null, null, null)).thenReturn(mockAppointmentList);
        when(modelMapper.map(mockAppointmentList, new TypeToken<List<AppointmentDto>>() {}.getType()))
                .thenReturn(modelMapperOut);

        List<AppointmentDto> actual = appointmentService.findAll(null, null, null);

        assertEquals(1, actual.size());
        assertEquals(1L, actual.getFirst().getId());
        assertEquals("David el Titi", actual.getFirst().getProfessionalName());

        verify(appointmentRepository, times(1)).findByFilters(null, null, null);
    }

    @Test
    public void testFindById() throws AppointmentNotFoundException {
        Appointment mockAppointment = new Appointment();
        mockAppointment.setId(1L);

        AppointmentDto mockOutDto = new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false);

        when(appointmentRepository.findById(eq(1L))).thenReturn(Optional.of(mockAppointment));
        when(modelMapper.map(mockAppointment, AppointmentDto.class)).thenReturn(mockOutDto);

        AppointmentDto result = appointmentService.findById(1L);

        assertEquals(1L, result.getId());
        assertEquals("David el Titi", result.getProfessionalName());

        verify(appointmentRepository, times(1)).findById(1L);
    }

    @Test
    public void testFindByIdNotFound() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(AppointmentNotFoundException.class, () -> {
            appointmentService.findById(999L);
        });

        verify(appointmentRepository, times(1)).findById(999L);
    }

    @Test
    public void testAdd() throws ClientNotFoundException, ProfessionalNotFoundException {
        AppointmentInDto appointmentInDto = new AppointmentInDto(1L, 1L, LocalDateTime.of(2026, 1, 10, 10, 0), "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png");

        Client andrea = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        Professional titi = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        Appointment mapped = new Appointment();
        mapped.setId(0L);

        Appointment saved = new Appointment();
        saved.setId(1L);

        AppointmentDto savedDto = new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false);

        when(clientRepository.findById(eq(1L))).thenReturn(Optional.of(andrea));
        when(professionalRepository.findById(1L)).thenReturn(Optional.of(titi));

        doNothing().when(modelMapper).map(any(AppointmentInDto.class), any(Appointment.class));

        when(appointmentRepository.save(any(Appointment.class))).thenReturn(saved);
        when(modelMapper.map(any(Appointment.class), eq(AppointmentDto.class))).thenReturn(savedDto);

        AppointmentDto result = appointmentService.add(appointmentInDto);

        assertEquals(1L, result.getId());
        assertEquals("David el Titi", result.getProfessionalName());

        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    public void testAddClientNotFound() {
        AppointmentInDto appointmentInDto = new AppointmentInDto();
        appointmentInDto.setClientId(999L);
        appointmentInDto.setProfessionalId(1L);

        when(clientRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ClientNotFoundException.class, () -> {
            appointmentService.add(appointmentInDto);
        });

        verify(clientRepository, times(1)).findById(999L);
    }

    @Test
    public void testAddProfessionalNotFound() {
        AppointmentInDto appointmentInDto = new AppointmentInDto();
        appointmentInDto.setClientId(1L);
        appointmentInDto.setProfessionalId(1L);

        Client andrea = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        when(clientRepository.findById(1L)).thenReturn(Optional.of(andrea));
        when(professionalRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ProfessionalNotFoundException.class, () -> {
            appointmentService.add(appointmentInDto);
        });

        verify(professionalRepository, times(1)).findById(1L);
    }

    @Test
    public void testModify() throws AppointmentNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {
        AppointmentInDto appointmentInDto = new AppointmentInDto(1L, 1L, LocalDateTime.of(2026, 1, 10, 10, 0), "Brazo", "Peonía neotradicional", true, TattooSize.MEDIUM, "peonia.png");

        Client andrea = new Client(1L, "Andrea", "Fernandez", "andrea@example.com", "601375656", LocalDate.of(1998, 1, 26), true, 0);

        Professional titi = new Professional(1L, "David el Titi", LocalDate.of(1986, 12, 5), "Neotradicional", "titi.png", true, 15);

        Appointment existing = new Appointment();
        existing.setId(1L);

        Appointment updated = new Appointment();
        updated.setId(1L);

        AppointmentDto updatedDto = new AppointmentDto(1L, LocalDateTime.of(2026, 1, 10, 10, 0), "David el Titi", 1L, 1L, "Brazo", "Peonía neotradicional modificado", true, TattooSize.MEDIUM, "peonia.png", 90, 150.0f, AppointmentState.PENDING, false);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(andrea));
        when(professionalRepository.findById(1L)).thenReturn(Optional.of(titi));

        when(appointmentRepository.save(any(Appointment.class))).thenReturn(updated);
        when(modelMapper.map(eq(updated), eq(AppointmentDto.class))).thenReturn(updatedDto);

        doNothing().when(modelMapper).map(any(AppointmentInDto.class), any(Appointment.class));

        AppointmentDto result = appointmentService.modify(1L, appointmentInDto);

        assertEquals("Peonía neotradicional modificado", result.getIdeaDescription());

        verify(appointmentRepository, times(1)).findById(1L);
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    public void testModifyNotFound() {
        AppointmentInDto appointmentInDto = new AppointmentInDto();
        appointmentInDto.setClientId(1L);
        appointmentInDto.setProfessionalId(1L);

        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(AppointmentNotFoundException.class, () -> {
            appointmentService.modify(999L, appointmentInDto);
        });

        verify(appointmentRepository, times(1)).findById(999L);
    }

    @Test
    public void testDelete() throws AppointmentNotFoundException {
        Appointment mockAppointment = new Appointment();
        mockAppointment.setId(1L);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(mockAppointment));

        appointmentService.delete(1L);

        verify(appointmentRepository, times(1)).findById(1L);
        verify(appointmentRepository, times(1)).delete(mockAppointment);
    }

    @Test
    public void testDeleteNotFound() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(AppointmentNotFoundException.class, () -> {
            appointmentService.delete(999L);
        });

        verify(appointmentRepository, times(1)).findById(999L);
    }
}
