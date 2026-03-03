package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.UserAccount;
import com.svalero.RosasTattoo.domain.enums.Role;
import com.svalero.RosasTattoo.dto.ChangePasswordDto;
import com.svalero.RosasTattoo.dto.UserAccountDto;
import com.svalero.RosasTattoo.dto.UserAccountUpdateDto;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.repository.ClientRepository;
import com.svalero.RosasTattoo.repository.UserAccountRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserAccountController {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserAccount requireClientAccount(Authentication auth) {
        String email = auth.getName();
        UserAccount account = userAccountRepository.findByEmail(email).orElse(null);
        if (account == null || !account.isEnabled()) {
            throw new RuntimeException("Unauthorized");
        }
        if (account.getRole() != Role.CLIENT || account.getClient() == null) {
            throw new RuntimeException("Only CLIENT accounts can use /me");
        }
        return account;
    }

    @GetMapping("/me")
    public ResponseEntity<UserAccountDto> getMe(Authentication auth) {
        UserAccount account = requireClientAccount(auth);
        Client c = account.getClient();

        UserAccountDto dto = UserAccountDto.builder()
                .email(account.getEmail())
                .phone(c.getPhone())
                .showPhoto(c.isShowPhoto())
                .clientId(c.getId())
                .clientName(c.getClientName())
                .clientSurname(c.getClientSurname())
                .build();

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me")
    public ResponseEntity<UserAccountDto> updateMe(Authentication auth, @Valid @RequestBody UserAccountUpdateDto body) {
        UserAccount account = requireClientAccount(auth);
        Client c = account.getClient();

        String newEmail = body.getEmail().trim();

        if (!newEmail.equalsIgnoreCase(account.getEmail())) {
            if (userAccountRepository.existsByEmail(newEmail)) {
                return new ResponseEntity<>(null, HttpStatus.CONFLICT);
            }
            account.setEmail(newEmail);
            c.setEmail(newEmail); // mantener sincronizado
        }

        c.setPhone(body.getPhone());
        c.setShowPhoto(body.isShowPhoto());

        clientRepository.save(c);
        userAccountRepository.save(account);

        UserAccountDto out = UserAccountDto.builder()
                .email(account.getEmail())
                .phone(c.getPhone())
                .showPhoto(c.isShowPhoto())
                .clientId(c.getId())
                .clientName(c.getClientName())
                .clientSurname(c.getClientSurname())
                .build();

        return ResponseEntity.ok(out);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(Authentication auth, @Valid @RequestBody ChangePasswordDto body) {
        UserAccount account = requireClientAccount(auth);

        if (!passwordEncoder.matches(body.getCurrentPassword(), account.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        account.setPasswordHash(passwordEncoder.encode(body.getNewPassword()));
        userAccountRepository.save(account);

        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException ex) {
        ErrorResponse error = ErrorResponse.generalError(403, "forbidden", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }
}
