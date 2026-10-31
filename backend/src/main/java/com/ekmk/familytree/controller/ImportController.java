package com.ekmk.familytree.controller;

import com.ekmk.familytree.dto.ImportReport;
import com.ekmk.familytree.service.ImportService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class ImportController {

    private final ImportService importService;

    public ImportController(ImportService importService) {
        this.importService = importService;
    }

    /** Upload the Google Form responses (.xlsx or .csv). Safe to repeat: only new people are added. */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importResponses(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please choose the Excel file first"));
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload the .xlsx or .csv file from Google Forms"));
        }
        ImportReport report = importService.importFile(name, file.getInputStream());
        return ResponseEntity.ok(report);
    }
}
