package com.ekmk.familytree.service;

import com.ekmk.familytree.model.FamilyBranch;
import com.ekmk.familytree.repository.FamilyBranchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FamilyBranchService {

    private final FamilyBranchRepository branchRepository;

    public FamilyBranchService(FamilyBranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    public List<FamilyBranch> getAllBranches() {
        return branchRepository.findAll();
    }

    public Optional<FamilyBranch> getBranchById(String id) {
        return branchRepository.findById(id);
    }

    public FamilyBranch saveBranch(FamilyBranch branch) {
        return branchRepository.save(branch);
    }

    public void deleteBranch(String id) {
        branchRepository.deleteById(id);
    }
}
