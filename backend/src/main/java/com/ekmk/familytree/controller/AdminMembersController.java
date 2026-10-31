package com.ekmk.familytree.controller;

import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.service.FamilyMemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Full member records (addresses, emails, form answers) for the admin site only. */
@RestController
@RequestMapping("/api/admin/members")
@CrossOrigin(origins = "*")
public class AdminMembersController {

    private final FamilyMemberService memberService;

    public AdminMembersController(FamilyMemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public ResponseEntity<List<FamilyMember>> getAllMembers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) Integer generation,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Boolean isDeceased) {
        String searchTerm = (q != null && !q.trim().isEmpty()) ? q : search;
        return ResponseEntity.ok(memberService.searchMembers(searchTerm, branchId, generation, gender, isDeceased));
    }

    @GetMapping("/search")
    public ResponseEntity<List<FamilyMember>> searchMembers(@RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(memberService.searchMembers(q, null, null, null, null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FamilyMember> getMemberById(@PathVariable String id) {
        return memberService.getMemberById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
