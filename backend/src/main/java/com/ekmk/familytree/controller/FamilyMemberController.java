package com.ekmk.familytree.controller;

import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.service.FamilyMemberService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
public class FamilyMemberController {

    private final FamilyMemberService memberService;

    public FamilyMemberController(FamilyMemberService memberService) {
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
        List<FamilyMember> members = memberService.searchMembers(searchTerm, branchId, generation, gender, isDeceased);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/search")
    public ResponseEntity<List<FamilyMember>> searchMembers(
            @RequestParam(required = false, defaultValue = "") String q) {
        List<FamilyMember> members = memberService.searchMembers(q, null, null, null, null);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FamilyMember> getMemberById(@PathVariable String id) {
        return memberService.getMemberById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FamilyMember> createMember(@RequestBody FamilyMember member) {
        FamilyMember created = memberService.createMember(member);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FamilyMember> updateMember(@PathVariable String id, @RequestBody FamilyMember member) {
        FamilyMember updated = memberService.updateMember(id, member);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable String id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }
}
