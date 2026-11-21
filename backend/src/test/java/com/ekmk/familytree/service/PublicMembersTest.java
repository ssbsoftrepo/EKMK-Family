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

        Map<String, Object> view = new PublicMembers(JsonMapper.builder().build(), () -> true).of(m);

        assertEquals("Ravi Muthu", view.get("fullName"));
        assertEquals("9876500002", view.get("phone"));
        assertEquals("Loves cricket", view.get("notes"));
        for (String field : PublicMembers.PRIVATE_FIELDS) {
            assertFalse(view.containsKey(field), field + " must not be public");
        }
        assertTrue(view.containsKey("childIds"));
        assertEquals("12, Main Street, Erode", view.get("address"), "behind the family password the family sees the address");
    }

    @Test
    void withoutTheFamilyPasswordTheAddressStaysHidden() {
        FamilyMember m = new FamilyMember();
        m.setId("ekmk-test");
        m.setFullName("Ravi Muthu");
        m.setAddress("12, Main Street, Erode");
        PublicMembers open = new PublicMembers(JsonMapper.builder().build(), () -> false);
        assertFalse(open.of(m).containsKey("address"));
        assertFalse(open.of(java.util.List.of(m)).get(0).containsKey("address"));
    }

    @Test
    void deserializationKeepsIsDeceasedNullWhenOmitted() throws Exception {
        tools.jackson.databind.ObjectMapper mapper = new tools.jackson.databind.ObjectMapper();
        FamilyMember m = mapper.readValue("{\"notes\": \"hello\"}", FamilyMember.class);
        org.junit.jupiter.api.Assertions.assertNull(m.getIsDeceased(), "isDeceased must be null when omitted from JSON");
    }
}
