package com.ekmk.familytree.controller;

import com.ekmk.familytree.model.FamilyBranch;
import com.ekmk.familytree.service.FamilyBranchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@CrossOrigin(origins = "*")
public class FamilyBranchController {

    private final FamilyBranchService branchService;

    public FamilyBranchController(FamilyBranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    public ResponseEntity<List<FamilyBranch>> getAllBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FamilyBranch> getBranchById(@PathVariable String id) {
        return branchService.getBranchById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FamilyBranch> createBranch(@RequestBody FamilyBranch branch) {
        FamilyBranch saved = branchService.saveBranch(branch);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FamilyBranch> updateBranch(@PathVariable String id, @RequestBody FamilyBranch branch) {
        branch.setId(id);
        FamilyBranch updated = branchService.saveBranch(branch);
        return ResponseEntity.ok(updated);
    }
}
