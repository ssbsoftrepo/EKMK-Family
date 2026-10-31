package com.ekmk.familytree.service;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class FormDataCleanerTest {

    @Test
    void phoneNumbersBecomeTenDigits() {
        assertEquals("9876543210", FormDataCleaner.cleanPhone("9876543210.0"));
        assertEquals("9876543210", FormDataCleaner.cleanPhone("9.87654321E9"));
        assertEquals("9876543210", FormDataCleaner.cleanPhone("+91 98765 43210"));
        assertEquals("9876543210", FormDataCleaner.cleanPhone("09876543210"));
        assertEquals("14165550199", FormDataCleaner.cleanPhone("+1 (416) 555-0199"));
        assertEquals("9876543210", FormDataCleaner.cleanPhone("9876543210, W-9123456789"));
        assertEquals("9876543210", FormDataCleaner.cleanPhone("98765 43210 / 91234 56789"));
        assertNull(FormDataCleaner.cleanPhone("nil"));
    }

    @Test
    void capitalNamesAreTidiedButInitialsStay() {
        assertEquals("Lakshmi R", FormDataCleaner.cleanName("LAKSHMI R"));
        assertEquals("Ravi Kumar", FormDataCleaner.cleanName("  ravi   kumar "));
        assertEquals("K.M. Selvi", FormDataCleaner.cleanName("K.M. SELVI"));
        assertEquals("McDonald Ravi", FormDataCleaner.cleanName("McDonald Ravi"));
        assertNull(FormDataCleaner.cleanName("  "));
    }

    @Test
    void firstNameIsTheLongestWordThatIsNotAnInitial() {
        String[] split = FormDataCleaner.splitName("K.M. Selvi");
        assertEquals("Selvi", split[0]);
        assertEquals("K.M.", split[1]);
        assertEquals("Lakshmi", FormDataCleaner.splitName("Lakshmi R")[0]);
    }

    @Test
    void datesBecomeIsoDates() {
        assertEquals("1970-11-21", FormDataCleaner.cleanDate("1970-11-21 00:00:00"));
        assertEquals("1970-11-21", FormDataCleaner.cleanDate("21/11/1970"));
        assertEquals("1970-11-02", FormDataCleaner.cleanDate("2-11-1970"));
        assertEquals("1970-11-21", FormDataCleaner.cleanDate("21 Nov 1970"));
        assertNull(FormDataCleaner.cleanDate("someday"));
    }

    @Test
    void jobsWithTheSameMeaningAreGrouped() {
        assertEquals("Homemaker", FormDataCleaner.cleanProfession("House Wife"));
        assertEquals("Homemaker", FormDataCleaner.cleanProfession("Home Maker "));
        assertEquals("Homemaker", FormDataCleaner.cleanProfession("HOMEMAKER"));
        assertEquals("Textile Business", FormDataCleaner.cleanProfession("Textile Business"));
        assertNull(FormDataCleaner.cleanProfession("NIL"));
    }

    @Test
    void genderAnswersInEnglishOrTamil() {
        assertEquals("male", FormDataCleaner.cleanGender("Male"));
        assertEquals("female", FormDataCleaner.cleanGender("F"));
        assertEquals("female", FormDataCleaner.cleanGender("பெண்"));
        assertNull(FormDataCleaner.cleanGender("prefer not to say"));
    }

    @Test
    void placeSpellingsAreMatched() {
        Map<String, String> changes = FormDataCleaner.canonicalPlaces(Arrays.asList(
                "Nasiyanur, Erode", "Nasiyanoor, Erode", "Nasiyanur", "Ramiyanahalli", "Ramianahalli", "Ramiyanahalli",
                "erode ", "Erode", null));
        assertEquals("Nasiyanur, Erode", changes.get("Nasiyanoor, Erode"));
        assertEquals("Ramiyanahalli", changes.get("Ramianahalli"));
        assertEquals("Erode", changes.get("erode "));
        assertFalse(changes.containsKey("Nasiyanur, Erode"));
    }

    @Test
    void sameNameWrittenDifferently() {
        assertEquals(FormDataCleaner.nameKey("R. Lakshmi"), FormDataCleaner.nameKey("Lakshmi R"));
    }

    @Test
    void googleFormHeadersAreRecognised() {
        Map<ImportService.Field, Integer> cols = ImportService.mapHeaders(List.of(
                "Timestamp", "Name", "Phone number", "Date of Birth", "Place of Residence",
                "Profession/ Occupation", "Address", "Email", "Comments", "Father's name"));
        assertEquals(1, cols.get(ImportService.Field.NAME));
        assertEquals(2, cols.get(ImportService.Field.PHONE));
        assertEquals(3, cols.get(ImportService.Field.BIRTH_DATE));
        assertEquals(4, cols.get(ImportService.Field.PLACE));
        assertEquals(5, cols.get(ImportService.Field.PROFESSION));
        assertEquals(6, cols.get(ImportService.Field.ADDRESS));
        assertEquals(7, cols.get(ImportService.Field.EMAIL));
        assertEquals(8, cols.get(ImportService.Field.NOTES));
        assertEquals(9, cols.get(ImportService.Field.FATHER));
    }

    @Test
    void csvWithQuotesAndNewlines() throws Exception {
        String csv = "﻿Name,Address\r\n\"Ravi K\",\"12, Main Street\nErode\"\r\n\"Selvi \"\"Akka\"\"\",Salem\n";
        List<List<String>> rows = ImportService.readCsv(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));
        assertEquals(3, rows.size());
        assertEquals("12, Main Street\nErode", rows.get(1).get(1));
        assertEquals("Selvi \"Akka\"", rows.get(2).get(0));
    }
}
