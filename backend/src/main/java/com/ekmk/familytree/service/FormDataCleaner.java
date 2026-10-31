package com.ekmk.familytree.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Pure helpers that tidy what people typed into the Google Form.
 * No database access, so they are easy to unit test.
 */
public final class FormDataCleaner {

    private FormDataCleaner() {
    }

    private static final Set<String> EMPTY_ANSWERS = Set.of("", "-", "--", "na", "n/a", "nil", "none", "no", "null", ".");

    private static final Map<String, String> PROFESSION_SYNONYMS = Map.of(
            "housewife", "Homemaker",
            "homemaker", "Homemaker",
            "homemakers", "Homemaker",
            "housemaker", "Homemaker",
            "home", "Homemaker"
    );

    /** Returns null for answers like "nil", "NA" or "-". */
    public static String blankToNull(String raw) {
        if (raw == null) return null;
        String s = raw.trim().replaceAll("\\s+", " ");
        return EMPTY_ANSWERS.contains(s.toLowerCase(Locale.ROOT)) ? null : s;
    }

    /**
     * "JAGADAMBAL S" -> "Jagadambal S", "ravi kumar" -> "Ravi Kumar".
     * Text that already mixes upper and lower case is kept as typed.
     * Initials (one or two letters, with or without dots) stay upper case.
     */
    public static String cleanName(String raw) {
        String s = blankToNull(raw);
        if (s == null) return null;
        boolean allUpper = s.equals(s.toUpperCase(Locale.ROOT));
        boolean allLower = s.equals(s.toLowerCase(Locale.ROOT));
        if (!allUpper && !allLower) return s;
        StringBuilder out = new StringBuilder();
        for (String word : s.split(" ")) {
            if (out.length() > 0) out.append(' ');
            String letters = word.replace(".", "");
            if (letters.length() <= 2) {
                out.append(word.toUpperCase(Locale.ROOT));
            } else {
                out.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1).toLowerCase(Locale.ROOT));
            }
        }
        return out.toString();
    }

    /** The longest word that is not an initial, used as the first name. */
    public static String[] splitName(String fullName) {
        if (fullName == null) return new String[] {null, null};
        String[] words = fullName.split(" ");
        int best = -1;
        for (int i = 0; i < words.length; i++) {
            String letters = words[i].replace(".", "");
            if (letters.length() > 2 && (best < 0 || letters.length() > words[best].replace(".", "").length())) {
                best = i;
            }
        }
        if (best < 0) return new String[] {fullName, ""};
        StringBuilder rest = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            if (i == best) continue;
            if (rest.length() > 0) rest.append(' ');
            rest.append(words[i]);
        }
        return new String[] {words[best], rest.toString()};
    }

    /**
     * Digits only. Indian numbers lose a leading +91 / 91 / 0 so every one is 10 digits.
     * Spreadsheet numbers such as "9994999043.0" or "9.994999043E9" are handled too.
     */
    public static String cleanPhone(String raw) {
        String s = blankToNull(raw);
        if (s == null) return null;
        // Two numbers in one answer ("98765 43210, W-91234 56789"): keep the first one.
        String[] parts = s.split("[,;/|]|\\bor\\b");
        if (parts.length > 1) {
            for (String part : parts) {
                if (part.replaceAll("[^0-9]", "").length() >= 7) {
                    s = part.trim();
                    break;
                }
            }
        }
        if (s.matches("^[0-9.]+[eE][+]?[0-9]+$")) {
            try {
                s = new java.math.BigDecimal(s).toPlainString();
            } catch (NumberFormatException ignored) {
                // fall through to digit stripping
            }
        }
        if (s.matches("^[0-9]+\\.0+$")) {
            s = s.substring(0, s.indexOf('.'));
        }
        String digits = s.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return null;
        if (digits.length() == 12 && digits.startsWith("91")) return digits.substring(2);
        if (digits.length() == 11 && digits.startsWith("0")) return digits.substring(1);
        return digits;
    }

    private static final DateTimeFormatter[] DATE_FORMATS = {
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("d-M-yyyy"),
            DateTimeFormatter.ofPattern("d.M.yyyy"),
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH),
    };

    /** Returns yyyy-MM-dd, or null when the text is not a date we understand. */
    public static String cleanDate(String raw) {
        String s = blankToNull(raw);
        if (s == null) return null;
        if (s.length() >= 10 && s.charAt(4) == '-' && s.contains(" ")) {
            s = s.substring(0, s.indexOf(' '));
        }
        if (s.length() >= 10 && s.charAt(4) == '-' && s.contains("T")) {
            s = s.substring(0, s.indexOf('T'));
        }
        for (DateTimeFormatter f : DATE_FORMATS) {
            try {
                return LocalDate.parse(s, f).toString();
            } catch (DateTimeParseException ignored) {
                // try the next format
            }
        }
        return null;
    }

    public static String cleanEmail(String raw) {
        String s = blankToNull(raw);
        return s == null ? null : s.toLowerCase(Locale.ROOT).replace(" ", "");
    }

    /** "male", "female", or null when unknown. Accepts English and Tamil answers. */
    public static String cleanGender(String raw) {
        String s = blankToNull(raw);
        if (s == null) return null;
        String l = s.toLowerCase(Locale.ROOT);
        if (l.equals("m") || l.startsWith("male") || l.equals("man") || l.equals("boy") || s.contains("ஆண்")) return "male";
        if (l.equals("f") || l.startsWith("female") || l.equals("woman") || l.equals("girl") || s.contains("பெண்")) return "female";
        return null;
    }

    /** Groups spellings of the same job, e.g. "House Wife" and "Home Maker" become "Homemaker". */
    public static String cleanProfession(String raw) {
        String s = blankToNull(raw);
        if (s == null) return null;
        String key = s.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
        String synonym = PROFESSION_SYNONYMS.get(key);
        if (synonym != null) return synonym;
        return cleanName(s);
    }

    /**
     * A spelling-insensitive key for place names, so "Nasiyanur" and "Nasiyanoor"
     * (or "Ramianahalli" and "Ramiyanahalli") are treated as the same place.
     */
    public static String placeKey(String place) {
        String s = place.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
        s = s.replace("oo", "u").replace("ee", "i").replace("y", "i").replace("w", "v").replace("th", "t");
        StringBuilder out = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (out.length() == 0 || out.charAt(out.length() - 1) != c) out.append(c);
        }
        return out.toString();
    }

    /**
     * Picks one spelling per place. Each comma-separated part is matched on its own,
     * and the most common spelling wins (ties: the first seen, e.g. already in the database).
     *
     * @param places every place answer, in the order seen
     * @return original answer -> cleaned answer, only for answers that change
     */
    public static Map<String, String> canonicalPlaces(List<String> places) {
        Map<String, Map<String, Integer>> spellingsByKey = new LinkedHashMap<>();
        for (String place : places) {
            if (place == null) continue;
            for (String part : place.split(",")) {
                String p = cleanName(part);
                if (p == null) continue;
                spellingsByKey.computeIfAbsent(placeKey(p), k -> new LinkedHashMap<>()).merge(p, 1, Integer::sum);
            }
        }
        Map<String, String> bestByKey = new LinkedHashMap<>();
        spellingsByKey.forEach((key, counts) -> {
            String best = null;
            int bestCount = -1;
            for (Map.Entry<String, Integer> e : counts.entrySet()) {
                if (e.getValue() > bestCount) {
                    best = e.getKey();
                    bestCount = e.getValue();
                }
            }
            bestByKey.put(key, best);
        });
        Map<String, String> changes = new LinkedHashMap<>();
        for (String place : places) {
            if (place == null || changes.containsKey(place)) continue;
            List<String> parts = new ArrayList<>();
            for (String part : place.split(",")) {
                String p = cleanName(part);
                if (p != null) parts.add(bestByKey.get(placeKey(p)));
            }
            String cleaned = String.join(", ", parts);
            if (!cleaned.equals(place)) changes.put(place, cleaned);
        }
        return changes;
    }

    /** Loose name key for spotting the same person typed twice ("R. Lakshmi" vs "Lakshmi R"). */
    public static String nameKey(String name) {
        if (name == null) return "";
        List<String> words = new ArrayList<>();
        for (String w : name.toLowerCase(Locale.ROOT).replace(".", " ").split("\\s+")) {
            if (!w.isBlank()) words.add(w);
        }
        words.sort(String::compareTo);
        return String.join(" ", words);
    }
}
