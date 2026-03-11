package com.svalero.RosasTattoo.service;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");

    @Getter
    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.upload.public-base:/uploads}")
    private String publicBase;

    public String storePublicImage(MultipartFile file, String folder) {
        String filename = store(file, Paths.get(uploadDir, "public", folder));
        // Devuelve RUTA RELATIVA (mejor para localhost e IP)
        return publicBase + "/" + folder + "/" + filename;
    }

    public String storePrivateImage(MultipartFile file, String folder) {
        // Para privado devuelvo solo el nombre del fichero
        return store(file, Paths.get(uploadDir, "private", folder));
    }

    public Path resolvePrivate(String folder, String filename) {
        return Paths.get(uploadDir, "private", folder, filename);
    }

    private String store(MultipartFile file, Path dir) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Archivo vacío");
        }

        String ct = file.getContentType();
        if (ct == null || !ALLOWED.contains(ct)) {
            throw new IllegalArgumentException("Formato no permitido. Usa JPG/PNG/WebP");
        }

        String ext = switch (ct) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> "";
        };

        String filename = UUID.randomUUID() + ext;

        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (Exception e) {
            throw new RuntimeException("Error guardando archivo", e);
        }
    }

    public String savePrivateAppointmentImage(long appointmentId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("El archivo está vacío.");

        String ct = file.getContentType();
        if (ct == null || !ALLOWED.contains(ct)) {
            throw new IllegalArgumentException("Formato inválido: " + ct);
        }

        String ext = switch (ct) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> "";
        };

        Path base = Paths.get(uploadDir, "private", "appointments", String.valueOf(appointmentId));
        Files.createDirectories(base);

        String filename = UUID.randomUUID() + ext;
        Path target = base.resolve(filename);

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // OJO: esto NO es una URL pública. Es una “ruta lógica” privada para el endpoint protegido.
        return "/private/appointments/" + appointmentId + "/" + filename;
    }
}