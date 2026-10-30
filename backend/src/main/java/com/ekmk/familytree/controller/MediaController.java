package com.ekmk.familytree.controller;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*")
public class MediaController {

    private static final Logger log = LoggerFactory.getLogger(MediaController.class);

    @Value("${app.upload.dir:uploads/photos}")
    private String uploadDir;

    private Path rootPath;

    @PostConstruct
    public void init() {
        try {
            rootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(rootPath);
            log.info("Media storage directory initialized at: {}", rootPath);
        } catch (IOException e) {
            log.error("Could not initialize storage directory", e);
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    /**
     * Upload an image file directly from the Admin master form.
     * Generates a unique, clean filename and stores it on the server filesystem.
     * Returns the direct HTTP access URL and metadata.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file selected or file is empty"));
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image files (JPEG, PNG, WEBP) are supported"));
        }

        // Determine extension
        String extension = ".jpg";
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            if (ext.matches("^\\.(jpe?g|png|webp|gif|svg)$")) {
                extension = ext;
            }
        } else if (contentType.equalsIgnoreCase("image/png")) {
            extension = ".png";
        } else if (contentType.equalsIgnoreCase("image/webp")) {
            extension = ".webp";
        }

        // Generate clean unique filename
        String uniqueName = "photo_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16) + extension;

        try {
            Path destinationFile = rootPath.resolve(uniqueName).normalize();
            if (!destinationFile.startsWith(rootPath)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Invalid file path"));
            }

            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Successfully stored photo: {} ({} bytes)", uniqueName, file.getSize());

            String publicUrl = "/api/media/photos/" + uniqueName;

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "filename", uniqueName,
                    "url", publicUrl,
                    "size", file.getSize(),
                    "contentType", contentType
            ));

        } catch (IOException e) {
            log.error("Failed to store file {}", uniqueName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store image on server: " + e.getMessage()));
        }
    }

    /**
     * Serve photo files with HTTP caching for optimal production performance.
     */
    @GetMapping("/photos/{filename:.+}")
    public ResponseEntity<Resource> getPhoto(@PathVariable String filename) {
        try {
            Path filePath = rootPath.resolve(filename).normalize();
            if (!filePath.startsWith(rootPath) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            MediaType mediaType = MediaTypeFactory.getMediaType(filename).orElse(MediaType.IMAGE_JPEG);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Malformed URL for filename {}", filename, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
