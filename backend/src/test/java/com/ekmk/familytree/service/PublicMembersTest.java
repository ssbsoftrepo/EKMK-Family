package com.ekmk.familytree.service;

import com.ekmk.familytree.model.FamilyMember;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicMembersTest {

    @Test
    void publicViewLeavesOutPrivateDetailsButKeepsPhone() {
        FamilyMember m = new FamilyMember();
        m.setId("ekmk-test");
        m.setFullName("Ravi Muthu");
        m.setPhone("9876500002");
        m.setAddress("12, Main Street, Erode");
        m.setEmail("ravi@example.com");
        m.setFormFatherName("Muthu");
        m.setNotes("Loves cricket");
        m.setNoSpouse(false);

        Map<String, Object> view = new PublicMembers(JsonMapper.builder().build()).of(m);

        assertEquals("Ravi Muthu", view.get("fullName"));
        assertEquals("9876500002", view.get("phone"));
        assertEquals("Loves cricket", view.get("notes"));
        for (String field : PublicMembers.PRIVATE_FIELDS) {
            assertFalse(view.containsKey(field), field + " must not be public");
        }
        assertTrue(view.containsKey("childIds"));
    }
}
