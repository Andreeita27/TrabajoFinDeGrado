package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.AvailabilityWindowDto;
import com.svalero.RosasTattoo.dto.AvailabilityWindowInDto;
import com.svalero.RosasTattoo.exception.AvailabilityWindowNotFoundException;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.service.AvailabilityWindowService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class AvailabilityWindowController {

    @Autowired
    private AvailabilityWindowService availabilityWindowService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/professionals/{professionalId}/availability-windows")
    public List<AvailabilityWindowDto> list(@PathVariable long professionalId) {
        return availabilityWindowService.getByProfessional(professionalId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/professionals/{professionalId}/availability-windows")
    public AvailabilityWindowDto create(@PathVariable long professionalId,
                                        @RequestBody @Valid AvailabilityWindowInDto inDto)
            throws ProfessionalNotFoundException {
        return availabilityWindowService.create(professionalId, inDto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/availability-windows/{windowId}/toggle")
    public AvailabilityWindowDto toggle(@PathVariable long windowId) throws AvailabilityWindowNotFoundException {
        return availabilityWindowService.toggle(windowId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/availability-windows/{windowId}")
    public void delete(@PathVariable long windowId) throws AvailabilityWindowNotFoundException {
        availabilityWindowService.delete(windowId);
    }
}