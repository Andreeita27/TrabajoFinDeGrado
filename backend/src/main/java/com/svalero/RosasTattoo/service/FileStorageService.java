package com.svalero.RosasTattoo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");

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
            throw new IllegalArgumentException("Tipo no permitido. Usa JPG/PNG/WebP");
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
}