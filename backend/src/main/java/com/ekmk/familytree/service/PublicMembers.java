package com.ekmk.familytree.service;

import com.ekmk.familytree.model.FamilyMember;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * What the public family website may see of a member.
 *
 * The site has no login, so anything in these answers is visible to anyone with the link.
 * Addresses, emails and the admin's working notes stay on the admin site
 * (/api/admin/members). Phone numbers stay public: the Call and WhatsApp buttons need them.
 */
@Component
public class PublicMembers {

    /** Fields removed from every public answer. */
    public static final Set<String> PRIVATE_FIELDS = Set.of(
            "address",
            "email",
            "formFatherName",
            "formMotherName",
            "formSpouseName",
            "source",
            "noSpouse",
            "noChildren"
    );

    private static final TypeReference<LinkedHashMap<String, Object>> AS_MAP = new TypeReference<>() {
    };

    private final ObjectMapper mapper;

    public PublicMembers(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> of(FamilyMember member) {
        Map<String, Object> view = mapper.convertValue(member, AS_MAP);
        PRIVATE_FIELDS.forEach(view::remove);
        return view;
    }

    public List<Map<String, Object>> of(List<FamilyMember> members) {
        return members.stream().map(this::of).toList();
    }
}
