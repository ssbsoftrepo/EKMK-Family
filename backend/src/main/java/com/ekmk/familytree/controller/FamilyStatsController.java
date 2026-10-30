package com.ekmk.familytree.controller;

import com.ekmk.familytree.dto.FamilyStatsDto;
import com.ekmk.familytree.service.FamilyMemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class FamilyStatsController {

    private final FamilyMemberService memberService;

    public FamilyStatsController(FamilyMemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public ResponseEntity<FamilyStatsDto> getFamilyStats() {
        return ResponseEntity.ok(memberService.calculateStats());
    }
}
