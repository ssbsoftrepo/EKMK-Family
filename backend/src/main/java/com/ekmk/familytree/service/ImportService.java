package com.ekmk.familytree.service;

import com.ekmk.familytree.dto.ImportReport;
import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.repository.FamilyMemberRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Imports the Google Form responses (Excel .xlsx or .csv).
 *
 * Uploading the same file again is safe: a row whose phone number and name match
 * someone already saved only fills in that person's empty details. Nothing typed
 * by the admin is overwritten, and no relations are changed.
 */
@Service
@Transactional
public class ImportService {

    public static final int MAX_ROWS = 2000;

    enum Field { NAME, PHONE, BIRTH_DATE, PLACE, PROFESSION, ADDRESS, EMAIL, NOTES, GENDER, FATHER, MOTHER, SPOUSE }

    private final FamilyMemberRepository memberRepository;
    private final FamilyMemberService memberService;

    public ImportService(FamilyMemberRepository memberRepository, FamilyMemberService memberService) {
        this.memberRepository = memberRepository;
        this.memberService = memberService;
    }

    public ImportReport importFile(String filename, InputStream in) throws IOException {
        List<List<String>> table = (filename != null && filename.toLowerCase(Locale.ROOT).endsWith(".csv"))
                ? readCsv(in)
                : readWorkbook(in);
        return importTable(table);
    }

    ImportReport importTable(List<List<String>> table) {
        ImportReport report = new ImportReport();
        if (table.isEmpty()) {
            throw new IllegalArgumentException("The file is empty");
        }
        Map<Field, Integer> columns = mapHeaders(table.get(0));
        if (!columns.containsKey(Field.NAME)) {
            throw new IllegalArgumentException("Could not find a \"Name\" column in the first row of the file");
        }
        if (table.size() - 1 > MAX_ROWS) {
            throw new IllegalArgumentException("The file has more than " + MAX_ROWS + " rows");
        }

        // 1. Read and clean every row. Later rows win, so someone who filled the form twice keeps their latest answers.
        Map<String, Map<Field, String>> byPerson = new LinkedHashMap<>();
        int phonesTidied = 0;
        int namesTidied = 0;
        int jobsGrouped = 0;
        int filledTwice = 0;
        for (int r = 1; r < table.size(); r++) {
            List<String> row = table.get(r);
            String rawName = cell(row, columns.get(Field.NAME));
            String name = FormDataCleaner.cleanName(rawName);
            if (name == null) {
                report.setSkippedEmpty(report.getSkippedEmpty() + 1);
                continue;
            }
            report.setTotalRows(report.getTotalRows() + 1);
            if (!name.equals(rawName == null ? null : rawName.trim())) namesTidied++;

            Map<Field, String> person = new HashMap<>();
            person.put(Field.NAME, name);
            String rawPhone = cell(row, columns.get(Field.PHONE));
            String phone = FormDataCleaner.cleanPhone(rawPhone);
            if (phone != null && !phone.equals(rawPhone == null ? null : rawPhone.trim())) phonesTidied++;
            person.put(Field.PHONE, phone);
            person.put(Field.BIRTH_DATE, FormDataCleaner.cleanDate(cell(row, columns.get(Field.BIRTH_DATE))));
            person.put(Field.PLACE, FormDataCleaner.blankToNull(cell(row, columns.get(Field.PLACE))));
            String rawJob = FormDataCleaner.blankToNull(cell(row, columns.get(Field.PROFESSION)));
            String job = FormDataCleaner.cleanProfession(rawJob);
            if (job != null && !job.equalsIgnoreCase(rawJob)) jobsGrouped++;
            person.put(Field.PROFESSION, job);
            person.put(Field.ADDRESS, FormDataCleaner.blankToNull(cell(row, columns.get(Field.ADDRESS))));
            person.put(Field.EMAIL, FormDataCleaner.cleanEmail(cell(row, columns.get(Field.EMAIL))));
            person.put(Field.NOTES, FormDataCleaner.blankToNull(cell(row, columns.get(Field.NOTES))));
            person.put(Field.GENDER, FormDataCleaner.cleanGender(cell(row, columns.get(Field.GENDER))));
            person.put(Field.FATHER, FormDataCleaner.cleanName(cell(row, columns.get(Field.FATHER))));
            person.put(Field.MOTHER, FormDataCleaner.cleanName(cell(row, columns.get(Field.MOTHER))));
            person.put(Field.SPOUSE, FormDataCleaner.cleanName(cell(row, columns.get(Field.SPOUSE))));

            String key = (phone == null ? "" : phone) + "|" + FormDataCleaner.nameKey(name);
            Map<Field, String> earlier = byPerson.get(key);
            if (earlier != null) {
                filledTwice++;
                person.forEach((f, v) -> {
                    if (v != null) earlier.put(f, v);
                });
            } else {
                byPerson.put(key, person);
            }
        }

        // 2. One spelling per place, including places already saved in the database.
        List<FamilyMember> existing = memberRepository.findAll();
        List<String> places = new ArrayList<>();
        for (FamilyMember m : existing) places.add(m.getCurrentCity());
        for (Map<Field, String> p : byPerson.values()) places.add(p.get(Field.PLACE));
        Map<String, String> placeFixes = FormDataCleaner.canonicalPlaces(places);
        for (Map<Field, String> p : byPerson.values()) {
            String place = p.get(Field.PLACE);
            if (place != null && placeFixes.containsKey(place)) p.put(Field.PLACE, placeFixes.get(place));
        }

        // 3. Save: fill in blanks of people already saved, add everyone else.
        Map<String, FamilyMember> existingByKey = new HashMap<>();
        for (FamilyMember m : existing) {
            existingByKey.put((m.getPhone() == null ? "" : m.getPhone()) + "|" + FormDataCleaner.nameKey(m.getFullName()), m);
        }
        for (Map<Field, String> p : byPerson.values()) {
            String key = (p.get(Field.PHONE) == null ? "" : p.get(Field.PHONE)) + "|" + FormDataCleaner.nameKey(p.get(Field.NAME));
            FamilyMember match = existingByKey.get(key);
            if (match != null) {
                if (fillBlanks(match, p)) {
                    memberRepository.save(match);
                    report.setUpdated(report.getUpdated() + 1);
                } else {
                    report.setUnchanged(report.getUnchanged() + 1);
                }
                continue;
            }
            FamilyMember m = new FamilyMember();
            String[] split = FormDataCleaner.splitName(p.get(Field.NAME));
            m.setFullName(p.get(Field.NAME));
            m.setFirstName(split[0]);
            m.setLastName(split[1]);
            m.setTamilName("");
            m.setSource("form-import");
            m.setGeneration(0);
            fillBlanks(m, p);
            FamilyMember saved = memberService.createMember(m);
            existingByKey.put(key, saved);
            report.getAddedIds().add(saved.getId());
            report.setAdded(report.getAdded() + 1);
        }

        // 4. Same name and birthday but different phone: probably one person, the admin decides.
        List<FamilyMember> everyone = memberRepository.findAll();
        Map<String, FamilyMember> byNameAndBirthday = new HashMap<>();
        for (FamilyMember m : everyone) {
            if (m.getBirthDate() == null || m.getBirthDate().isBlank()) continue;
            String k = FormDataCleaner.nameKey(m.getFullName()) + "|" + m.getBirthDate();
            FamilyMember other = byNameAndBirthday.putIfAbsent(k, m);
            if (other != null) {
                report.getPossibleDuplicates().add(new ImportReport.DuplicatePair(other.getId(), other.getFullName(), m.getId(), m.getFullName(), "same name and birthday"));
            }
        }

        // 5. What was tidied, in plain words for the admin.
        if (phonesTidied > 0) report.getFixes().add("Phone numbers tidied (" + phonesTidied + "), so every one is just digits");
        java.util.Set<String> importedPlaces = new java.util.HashSet<>();
        for (Map<Field, String> p : byPerson.values()) importedPlaces.add(p.get(Field.PLACE));
        placeFixes.forEach((from, to) -> {
            if (importedPlaces.contains(to) && !from.trim().equalsIgnoreCase(to)) {
                report.getFixes().add("Place name matched: " + from.trim() + " → " + to);
            }
        });
        if (namesTidied > 0) report.getFixes().add("Names written in capitals tidied (" + namesTidied + ")");
        if (jobsGrouped > 0) report.getFixes().add("Jobs grouped (" + jobsGrouped + "), e.g. House Wife and Home Maker → Homemaker");
        if (filledTwice > 0) report.getFixes().add("Filled the form twice (" + filledTwice + "): kept the latest answers");
        return report;
    }

    /** Sets only the fields that are still empty. Returns true when something changed. */
    private static boolean fillBlanks(FamilyMember m, Map<Field, String> p) {
        boolean changed = false;
        if (isBlank(m.getPhone()) && p.get(Field.PHONE) != null) { m.setPhone(p.get(Field.PHONE)); changed = true; }
        if (isBlank(m.getBirthDate()) && p.get(Field.BIRTH_DATE) != null) { m.setBirthDate(p.get(Field.BIRTH_DATE)); changed = true; }
        if (isBlank(m.getCurrentCity()) && p.get(Field.PLACE) != null) { m.setCurrentCity(p.get(Field.PLACE)); changed = true; }
        if (isBlank(m.getProfession()) && p.get(Field.PROFESSION) != null) { m.setProfession(p.get(Field.PROFESSION)); changed = true; }
        if (isBlank(m.getAddress()) && p.get(Field.ADDRESS) != null) { m.setAddress(p.get(Field.ADDRESS)); changed = true; }
        if (isBlank(m.getEmail()) && p.get(Field.EMAIL) != null) { m.setEmail(p.get(Field.EMAIL)); changed = true; }
        if (isBlank(m.getNotes()) && p.get(Field.NOTES) != null) { m.setNotes(p.get(Field.NOTES)); changed = true; }
        if (isBlank(m.getGender()) && p.get(Field.GENDER) != null) { m.setGender(p.get(Field.GENDER)); changed = true; }
        if (isBlank(m.getFormFatherName()) && p.get(Field.FATHER) != null) { m.setFormFatherName(p.get(Field.FATHER)); changed = true; }
        if (isBlank(m.getFormMotherName()) && p.get(Field.MOTHER) != null) { m.setFormMotherName(p.get(Field.MOTHER)); changed = true; }
        if (isBlank(m.getFormSpouseName()) && p.get(Field.SPOUSE) != null) { m.setFormSpouseName(p.get(Field.SPOUSE)); changed = true; }
        return changed;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /** Matches Google Form question titles to fields, whatever exact wording was used. */
    static Map<Field, Integer> mapHeaders(List<String> headers) {
        Map<Field, Integer> out = new LinkedHashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            String h = headers.get(i) == null ? "" : headers.get(i).toLowerCase(Locale.ROOT).trim();
            Field f = null;
            if (h.contains("timestamp")) continue;
            if (h.contains("father") || h.contains("அப்பா")) f = Field.FATHER;
            else if (h.contains("mother") || h.contains("அம்மா")) f = Field.MOTHER;
            else if (h.contains("spouse") || h.contains("husband") || h.contains("wife")) f = Field.SPOUSE;
            else if (h.contains("phone") || h.contains("mobile") || h.contains("whatsapp")) f = Field.PHONE;
            else if (h.contains("birth") || h.equals("dob") || h.contains("d.o.b")) f = Field.BIRTH_DATE;
            else if (h.contains("mail")) f = Field.EMAIL;
            else if (h.contains("address")) f = Field.ADDRESS;
            else if (h.contains("residence") || h.contains("place") || h.contains("city") || h.contains("town")) f = Field.PLACE;
            else if (h.contains("profession") || h.contains("occupation") || h.contains("job") || h.contains("work")) f = Field.PROFESSION;
            else if (h.contains("gender") || h.contains("male") || h.contains("sex")) f = Field.GENDER;
            else if (h.contains("comment") || h.contains("about") || h.contains("note")) f = Field.NOTES;
            else if (h.contains("name")) f = Field.NAME;
            if (f != null) out.putIfAbsent(f, i);
        }
        return out;
    }

    private static String cell(List<String> row, Integer index) {
        if (index == null || index >= row.size()) return null;
        return row.get(index);
    }

    private static List<List<String>> readWorkbook(InputStream in) throws IOException {
        List<List<String>> table = new ArrayList<>();
        DataFormatter formatter = new DataFormatter(Locale.ENGLISH);
        try (Workbook wb = WorkbookFactory.create(in)) {
            Sheet sheet = wb.getSheetAt(0);
            for (Row row : sheet) {
                if (table.size() > MAX_ROWS + 1) break;
                List<String> values = new ArrayList<>();
                short last = row.getLastCellNum();
                for (int c = 0; c < Math.max(last, 0); c++) {
                    Cell cell = row.getCell(c);
                    values.add(cellText(cell, formatter));
                }
                table.add(values);
            }
        } catch (org.apache.poi.EmptyFileException | org.apache.poi.openxml4j.exceptions.NotOfficeXmlFileException e) {
            throw new IllegalArgumentException("This does not look like an Excel file. Please upload the .xlsx or .csv file from Google Forms.");
        }
        return table;
    }

    private static String cellText(Cell cell, DataFormatter formatter) {
        if (cell == null) return null;
        CellType type = cell.getCellType() == CellType.FORMULA ? cell.getCachedFormulaResultType() : cell.getCellType();
        if (type == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate().toString();
            }
            double d = cell.getNumericCellValue();
            if (d == Math.rint(d) && Math.abs(d) < 1e15) {
                return Long.toString((long) d);
            }
        }
        return formatter.formatCellValue(cell);
    }

    /** Small CSV reader: commas, quoted fields, doubled quotes, newlines inside quotes. */
    static List<List<String>> readCsv(InputStream in) throws IOException {
        List<List<String>> table = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            List<String> row = new ArrayList<>();
            StringBuilder field = new StringBuilder();
            boolean quoted = false;
            int ch;
            boolean first = true;
            while ((ch = reader.read()) != -1) {
                char c = (char) ch;
                if (first && c == '﻿') { first = false; continue; }
                first = false;
                if (quoted) {
                    if (c == '"') {
                        reader.mark(1);
                        int next = reader.read();
                        if (next == '"') field.append('"');
                        else { quoted = false; if (next != -1) reader.reset(); }
                    } else {
                        field.append(c);
                    }
                } else if (c == '"') {
                    quoted = true;
                } else if (c == ',') {
                    row.add(field.toString());
                    field.setLength(0);
                } else if (c == '\n' || c == '\r') {
                    if (c == '\r') {
                        reader.mark(1);
                        if (reader.read() != '\n') reader.reset();
                    }
                    row.add(field.toString());
                    field.setLength(0);
                    if (!(row.size() == 1 && Objects.equals(row.get(0), ""))) table.add(row);
                    row = new ArrayList<>();
                    if (table.size() > MAX_ROWS + 1) break;
                } else {
                    field.append(c);
                }
            }
            if (field.length() > 0 || !row.isEmpty()) {
                row.add(field.toString());
                table.add(row);
            }
        }
        return table;
    }
}
