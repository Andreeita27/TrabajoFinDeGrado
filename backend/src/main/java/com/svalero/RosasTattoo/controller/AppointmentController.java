package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.dto.*;
import com.svalero.RosasTattoo.exception.AppointmentNotFoundException;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.repository.AppointmentRepository;
import com.svalero.RosasTattoo.service.AppointmentService;
import com.svalero.RosasTattoo.service.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.time.LocalDate;

@RestController
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentDto>> getAll(
            @RequestParam(value = "state", required = false) AppointmentState state,
            @RequestParam(value = "clientId", required = false) Long clientId,
            @RequestParam(value = "professionalId", required = false) Long professionalId,
            @RequestParam(value = "depositPaid", required = false) Boolean depositPaid,
            @RequestParam(value = "dateFrom", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(value = "dateTo", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(value = "professionalName", required = false) String professionalName,
            @RequestParam(value = "clientName", required = false) String clientName
    ) {
        return ResponseEntity.ok(
                appointmentService.findAll(
                        state, clientId, professionalId,
                        depositPaid, dateFrom, dateTo,
                        professionalName, clientName
                )
        );
    }

    @PreAuthorize("hasRole('CLIENT')")
    @GetMapping("/appointments/my")
    public ResponseEntity<List<AppointmentDto>> getMyAppointments(Authentication authentication) throws ClientNotFoundException {
        String email = (String) authentication.getPrincipal();
        return ResponseEntity.ok(appointmentService.findMyAppointments(email));
    }

    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    @GetMapping("/appointments/{id}")
    public ResponseEntity<AppointmentDto> getAppointment(@PathVariable long id, Authentication authentication)
            throws AppointmentNotFoundException, ClientNotFoundException {
        String email = (String) authentication.getPrincipal();
        AppointmentDto appointment = appointmentService.findByIdSecured(id, email);
        return ResponseEntity.ok(appointment);
    }

    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    @PostMapping("/appointments")
    public ResponseEntity<AppointmentDto> addAppointment(@Valid @RequestBody AppointmentInDto appointmentInDto,
                                                         Authentication authentication)
            throws ClientNotFoundException, ProfessionalNotFoundException {
        String email = (String) authentication.getPrincipal();
        return new ResponseEntity<>(appointmentService.addSecured(appointmentInDto, email), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    @PutMapping("/appointments/{id}")
    public ResponseEntity<AppointmentDto> modifyAppointment(@PathVariable long id,
                                                            @Valid @RequestBody AppointmentInDto appointmentInDto,
                                                            Authentication authentication)
            throws AppointmentNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {
        String email = (String) authentication.getPrincipal();
        AppointmentDto modifiedAppointment = appointmentService.modifySecured(id, appointmentInDto, email);
        return ResponseEntity.ok(modifiedAppointment);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable long id) throws AppointmentNotFoundException {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/appointments/{id}/confirm-deposit")
    public ResponseEntity<AppointmentDto> confirmDeposit(@PathVariable long id, Authentication authentication)
            throws AppointmentNotFoundException, ClientNotFoundException {
        String email = (String) authentication.getPrincipal();
        return ResponseEntity.ok(appointmentService.confirmDeposit(id, email));
    }

    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    @PostMapping("/appointments/{id}/cancel")
    public ResponseEntity<AppointmentDto> cancel(@PathVariable long id, Authentication authentication)
            throws AppointmentNotFoundException, ClientNotFoundException{
        String email = (String) authentication.getPrincipal();
        return ResponseEntity.ok(appointmentService.cancel(id, email));
    }

    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    @PutMapping("/appointments/{id}/reschedule")
    public ResponseEntity<AppointmentDto> reschedule(
            @PathVariable long id,
            @Valid @RequestBody RescheduleAppointmentDto body,
            Authentication authentication
    ) throws AppointmentNotFoundException, ClientNotFoundException {
        String email = (String) authentication.getPrincipal();
        return ResponseEntity.ok(appointmentService.reschedule(id, body.getStartDateTime(), email));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/appointments/{id}/mark-no-show")
    public ResponseEntity<AppointmentDto> markNoShow(@PathVariable long id) throws AppointmentNotFoundException {
        return ResponseEntity.ok(appointmentService.markNoShow(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponseDto> getAvailability(
            @RequestParam(value = "professionalId") long professionalId,
            @RequestParam(value = "dateFrom") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(value = "dateTo") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(value = "durationMinutes", required = false) Integer durationMinutes,
            @RequestParam(value = "stepMinutes", required = false) Integer stepMinutes
    ) {
        return ResponseEntity.ok(
                appointmentService.getAvailability(professionalId, dateFrom, dateTo, durationMinutes, stepMinutes)
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    @GetMapping("/availability/month-summary")
    public ResponseEntity<MonthlyAvailabilitySummaryDto> getAvailabilityMonthSummary(
            @RequestParam(value = "professionalId") long professionalId,
            @RequestParam(value = "month") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month,
            @RequestParam(value = "durationMinutes", required = false) Integer durationMinutes,
            @RequestParam(value = "stepMinutes", required = false) Integer stepMinutes
    ) {
        return ResponseEntity.ok(
                appointmentService.getMonthlyAvailabilitySummary(professionalId, month, durationMinutes, stepMinutes)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/appointments/{id}/mark-completed")
    public ResponseEntity<AppointmentDto> markCompleted(@PathVariable long id) throws AppointmentNotFoundException {
        return ResponseEntity.ok(appointmentService.markCompleted(id));
    }

    @ExceptionHandler(ClientNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleClientException(ClientNotFoundException cnfe) {
        ErrorResponse errorResponse = ErrorResponse.notFound("Cliente no encontrado");
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ProfessionalNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProfessionalException(ProfessionalNotFoundException pnfe) {
        ErrorResponse errorResponse = ErrorResponse.notFound("Profesional no encontrado");
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ise) {
        ErrorResponse errorResponse = ErrorResponse.generalError(400, "bad_request", ise.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ade) {
        ErrorResponse errorResponse = ErrorResponse.generalError(403, "forbidden", ade.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
}