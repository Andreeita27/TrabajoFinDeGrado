package com.svalero.RosasTattoo.controller;

import com.svalero.RosasTattoo.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Set;

@RestController
public class FileController {

    private final FileStorageService storage;

    public FileController(FileStorageService storage) {
        this.storage = storage;
    }

    @PostMapping("/files/public/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadPublic(@PathVariable String type,
                                          @RequestParam("file") MultipartFile file) {

        if (!Set.of("tattoos", "designs", "professionals").contains(type)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tipo no soportado"));
        }

        String url = storage.storePublicImage(file, type);
        return ResponseEntity.ok(Map.of("url", url));
    }
}