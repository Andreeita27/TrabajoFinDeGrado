package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.enums.Role;
import com.svalero.RosasTattoo.repository.AppointmentRepository;
import com.svalero.RosasTattoo.repository.UserAccountRepository;
import com.svalero.RosasTattoo.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
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
        return appointmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    private boolean canAccess(Authentication auth, Appointment appt) {
        if (auth == null || auth.getName() == null) return false;

        var email = auth.getName();
        var acc = userAccountRepository.findByEmail(email).orElse(null);
        if (acc == null || !acc.isEnabled()) return false;

        if (acc.getRole() == Role.ADMIN) return true;

        // CLIENT: solo si es dueño de la cita
        return acc.getRole() == Role.CLIENT
                && acc.getClient() != null
                && appt.getClient() != null
                && acc.getClient().getId() == appt.getClient().getId();
    }

    // SUBIR (ADMIN o dueño)
    @PostMapping(value = "/{id}/reference-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadReferenceImage(
            @PathVariable long id,
            @RequestParam("file") MultipartFile file,
            Authentication auth
    ) throws Exception {
        Appointment appt = mustFind(id);

        if (!canAccess(auth, appt)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));
        }

        String privatePath = storage.savePrivateAppointmentImage(id, file);

        appt.setReferenceImageUrl(privatePath);
        appointmentRepository.save(appt);

        // devuevlo el “path lógico” para pedirlo luego
        return ResponseEntity.ok(Map.of("referenceImagePath", privatePath));
    }

    // DESCARGAR/VER (ADMIN o dueño)
    @GetMapping("/{id}/reference-image")
    public ResponseEntity<Resource> getReferenceImage(@PathVariable long id, Authentication auth) throws Exception {
        Appointment appt = mustFind(id);

        if (!canAccess(auth, appt)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String p = appt.getReferenceImageUrl();
        if (p == null || p.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        // p = "/private/appointments/{id}/{file}"
        // lo convierot a ruta física: uploadDir + p
        // (sin “/” inicial para no romper Paths.get)
        String rel = p.startsWith("/") ? p.substring(1) : p;
        Path filePath = Paths.get(storage.getUploadDir()).resolve(rel).normalize();

        Resource res = new UrlResource(filePath.toUri());
        if (!res.exists()) return ResponseEntity.notFound().build();

        // Content-Type “genérico” para imagen
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(res);
    }
}
