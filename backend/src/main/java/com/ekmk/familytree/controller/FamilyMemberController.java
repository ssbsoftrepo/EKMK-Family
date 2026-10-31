package com.ekmk.familytree.controller;

import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.service.FamilyMemberService;
import com.ekmk.familytree.service.PublicMembers;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Members for the public family website. Reads leave out private details
 * (see {@link PublicMembers}); the admin site reads /api/admin/members instead.
 */
@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
public class FamilyMemberController {

    private final FamilyMemberService memberService;
    private final PublicMembers publicMembers;

    public FamilyMemberController(FamilyMemberService memberService, PublicMembers publicMembers) {
        this.memberService = memberService;
        this.publicMembers = publicMembers;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllMembers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) Integer generation,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Boolean isDeceased) {
        String searchTerm = (q != null && !q.trim().isEmpty()) ? q : search;
        List<FamilyMember> members = memberService.searchMembers(searchTerm, branchId, generation, gender, isDeceased);
        return ResponseEntity.ok(publicMembers.of(members));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchMembers(
            @RequestParam(required = false, defaultValue = "") String q) {
        List<FamilyMember> members = memberService.searchMembers(q, null, null, null, null);
        return ResponseEntity.ok(publicMembers.of(members));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMemberById(@PathVariable String id) {
        return memberService.getMemberById(id)
                .map(publicMembers::of)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createMember(@RequestBody FamilyMember member) {
        FamilyMember created = memberService.createMember(member);
        return ResponseEntity.status(HttpStatus.CREATED).body(publicMembers.of(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateMember(@PathVariable String id, @RequestBody FamilyMember member) {
        FamilyMember updated = memberService.updateMember(id, member);
        return ResponseEntity.ok(publicMembers.of(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable String id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }
}
