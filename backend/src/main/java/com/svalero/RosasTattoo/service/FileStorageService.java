package com.svalero.RosasTattoo.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");

    private final Cloudinary cloudinary;

    public FileStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String storePublicImage(MultipartFile file, String folder) {
        validateImage(file);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "62rosas/" + folder,
                            "resource_type", "image"
                    )
            );

            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary no devolvió secure_url");
            }

            return secureUrl.toString();
        } catch (IOException e) {
            throw new RuntimeException("Error subiendo imagen a Cloudinary", e);
        }
    }

    public String savePrivateAppointmentImage(long appointmentId, MultipartFile file) {
        validateImage(file);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "62rosas/appointments/" + appointmentId,
                            "resource_type", "image"
                    )
            );

            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary no devolvió secure_url");
            }

            return secureUrl.toString();
        } catch (IOException e) {
            throw new RuntimeException("Error subiendo imagen de cita a Cloudinary", e);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Archivo vacío");
        }

        String ct = file.getContentType();
        if (ct == null || !ALLOWED.contains(ct)) {
            throw new IllegalArgumentException("Tipo no permitido. Usa JPG/PNG/WebP");
        }
    }
}