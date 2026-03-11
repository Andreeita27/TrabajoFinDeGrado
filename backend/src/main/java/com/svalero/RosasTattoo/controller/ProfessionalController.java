package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.ProfessionalInDto;
import com.svalero.RosasTattoo.dto.ProfessionalDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.service.ProfessionalService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class ProfessionalController {

    @Autowired
    private ProfessionalService professionalService;

    @GetMapping("/professionals")
    public ResponseEntity<List<ProfessionalDto>> getAll(
            @RequestParam(value = "professionalName", required = false) String professionalName,
            @RequestParam(value = "booksOpened", required = false) Boolean booksOpened,
            @RequestParam(value = "yearsExperience", required = false) Integer yearsExperience
    ) {
        List<ProfessionalDto> professionals = professionalService.findAll(professionalName, booksOpened, yearsExperience);
        return ResponseEntity.ok(professionals);
    }

    @GetMapping("/professionals/{id}")
    public ResponseEntity<ProfessionalDto> get(@PathVariable long id) throws ProfessionalNotFoundException {
        ProfessionalDto professional = professionalService.findById(id);
        return ResponseEntity.ok(professional);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/professionals")
    public ResponseEntity<ProfessionalDto> addProfessional(@Valid @RequestBody ProfessionalInDto professionalInDto) {
        return new ResponseEntity<>(professionalService.add(professionalInDto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/professionals/{id}")
    public ResponseEntity<ProfessionalDto> modifyProfessional(@PathVariable long id, @Valid @RequestBody ProfessionalInDto professionalInDto)
            throws ProfessionalNotFoundException {
        return ResponseEntity.ok(professionalService.modify(id, professionalInDto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/professionals/{id}")
    public ResponseEntity<Void> deleteProfessional(@PathVariable long id) throws ProfessionalNotFoundException {
        professionalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}