package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.domain.UserAccount;
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
import com.svalero.RosasTattoo.repository.UserAccountRepository;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.svalero.RosasTattoo.exception.AppointmentConflictException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import com.svalero.RosasTattoo.dto.AvailabilitySlotDto;
import java.util.ArrayList;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private ProfessionalRepository professionalRepository;
    @Autowired
    private UserAccountRepository userAccountRepository;
    @Autowired
    private ModelMapper modelMapper;

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    private Client getClientFromEmail(String email) throws ClientNotFoundException {
        UserAccount account = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Account not found"));

        if (account.getClient() == null) {
            throw new AccessDeniedException("This account is not a client");
        }

        return account.getClient();
    }

    private void assertOwnership(Appointment appointment, String email) throws ClientNotFoundException {
        if (isAdmin()) return;

        Client me = getClientFromEmail(email);
        if (appointment.getClient() == null || appointment.getClient().getId() != me.getId()) {
            throw new AccessDeniedException("You cannot access this appointment");
        }
    }

    private int calculateDurationMinutes(TattooSize tattooSize) {
        if (tattooSize == null) {
            return 60;
        }
        return switch (tattooSize) {
            case SMALL -> 60;
            case MEDIUM -> 120;
            case LARGE -> 240;
            case XL -> 480;
        };
    }

    private void validateNoOverlap(long professionalId, LocalDateTime start, int durationMinutes, Long excludeId) {
        LocalDateTime end = start.plusMinutes(durationMinutes);

        long overlapsCount = appointmentRepository.countOverlapping(professionalId, start, end, excludeId);

        if (overlapsCount > 0) {
            throw new AppointmentConflictException("The selected time slot is not available");
        }

    }

    public List<AppointmentDto> findAll(AppointmentState state, Long clientId, Long professionalId) {
        List<Appointment> appointments = appointmentRepository.findByFilters(state, clientId, professionalId);
        return modelMapper.map(appointments, new TypeToken<List<AppointmentDto>>() {}.getType());
    }

    public List<AppointmentDto> findMyAppointments(String email) throws ClientNotFoundException {
        Client me = getClientFromEmail(email);
        List<Appointment> appointments = appointmentRepository.findByFilters(null, me.getId(), null);
        return modelMapper.map(appointments, new TypeToken<List<AppointmentDto>>() {}.getType());
    }

    public AppointmentDto findByIdSecured(long id, String email) throws AppointmentNotFoundException, ClientNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        assertOwnership(appointment, email);
        return modelMapper.map(appointment, AppointmentDto.class);
    }

    public AppointmentDto addSecured(AppointmentInDto appointmentInDto, String email)
            throws ClientNotFoundException, ProfessionalNotFoundException {

        Client client;
        if (isAdmin()) {
            client = clientRepository.findById(appointmentInDto.getClientId())
                    .orElseThrow(ClientNotFoundException::new);
        } else {
            client = getClientFromEmail(email);
        }

        Professional professional = professionalRepository.findById(appointmentInDto.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        Appointment appointment = new Appointment();
        modelMapper.map(appointmentInDto, appointment);

        appointment.setClient(client);
        appointment.setProfessional(professional);

        appointment.setState(AppointmentState.PENDING);
        appointment.setDepositPaid(false);

        int durationMinutes = calculateDurationMinutes(appointment.getTattooSize());
        appointment.setDurationMinutes(durationMinutes);

        validateNoOverlap(professional.getId(), appointment.getStartDateTime(), durationMinutes, null);

        Appointment saved = appointmentRepository.save(appointment);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public AppointmentDto modifySecured(long id, AppointmentInDto appointmentInDto, String email)
            throws AppointmentNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {

        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        assertOwnership(existing, email);

        Client client;
        if (isAdmin()) {
            client = clientRepository.findById(appointmentInDto.getClientId())
                    .orElseThrow(ClientNotFoundException::new);
        } else {
            client = getClientFromEmail(email);
        }

        Professional professional = professionalRepository.findById(appointmentInDto.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        modelMapper.map(appointmentInDto, existing);
        existing.setId(id);
        existing.setClient(client);
        existing.setProfessional(professional);

        int durationMinutes = calculateDurationMinutes(existing.getTattooSize());
        existing.setDurationMinutes(durationMinutes);

        validateNoOverlap(professional.getId(), existing.getStartDateTime(), durationMinutes, existing.getId());

        Appointment saved = appointmentRepository.save(existing);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public AppointmentDto confirmDeposit(long id, String email)
            throws AppointmentNotFoundException, ClientNotFoundException {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        assertOwnership(appointment, email);

        if (appointment.getState() == AppointmentState.CANCELLED) {
            throw new IllegalStateException("You cannot confirm deposit for a cancelled appointment");
        }
        if (appointment.getState() == AppointmentState.NO_SHOW) {
            throw new IllegalStateException("You cannot confirm deposit for a NO_SHOW appointment");
        }
        if (appointment.getState() == AppointmentState.COMPLETED) {
            throw new IllegalStateException("You cannot confirm deposit for a completed appointment");
        }

        appointment.setDepositPaid(true);
        appointment.setState(AppointmentState.CONFIRMED);

        Appointment saved = appointmentRepository.save(appointment);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public AppointmentDto cancel(long id, String email)
            throws AppointmentNotFoundException, ClientNotFoundException {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        assertOwnership(appointment, email);

        if (!isAdmin()) {
            long hours = Duration.between(LocalDateTime.now(), appointment.getStartDateTime()).toHours();
            if (hours < 24) {
                throw new IllegalStateException("You can only cancel an appointment at least 24 hours in advance");
            }
        }

        appointment.setState(AppointmentState.CANCELLED);

        Appointment saved = appointmentRepository.save(appointment);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public AppointmentDto markNoShow(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        if (appointment.getState() != AppointmentState.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED appointments can be marked as NO_SHOW");
        }

        appointment.setState(AppointmentState.NO_SHOW);

        Appointment saved = appointmentRepository.save(appointment);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public AppointmentDto markCompleted(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        if (appointment.getState() != AppointmentState.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED appointments can be marked as COMPLETED");
        }

        appointment.setState(AppointmentState.COMPLETED);

        Appointment saved = appointmentRepository.save(appointment);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public void delete(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        appointmentRepository.delete(appointment);
    }

    public AppointmentDto findById(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        return modelMapper.map(appointment, AppointmentDto.class);
    }

    public AppointmentDto add(AppointmentInDto appointmentInDto) throws ClientNotFoundException, ProfessionalNotFoundException {
        Client client = clientRepository.findById(appointmentInDto.getClientId())
                .orElseThrow(ClientNotFoundException::new);

        Professional professional = professionalRepository.findById(appointmentInDto.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        Appointment appointment = new Appointment();
        modelMapper.map(appointmentInDto, appointment);

        appointment.setClient(client);
        appointment.setProfessional(professional);

        Appointment saved = appointmentRepository.save(appointment);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public AppointmentDto modify(long id, AppointmentInDto appointmentInDto)
            throws AppointmentNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {

        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        Client client = clientRepository.findById(appointmentInDto.getClientId())
                .orElseThrow(ClientNotFoundException::new);

        Professional professional = professionalRepository.findById(appointmentInDto.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        modelMapper.map(appointmentInDto, existing);
        existing.setId(id);
        existing.setClient(client);
        existing.setProfessional(professional);

        Appointment saved = appointmentRepository.save(existing);
        return modelMapper.map(saved, AppointmentDto.class);
    }

    public List<AvailabilitySlotDto> getAvailability(long professionalId,
                                                     LocalDateTime dateFrom,
                                                     LocalDateTime dateTo,
                                                     Integer durationMinutes,
                                                     Integer stepMinutes) {

        int duration = (durationMinutes == null || durationMinutes <= 0) ? 60 : durationMinutes;
        int step = (stepMinutes == null || stepMinutes <= 0) ? 30 : stepMinutes;

        LocalTime workStart = LocalTime.of(12, 0);
        LocalTime workEnd = LocalTime.of(20, 0);

        List<AvailabilitySlotDto> slots = new ArrayList<>();

        if (dateFrom == null || dateTo == null || !dateFrom.isBefore(dateTo)) {
            return slots;
        }

        LocalDateTime currentDay = dateFrom.toLocalDate().atStartOfDay();
        LocalDateTime lastDay = dateTo.toLocalDate().atStartOfDay();

        while (!currentDay.isAfter(lastDay)) {
            LocalDateTime dayStart = currentDay.toLocalDate().atTime(workStart);
            LocalDateTime dayEnd = currentDay.toLocalDate().atTime(workEnd);

            LocalDateTime rangeStart = dayStart.isAfter(dateFrom) ? dayStart : dateFrom;
            LocalDateTime rangeEnd = dayEnd.isBefore(dateTo) ? dayEnd : dateTo;

            LocalDateTime slotStart = rangeStart;

            while (slotStart.plusMinutes(duration).isBefore(rangeEnd) || slotStart.plusMinutes(duration).isEqual(rangeEnd)) {
                LocalDateTime slotEnd = slotStart.plusMinutes(duration);

                boolean overlaps = appointmentRepository.countOverlapping(
                        professionalId,
                        slotStart,
                        slotEnd,
                        null
                ) > 0;

                if (!overlaps) {
                    slots.add(new AvailabilitySlotDto(slotStart, slotEnd));
                }

                slotStart = slotStart.plusMinutes(step);
            }

            currentDay = currentDay.plusDays(1);
        }

        return slots;
    }
}