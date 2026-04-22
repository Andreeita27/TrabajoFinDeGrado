package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.UserAccount;
import com.svalero.RosasTattoo.domain.enums.Role;
import com.svalero.RosasTattoo.dto.ChangePasswordDto;
import com.svalero.RosasTattoo.dto.UserAccountDto;
import com.svalero.RosasTattoo.dto.UserAccountUpdateDto;
import com.svalero.RosasTattoo.exception.ErrorResponse;
import com.svalero.RosasTattoo.exception.ForbiddenOperationException;
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

    private UserAccount requireClientAccount(Authentication auth) throws ForbiddenOperationException {
        String email = auth.getName();
        UserAccount account = userAccountRepository.findByEmail(email).orElse(null);

        if (account == null || !account.isEnabled()) {
            throw new ForbiddenOperationException("Unauthorized");
        }

        if (account.getRole() != Role.CLIENT || account.getClient() == null) {
            throw new ForbiddenOperationException("Only CLIENT accounts can use /me");
        }

        return account;
    }

    @GetMapping("/me")
    public ResponseEntity<UserAccountDto> getMe(Authentication auth) throws ForbiddenOperationException {
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
    public ResponseEntity<?> updateMe(Authentication auth, @Valid @RequestBody UserAccountUpdateDto body) throws ForbiddenOperationException {
        UserAccount account = requireClientAccount(auth);
        Client c = account.getClient();

        String newEmail = body.getEmail().trim();

        if (!newEmail.equalsIgnoreCase(account.getEmail())) {
            if (userAccountRepository.existsByEmail(newEmail)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ErrorResponse.conflict("Email already in use"));
            }
            account.setEmail(newEmail);
            c.setEmail(newEmail);
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
    public ResponseEntity<?> changePassword(Authentication auth, @Valid @RequestBody ChangePasswordDto body) throws ForbiddenOperationException {
        UserAccount account = requireClientAccount(auth);

        if (!passwordEncoder.matches(body.getCurrentPassword(), account.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse.badRequest("Current password is incorrect"));
        }

        account.setPasswordHash(passwordEncoder.encode(body.getNewPassword()));
        userAccountRepository.save(account);

        return ResponseEntity.noContent().build();
    }
}