package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.*;
import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.domain.enums.AppointmentType;
import com.svalero.RosasTattoo.domain.enums.TattooSize;
import com.svalero.RosasTattoo.dto.*;
import com.svalero.RosasTattoo.exception.AppointmentConflictException;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.repository.*;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.time.LocalDate;

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
    private TattooRepository tattooRepository;
    @Autowired
    private AvailabilityWindowRepository availabilityWindowRepository;
    @Autowired
    private UnavailabilityBlockRepository unavailabilityBlockRepository;
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

    private int calculateDurationMinutes(AppointmentType type, TattooSize tattooSize) {
        if (type == AppointmentType.CONSULTATION) return 30;

        if (tattooSize == null) {
            throw new IllegalArgumentException("Debes indicar el tamaño del tattoo.");
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

    private void validateByType(AppointmentInDto dto) {
        AppointmentType type = dto.getAppointmentType() == null
                ? AppointmentType.TATTOO
                : dto.getAppointmentType();

        if (dto.getIdeaDescription() == null || dto.getIdeaDescription().isBlank()) {
            throw new IllegalArgumentException("Describe tu idea.");
        }

        if (type == AppointmentType.TATTOO) {
            if (dto.getTattooSize() == null) {
                throw new IllegalArgumentException("Selecciona el tamaño del tattoo.");
            }
            if (dto.getBodyPlacement() == null || dto.getBodyPlacement().isBlank()) {
                throw new IllegalArgumentException("Indica en qué parte del cuerpo quieres el tattoo.");
            }
        } else {
            dto.setTattooSize(null);
            dto.setBodyPlacement(null);
        }
    }

    private AppointmentDto toDto(Appointment appointment) {
        AppointmentDto dto = modelMapper.map(appointment, AppointmentDto.class);

        Client client = appointment.getClient();
        if (client != null) {
            dto.setClientName(client.getClientName());
            dto.setClientSurname(client.getClientSurname());
            dto.setClientFullName((client.getClientName() + " " + client.getClientSurname()).trim());
        }

        if (appointment.getClient() != null
                && appointment.getProfessional() != null
                && appointment.getStartDateTime() != null) {

            Optional<Tattoo> tattoo = tattooRepository.findByClient_IdAndProfessional_IdAndTattooDate(
                    appointment.getClient().getId(),
                    appointment.getProfessional().getId(),
                    appointment.getStartDateTime().toLocalDate()
            );

            if (tattoo.isPresent()) {
                dto.setShowroomTattooCreated(true);
                dto.setShowroomTattooId(tattoo.get().getId());
            } else {
                dto.setShowroomTattooCreated(false);
            }
        } else {
            dto.setShowroomTattooCreated(false);
        }

        return dto;
    }

    private AppointmentDto enrichHasReview(Appointment appointment) {
        return toDto(appointment);
    }

    private List<AppointmentDto> enrichHasReview(List<Appointment> appointments) {
        List<AppointmentDto> result = new ArrayList<>(appointments.size());
        for (Appointment a : appointments) {
            result.add(toDto(a));
        }
        return result;
    }

    public List<AppointmentDto> findAll(AppointmentState state, Long clientId, Long professionalId,
                                        Boolean depositPaid, LocalDateTime dateFrom, LocalDateTime dateTo,
                                        String professionalName, String clientName) {

        List<Appointment> appointments = appointmentRepository.findByFilters(
                state,
                clientId,
                professionalId,
                depositPaid,
                dateFrom,
                dateTo,
                (professionalName == null || professionalName.isBlank()) ? null : professionalName.trim(),
                (clientName == null || clientName.isBlank()) ? null : clientName.trim()
        );

        return enrichHasReview(appointments);
    }

    public List<AppointmentDto> findMyAppointments(String email) throws ClientNotFoundException {
        Client me = getClientFromEmail(email);

        List<Appointment> appointments = appointmentRepository.findByFilters(
                null,
                me.getId(),
                null,
                null,
                null,
                null,
                null,
                null
        );

        return enrichHasReview(appointments);
    }

    public AppointmentDto findByIdSecured(long id, String email) throws AppointmentNotFoundException, ClientNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        assertOwnership(appointment, email);
        return enrichHasReview(appointment);
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

        validateByType(appointmentInDto);

        AppointmentType type = appointmentInDto.getAppointmentType() == null
                ? AppointmentType.TATTOO
                : appointmentInDto.getAppointmentType();

        Appointment appointment = new Appointment();
        modelMapper.map(appointmentInDto, appointment);

        appointment.setAppointmentType(type);
        appointment.setClient(client);
        appointment.setProfessional(professional);

        if (type == AppointmentType.CONSULTATION) {
            appointment.setState(AppointmentState.CONFIRMED);
            appointment.setDepositPaid(false);
        } else {
            appointment.setState(AppointmentState.PENDING);
            appointment.setDepositPaid(false);
        }

        int durationMinutes = calculateDurationMinutes(type, appointment.getTattooSize());
        appointment.setDurationMinutes(durationMinutes);

        validateNoOverlap(professional.getId(), appointment.getStartDateTime(), durationMinutes, null);

        Appointment saved = appointmentRepository.save(appointment);
        return enrichHasReview(saved);
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

        AppointmentType type = existing.getAppointmentType() == null
                ? AppointmentType.TATTOO
                : existing.getAppointmentType();

        int durationMinutes = calculateDurationMinutes(type, existing.getTattooSize());
        existing.setDurationMinutes(durationMinutes);

        validateNoOverlap(professional.getId(), existing.getStartDateTime(), durationMinutes, existing.getId());

        Appointment saved = appointmentRepository.save(existing);
        return enrichHasReview(saved);
    }

    public AppointmentDto confirmDeposit(long id, String email)
            throws AppointmentNotFoundException, ClientNotFoundException {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        assertOwnership(appointment, email);

        if (appointment.getAppointmentType() == AppointmentType.CONSULTATION) {
            throw new IllegalStateException("Consultations do not require deposit.");
        }

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
        return enrichHasReview(saved);
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
        return enrichHasReview(saved);
    }

    private void validateSlotInBusinessRules(long professionalId, LocalDateTime start, int durationMinutes) {

        // No permitir pasado
        if (start.isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("You cannot move an appointment to the past");
        }

        // No fines de semana
        DayOfWeek dow = start.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            throw new IllegalStateException("Appointments are not available on weekends");
        }

        // Horario fijo
        LocalTime workStart = LocalTime.of(12, 0);
        LocalTime workEnd = LocalTime.of(20, 0);

        LocalTime s = start.toLocalTime();
        LocalTime e = start.plusMinutes(durationMinutes).toLocalTime();

        // Debe estar dentro del horario de apertura
        if (s.isBefore(workStart) || e.isAfter(workEnd) || e.equals(LocalTime.MIDNIGHT)) {
            throw new IllegalStateException("The selected time is outside working hours");
        }

        LocalDateTime end = start.plusMinutes(durationMinutes);

        // Debe estar cubierto por alguna ventana publicada
        var windows = availabilityWindowRepository.findActiveIntersecting(professionalId, start, end);
        boolean covered = windows.stream().anyMatch(w ->
                !w.getStartDateTime().isAfter(start) && !w.getEndDateTime().isBefore(end)
        );

        if (!covered) {
            throw new IllegalStateException("This professional has not opened availability for that time");
        }

        // No debe caer en un bloqueo
        var blocks = unavailabilityBlockRepository.findActiveIntersecting(professionalId, start, end);
        boolean blocked = blocks.stream().anyMatch(b ->
                b.isEnabled()
                        && b.getEndDateTime().isAfter(start)
                        && b.getStartDateTime().isBefore(end)
        );

        if (blocked) {
            throw new IllegalStateException("The selected time is blocked");
        }
    }

    public AppointmentDto reschedule(long id, LocalDateTime newStart, String email)
            throws AppointmentNotFoundException, ClientNotFoundException {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        assertOwnership(appointment, email);

        // Solo PENDING o CONFIRMED
        if (appointment.getState() != AppointmentState.PENDING
                && appointment.getState() != AppointmentState.CONFIRMED) {
            throw new IllegalStateException("Only PENDING or CONFIRMED appointments can be rescheduled");
        }

        // Regla similar a cancelar: clientes solo con 24h de margen (admin puede siempre)
        if (!isAdmin()) {
            long hours = Duration.between(LocalDateTime.now(), appointment.getStartDateTime()).toHours();
            if (hours < 24) {
                throw new IllegalStateException("You can only reschedule an appointment at least 24 hours in advance");
            }
        }

        int durationMinutes = appointment.getDurationMinutes();
        if (durationMinutes <= 0) {
            durationMinutes = calculateDurationMinutes(appointment.getAppointmentType(), appointment.getTattooSize());
            appointment.setDurationMinutes(durationMinutes);
        }

        // Reglas de agenda/bloqueos/horario
        validateSlotInBusinessRules(appointment.getProfessional().getId(), newStart, durationMinutes);

        // Solapes (excluyendo la cita actual)
        validateNoOverlap(appointment.getProfessional().getId(), newStart, durationMinutes, appointment.getId());

        // Actualizo SOLO la fecha
        appointment.setStartDateTime(newStart);

        // no toco state
        Appointment saved = appointmentRepository.save(appointment);
        return enrichHasReview(saved);
    }

    public AppointmentDto markNoShow(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        if (appointment.getState() != AppointmentState.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED appointments can be marked as NO_SHOW");
        }

        appointment.setState(AppointmentState.NO_SHOW);

        Appointment saved = appointmentRepository.save(appointment);
        return enrichHasReview(saved);
    }

    public AppointmentDto markCompleted(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        if (appointment.getState() != AppointmentState.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED appointments can be marked as COMPLETED");
        }

        appointment.setState(AppointmentState.COMPLETED);

        Appointment saved = appointmentRepository.save(appointment);
        return enrichHasReview(saved);
    }

    public void delete(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        appointmentRepository.delete(appointment);
    }

    public AppointmentDto findById(long id) throws AppointmentNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(AppointmentNotFoundException::new);

        return enrichHasReview(appointment);
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
        return enrichHasReview(saved);
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
        return enrichHasReview(saved);
    }

    public AvailabilityResponseDto getAvailability(long professionalId,
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
            return new AvailabilityResponseDto(slots, false, false, List.of());
        }

        // BLOQUEOS primero
        var blocks = unavailabilityBlockRepository.findActiveIntersecting(professionalId, dateFrom, dateTo);

        boolean hasBlocksInRange = blocks.stream().anyMatch(b -> b.isEnabled());

        List<String> blockReasons = blocks.stream()
                .filter(b -> b.isEnabled())
                .map(b -> b.getReason() == null ? "" : b.getReason().trim())
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();

        var windows = availabilityWindowRepository.findActiveIntersecting(professionalId, dateFrom, dateTo);
        boolean hasPublishedWindows = !windows.isEmpty();

        // Si no hay ventanas publicadas, devuelvo igualmente info de bloqueos
        if (!hasPublishedWindows) {
            return new AvailabilityResponseDto(slots, false, hasBlocksInRange, blockReasons);
        }

        LocalDateTime currentDay = dateFrom.toLocalDate().atStartOfDay();
        LocalDateTime lastDay = dateTo.toLocalDate().atStartOfDay();

        while (!currentDay.isAfter(lastDay)) {
            DayOfWeek dow = currentDay.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                currentDay = currentDay.plusDays(1);
                continue;
            }

            LocalDateTime dayStart = currentDay.toLocalDate().atTime(workStart);
            LocalDateTime dayEnd = currentDay.toLocalDate().atTime(workEnd);

            LocalDateTime baseStart = dayStart.isAfter(dateFrom) ? dayStart : dateFrom;
            LocalDateTime baseEnd = dayEnd.isBefore(dateTo) ? dayEnd : dateTo;

            if (baseStart.isBefore(baseEnd)) {

                for (var w : windows) {
                    LocalDateTime wStart = w.getStartDateTime();
                    LocalDateTime wEnd = w.getEndDateTime();

                    LocalDateTime segStart = max(baseStart, wStart);
                    LocalDateTime segEnd = min(baseEnd, wEnd);

                    if (!segStart.isBefore(segEnd)) {
                        continue;
                    }

                    LocalDateTime slotStart = segStart;

                    while (slotStart.plusMinutes(duration).isBefore(segEnd)
                            || slotStart.plusMinutes(duration).isEqual(segEnd)) {

                        LocalDateTime slotEnd = slotStart.plusMinutes(duration);

                        final LocalDateTime currentStart = slotStart;
                        final LocalDateTime currentEnd = slotEnd;

                        boolean blocked = blocks.stream().anyMatch(b ->
                                b.isEnabled() &&
                                        b.getEndDateTime().isAfter(currentStart) &&
                                        b.getStartDateTime().isBefore(currentEnd)
                        );

                        if (!blocked) {
                            boolean overlaps = appointmentRepository.countOverlapping(
                                    professionalId,
                                    currentStart,
                                    currentEnd,
                                    null
                            ) > 0;

                            if (!overlaps) {
                                slots.add(new AvailabilitySlotDto(currentStart, currentEnd));
                            }
                        }

                        slotStart = slotStart.plusMinutes(step);
                    }
                }
            }

            currentDay = currentDay.plusDays(1);
        }

        return new AvailabilityResponseDto(slots, hasPublishedWindows, hasBlocksInRange, blockReasons);
    }

    private boolean hasAnyAvailableSlotForDay(
            LocalDate day,
            List<AvailabilityWindow> windows,
            List<UnavailabilityBlock> blocks,
            List<Appointment> appointments,
            int duration,
            int step
    ) {
        LocalDateTime dayStart = day.atTime(12, 0);
        LocalDateTime dayEnd = day.atTime(20, 0);

        for (AvailabilityWindow w : windows) {
            LocalDateTime segStart = max(dayStart, w.getStartDateTime());
            LocalDateTime segEnd = min(dayEnd, w.getEndDateTime());

            if (!segStart.isBefore(segEnd)) {
                continue;
            }

            LocalDateTime slotStart = segStart;

            while (slotStart.plusMinutes(duration).isBefore(segEnd)
                    || slotStart.plusMinutes(duration).isEqual(segEnd)) {

                final LocalDateTime currentSlotStart = slotStart;
                final LocalDateTime currentSlotEnd = currentSlotStart.plusMinutes(duration);

                boolean blocked = blocks.stream().anyMatch(b ->
                        b.isEnabled()
                                && b.getEndDateTime().isAfter(currentSlotStart)
                                && b.getStartDateTime().isBefore(currentSlotEnd)
                );

                if (!blocked) {
                    boolean overlaps = appointments.stream().anyMatch(a -> {
                        LocalDateTime apptStart = a.getStartDateTime();
                        LocalDateTime apptEnd = a.getStartDateTime().plusMinutes(a.getDurationMinutes());
                        return apptStart.isBefore(currentSlotEnd) && apptEnd.isAfter(currentSlotStart);
                    });

                    if (!overlaps) {
                        return true;
                    }
                }

                slotStart = slotStart.plusMinutes(step);
            }
        }

        return false;
    }

    public MonthlyAvailabilitySummaryDto getMonthlyAvailabilitySummary(long professionalId,
                                                                       LocalDate month,
                                                                       Integer durationMinutes,
                                                                       Integer stepMinutes) {

        int duration = (durationMinutes == null || durationMinutes <= 0) ? 60 : durationMinutes;
        int step = (stepMinutes == null || stepMinutes <= 0) ? 30 : stepMinutes;

        LocalDate firstDay = month.withDayOfMonth(1);
        LocalDate lastDay = month.withDayOfMonth(month.lengthOfMonth());

        LocalDateTime rangeStart = firstDay.atTime(12, 0);
        LocalDateTime rangeEnd = lastDay.atTime(20, 0);

        var windows = availabilityWindowRepository.findActiveIntersecting(professionalId, rangeStart, rangeEnd);
        var blocks = unavailabilityBlockRepository.findActiveIntersecting(professionalId, rangeStart, rangeEnd);
        var appointments = appointmentRepository.findActiveIntersecting(professionalId, rangeStart, rangeEnd);

        List<MonthlyAvailabilityDayDto> result = new ArrayList<>();

        LocalDate today = LocalDate.now();
        LocalDate current = firstDay;

        while (!current.isAfter(lastDay)) {
            DayOfWeek dow = current.getDayOfWeek();
            boolean weekend = dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
            boolean past = current.isBefore(today);

            if (weekend) {
                result.add(new MonthlyAvailabilityDayDto(current, "WEEKEND", true, past, null));
                current = current.plusDays(1);
                continue;
            }

            LocalDateTime dayStart = current.atTime(12, 0);
            LocalDateTime dayEnd = current.atTime(20, 0);

            var dayWindows = windows.stream()
                    .filter(w -> w.getEndDateTime().isAfter(dayStart) && w.getStartDateTime().isBefore(dayEnd))
                    .toList();

            boolean hasPublishedWindows = !dayWindows.isEmpty();

            if (!hasPublishedWindows) {
                result.add(new MonthlyAvailabilityDayDto(current, "NO_WINDOWS", false, past, "Este profesional todavía no ha abierto agenda para este día."));
                current = current.plusDays(1);
                continue;
            }

            var dayBlocks = blocks.stream()
                    .filter(b -> b.isEnabled())
                    .filter(b -> b.getEndDateTime().isAfter(dayStart) && b.getStartDateTime().isBefore(dayEnd))
                    .toList();

            var dayAppointments = appointments.stream()
                    .filter(a -> {
                        LocalDateTime apptEnd = a.getStartDateTime().plusMinutes(a.getDurationMinutes());
                        return a.getStartDateTime().isBefore(dayEnd) && apptEnd.isAfter(dayStart);
                    })
                    .toList();

            boolean hasAvailability = hasAnyAvailableSlotForDay(
                    current,
                    dayWindows,
                    dayBlocks,
                    dayAppointments,
                    duration,
                    step
            );

            if (hasAvailability) {
                result.add(new MonthlyAvailabilityDayDto(current, "AVAILABLE", false, past, "Hay huecos disponibles este día."));
            } else if (!dayBlocks.isEmpty()) {
                String reason = dayBlocks.stream()
                        .map(UnavailabilityBlock::getReason)
                        .filter(Objects::nonNull)
                        .filter(s -> !s.isBlank())
                        .distinct()
                        .reduce((a, b) -> a + " · " + b)
                        .orElse("Día bloqueado por indisponibilidad.");

                result.add(new MonthlyAvailabilityDayDto(current, "BLOCKED", false, past, reason));
            } else {
                result.add(new MonthlyAvailabilityDayDto(current, "FULL", false, past, "No quedan huecos libres para este día."));
            }

            current = current.plusDays(1);
        }

        return new MonthlyAvailabilitySummaryDto(firstDay, result);
    }

    private LocalDateTime max(LocalDateTime a, LocalDateTime b) {
        return a.isAfter(b) ? a : b;
    }

    private LocalDateTime min(LocalDateTime a, LocalDateTime b) {
        return a.isBefore(b) ? a : b;
    }
}