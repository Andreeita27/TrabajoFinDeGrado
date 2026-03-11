package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.TattooInDto;
import com.svalero.RosasTattoo.dto.TattooDto;
import com.svalero.RosasTattoo.exception.*;
import com.svalero.RosasTattoo.service.TattooService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TattooController {

    @Autowired
    private TattooService tattooService;

    @GetMapping("/tattoos")
    public ResponseEntity<List<TattooDto>> getAll(
            @RequestParam(value = "style", required = false) String style,
            @RequestParam(value = "coverUp", required = false) Boolean coverUp,
            @RequestParam(value = "color", required = false) Boolean color,
            @RequestParam(value = "professionalId", required = false) Long professionalId){
        return ResponseEntity.ok(tattooService.findAll(style, coverUp, color, professionalId));
    }

    @GetMapping("/tattoos/{id}")
    public ResponseEntity<TattooDto> getTattoo(@PathVariable long id) throws TattooNotFoundException {
        return ResponseEntity.ok(tattooService.findById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/tattoos")
    public ResponseEntity<TattooDto> addTattoo(@Valid @RequestBody TattooInDto tattooInDto)
            throws ClientNotFoundException, ProfessionalNotFoundException {
        return new ResponseEntity<>(tattooService.add(tattooInDto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/tattoos/{id}")
    public ResponseEntity<TattooDto> modifyTattoo(@PathVariable long id, @Valid @RequestBody TattooInDto tattooInDto)
            throws TattooNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {
        return ResponseEntity.ok(tattooService.modify(id, tattooInDto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/tattoos/{id}")
    public ResponseEntity<Void> deleteTattoo(@PathVariable long id) throws TattooNotFoundException {
        tattooService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(DuplicateTattooException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateTattoo(DuplicateTattooException dte) {
        return new ResponseEntity<>(ErrorResponse.conflict(dte.getMessage()), HttpStatus.CONFLICT);
    }
}