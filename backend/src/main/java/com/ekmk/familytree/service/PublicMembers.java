package com.ekmk.familytree.service;

import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.security.FamilyAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BooleanSupplier;

/**
 * What the family website may see of a member.
 *
 * Emails and the admin's working notes always stay on the admin site (/api/admin/members).
 * Phone numbers are shown: the Call button needs them.
 * Addresses are shown only while the family password is on, so only the family can see them;
 * if the admin turns the password off (the site is open to anyone with the link), they are left out again.
 */
@Component
public class PublicMembers {

    /** Fields removed from every public answer. */
    public static final Set<String> PRIVATE_FIELDS = Set.of(
            "email",
            "formFatherName",
            "formMotherName",
            "formSpouseName",
            "source",
            "noSpouse",
            "noChildren"
    );

    /** Fields shown only while the family password is on. */
    public static final Set<String> FAMILY_ONLY_FIELDS = Set.of("address");

    private static final TypeReference<LinkedHashMap<String, Object>> AS_MAP = new TypeReference<>() {
    };

    private final ObjectMapper mapper;
    private final BooleanSupplier familyPasswordOn;

    @Autowired
    public PublicMembers(ObjectMapper mapper, FamilyAuthService family) {
        this(mapper, family::isRequired);
    }

    public PublicMembers(ObjectMapper mapper, BooleanSupplier familyPasswordOn) {
        this.mapper = mapper;
        this.familyPasswordOn = familyPasswordOn;
    }

    public Map<String, Object> of(FamilyMember member) {
        Map<String, Object> view = mapper.convertValue(member, AS_MAP);
        PRIVATE_FIELDS.forEach(view::remove);
        if (!familyPasswordOn.getAsBoolean()) FAMILY_ONLY_FIELDS.forEach(view::remove);
        return view;
    }

    public List<Map<String, Object>> of(List<FamilyMember> members) {
        boolean familyOnly = familyPasswordOn.getAsBoolean();
        return members.stream().map(m -> {
            Map<String, Object> view = mapper.convertValue(m, AS_MAP);
            PRIVATE_FIELDS.forEach(view::remove);
            if (!familyOnly) FAMILY_ONLY_FIELDS.forEach(view::remove);
            return view;
        }).toList();
    }
}
