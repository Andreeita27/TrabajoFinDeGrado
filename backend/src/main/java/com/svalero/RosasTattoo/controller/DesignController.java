package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.DesignDto;
import com.svalero.RosasTattoo.dto.DesignInDto;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.service.DesignService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class DesignController {

    @Autowired private DesignService designService;

    // Público: showroom (solo activos)
    @GetMapping("/designs")
    public ResponseEntity<List<DesignDto>> getPublic() {
        return ResponseEntity.ok(designService.getPublicDesigns());
    }

    // Admin: listar todos (activos + inactivos)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/designs")
    public ResponseEntity<List<DesignDto>> getAll() {
        return ResponseEntity.ok(designService.getAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/designs")
    public ResponseEntity<DesignDto> create(@Valid @RequestBody DesignInDto body) throws ProfessionalNotFoundException {
        return new ResponseEntity<>(designService.create(body), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/designs/{id}")
    public ResponseEntity<DesignDto> update(@PathVariable long id, @Valid @RequestBody DesignInDto body)
            throws ProfessionalNotFoundException {
        return ResponseEntity.ok(designService.update(id, body));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/designs/{id}/toggle")
    public ResponseEntity<DesignDto> toggle(@PathVariable long id) {
        return ResponseEntity.ok(designService.toggleActive(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/designs/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        designService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ProfessionalNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProfessional(ProfessionalNotFoundException ex) {
        return new ResponseEntity<>(ErrorResponse.notFound("Profesional no encontrado"), HttpStatus.NOT_FOUND);
    }
}