package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.ClientInDto;
import com.svalero.RosasTattoo.dto.ClientDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class ClientController {

    @Autowired
    private ClientService clientService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/clients")
    public ResponseEntity<List<ClientDto>> getAll(
            @RequestParam(value = "clientName", defaultValue = "") String clientName,
            @RequestParam(value = "clientSurname", defaultValue = "") String clientSurname,
            @RequestParam(value = "showPhoto", required = false) Boolean showPhoto
    ) {
        List<ClientDto> clients = clientService.findAll(clientName, clientSurname, showPhoto);
        return ResponseEntity.ok(clients);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/clients/{id}")
    public ResponseEntity<ClientDto> getClient(@PathVariable long id) throws ClientNotFoundException {
        ClientDto client = clientService.findById(id);
        return ResponseEntity.ok(client);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/clients")
    public ResponseEntity<ClientDto> addClient(@Valid @RequestBody ClientInDto clientInDto) {
        return new ResponseEntity<>(clientService.add(clientInDto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/clients/{id}")
    public ResponseEntity<ClientDto> modifyClient(@PathVariable long id, @Valid @RequestBody ClientInDto clientInDto)
            throws ClientNotFoundException {
        ClientDto modifiedClient = clientService.modify(id, clientInDto);
        return ResponseEntity.ok(modifiedClient);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/clients/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable long id) throws ClientNotFoundException {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}