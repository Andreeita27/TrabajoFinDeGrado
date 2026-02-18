package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.dto.ClientInDto;
import com.svalero.RosasTattoo.dto.ClientDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class ClientController {

    @Autowired
    private ClientService clientService;

    @GetMapping("/clients")
    public ResponseEntity<List<ClientDto>> getAll(
            @RequestParam(value = "clientName", defaultValue = "") String clientName,
            @RequestParam(value = "clientSurname", defaultValue = "") String clientSurname,
            @RequestParam(value = "showPhoto", required = false) Boolean showPhoto
    ) {
        List<ClientDto> clients = clientService.findAll(clientName, clientSurname, showPhoto);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/clients/{id}")
    public ResponseEntity<ClientDto> getClient(@PathVariable long id) throws ClientNotFoundException {
        ClientDto client = clientService.findById(id);
        return ResponseEntity.ok(client);
    }

    @PostMapping("/clients")
    public ResponseEntity<ClientDto> addClient(@Valid @RequestBody ClientInDto clientInDto) {
        return new ResponseEntity<>(clientService.add(clientInDto), HttpStatus.CREATED);
    }

    @PutMapping("/clients/{id}")
    public ResponseEntity<ClientDto> modifyClient(@PathVariable long id, @Valid @RequestBody ClientInDto clientInDto)
            throws ClientNotFoundException {
        ClientDto modifiedClient = clientService.modify(id, clientInDto);
        return ResponseEntity.ok(modifiedClient);
    }

    @DeleteMapping("/clients/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable long id) throws ClientNotFoundException {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ClientNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleException(ClientNotFoundException cnfe) {
        ErrorResponse errorResponse = ErrorResponse.notFound(cnfe.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleException(MethodArgumentNotValidException manve) {
        Map<String, String> errors = new HashMap<>();
        manve.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });

        ErrorResponse errorResponse = ErrorResponse.validationError(errors);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}