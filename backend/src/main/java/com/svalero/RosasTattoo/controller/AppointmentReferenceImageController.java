package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.enums.Role;
import com.svalero.RosasTattoo.repository.AppointmentRepository;
import com.svalero.RosasTattoo.repository.UserAccountRepository;
import com.svalero.RosasTattoo.service.FileStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class AppointmentReferenceImageController {

    private final AppointmentRepository appointmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageService storage;

    public AppointmentReferenceImageController(
            AppointmentRepository appointmentRepository,
            UserAccountRepository userAccountRepository,
            FileStorageService storage
    ) {
        this.appointmentRepository = appointmentRepository;
        this.userAccountRepository = userAccountRepository;
        this.storage = storage;
    }

    private Appointment mustFind(long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    private boolean canUpload(Authentication auth, Appointment appt) {
        if (auth == null || auth.getName() == null) return false;

        var email = auth.getName();
        var acc = userAccountRepository.findByEmail(email).orElse(null);
        if (acc == null || !acc.isEnabled()) return false;

        return acc.getRole() == Role.CLIENT
                && acc.getClient() != null
                && appt.getClient() != null
                && acc.getClient().getId() == appt.getClient().getId();
    }

    private boolean canRead(Authentication auth, Appointment appt) {
        if (auth == null || auth.getName() == null) return false;

        var email = auth.getName();
        var acc = userAccountRepository.findByEmail(email).orElse(null);
        if (acc == null || !acc.isEnabled()) return false;

        if (acc.getRole() == Role.ADMIN) return true;

        return acc.getRole() == Role.CLIENT
                && acc.getClient() != null
                && appt.getClient() != null
                && acc.getClient().getId() == appt.getClient().getId();
    }

    @PostMapping(value = "/{id}/reference-image", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> uploadReferenceImage(
            @PathVariable long id,
            @RequestParam("file") MultipartFile file,
            Authentication auth
    ) {
        Appointment appt = mustFind(id);

        if (!canUpload(auth, appt)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo el cliente puede subir la imagen de referencia"));
        }

        String imageUrl = storage.savePrivateAppointmentImage(id, file);

        appt.setReferenceImageUrl(imageUrl);
        appointmentRepository.save(appt);

        return ResponseEntity.ok(Map.of("referenceImageUrl", imageUrl));
    }

    @GetMapping("/{id}/reference-image")
    public ResponseEntity<Map<String, String>> getReferenceImage(@PathVariable long id, Authentication auth) {
        Appointment appt = mustFind(id);

        if (!canRead(auth, appt)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String imageUrl = appt.getReferenceImageUrl();
        if (imageUrl == null || imageUrl.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of("referenceImageUrl", imageUrl));
    }
}
