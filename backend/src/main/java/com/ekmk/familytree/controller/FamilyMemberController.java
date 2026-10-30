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
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) Integer generation) {
        List<FamilyMember> members = memberService.getAllMembers();
        if (branchId != null && !branchId.trim().isEmpty()) {
            members = members.stream().filter(m -> branchId.equalsIgnoreCase(m.getBranchId())).toList();
        }
        if (generation != null) {
            members = members.stream().filter(m -> m.getGeneration() == generation).toList();
        }
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
        try {
            FamilyMember updated = memberService.updateMember(id, member);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable String id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }
}
