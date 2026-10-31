package com.ekmk.familytree.service;

import com.ekmk.familytree.model.FamilyMember;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OneHusbandRuleTest {

    private final Map<String, FamilyMember> people = new HashMap<>();

    private FamilyMember person(String id, String gender, String... spouses) {
        FamilyMember m = new FamilyMember();
        m.setId(id);
        m.setFullName(id);
        m.setGender(gender);
        m.setSpouseIds(List.of(spouses));
        people.put(id, m);
        return m;
    }

    private void check(String id, String gender, String... spouses) {
        FamilyMemberService.checkOneHusband(id, gender, List.of(spouses), x -> Optional.ofNullable(people.get(x)));
    }

    @Test
    void aWomanCannotHaveTwoHusbands() {
        person("ravi", "male");
        person("kumar", "male");
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> check("selvi", "female", "ravi", "kumar"));
        assertTrue(e.getMessage().contains("only one husband"));
    }

    @Test
    void aMarriedWomanCannotBeGivenAnotherHusband() {
        person("selvi", "female", "kumar");
        person("kumar", "male", "selvi");
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> check("mani", "male", "selvi"));
        assertTrue(e.getMessage().startsWith("selvi already has a husband"));
    }

    @Test
    void savingTheSameCoupleAgainIsFine() {
        person("selvi", "female", "kumar");
        assertDoesNotThrow(() -> check("kumar", "male", "selvi"));
        assertDoesNotThrow(() -> check("selvi", "female", "kumar"));
    }

    @Test
    void aManMayStillHaveMoreThanOneWife() {
        person("kamala", "female");
        person("valli", "female");
        assertDoesNotThrow(() -> check("muthu", "male", "kamala", "valli"));
    }

    @Test
    void unknownGenderIsNotBlocked() {
        person("a", null);
        person("b", null);
        assertDoesNotThrow(() -> check("x", null, "a", "b"));
    }
}
