package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.UserAccount;
import com.svalero.RosasTattoo.domain.enums.Role;
import com.svalero.RosasTattoo.dto.*;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.repository.ClientRepository;
import com.svalero.RosasTattoo.repository.UserAccountRepository;
import com.svalero.RosasTattoo.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    @Autowired
    private UserAccountRepository userAccountRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDto dto) {

        if (userAccountRepository.existsByEmail(dto.getEmail())) {
            ErrorResponse error = ErrorResponse.generalError(409, "conflict", "Email already registered");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        Client client = new Client();
        client.setClientName(dto.getClientName());
        client.setClientSurname(dto.getClientSurname());
        client.setEmail(dto.getEmail());
        client.setPhone(dto.getPhone());
        client.setBirthDate(dto.getBirthDate());
        client.setShowPhoto(dto.isShowPhoto());
        client.setVisits(0);

        Client savedClient = clientRepository.save(client);

        UserAccount account = new UserAccount();
        account.setEmail(dto.getEmail());
        account.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        account.setRole(Role.CLIENT);
        account.setEnabled(true);
        account.setClient(savedClient);

        userAccountRepository.save(account);

        String token = jwtService.generateToken(account.getEmail(), account.getRole());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponseDto(token, account.getRole().name(), savedClient.getId()));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto dto) {

        UserAccount account = userAccountRepository.findByEmail(dto.getEmail()).orElse(null);

        if (account == null || !account.isEnabled()
                || !passwordEncoder.matches(dto.getPassword(), account.getPasswordHash())) {
            ErrorResponse error = ErrorResponse.generalError(401, "unauthorized", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String token = jwtService.generateToken(account.getEmail(), account.getRole());
        Long clientId = null;
        if (account.getRole() == Role.CLIENT && account.getClient() != null) {
            clientId = account.getClient().getId();
        }

        return ResponseEntity.ok(new AuthResponseDto(token, account.getRole().name(), clientId));
    }
}