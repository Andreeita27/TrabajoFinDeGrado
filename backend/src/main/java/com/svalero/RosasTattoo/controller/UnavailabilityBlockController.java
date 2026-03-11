package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.UnavailabilityBlockDto;
import com.svalero.RosasTattoo.dto.UnavailabilityBlockInDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.exception.UnavailabilityBlockNotFoundException;
import com.svalero.RosasTattoo.service.UnavailabilityBlockService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class UnavailabilityBlockController {

    @Autowired
    private UnavailabilityBlockService unavailabilityBlockService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/professionals/{professionalId}/unavailability-blocks")
    public List<UnavailabilityBlockDto> list(@PathVariable long professionalId) {
        return unavailabilityBlockService.getByProfessional(professionalId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/professionals/{professionalId}/unavailability-blocks")
    public UnavailabilityBlockDto create(@PathVariable long professionalId,
                                         @RequestBody @Valid UnavailabilityBlockInDto inDto)
            throws ProfessionalNotFoundException {
        return unavailabilityBlockService.create(professionalId, inDto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/unavailability-blocks/{blockId}/toggle")
    public UnavailabilityBlockDto toggle(@PathVariable long blockId) throws UnavailabilityBlockNotFoundException {
        return unavailabilityBlockService.toggle(blockId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/unavailability-blocks/{blockId}")
    public void delete(@PathVariable long blockId) throws UnavailabilityBlockNotFoundException {
        unavailabilityBlockService.delete(blockId);
    }
}