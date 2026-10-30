package com.ekmk.familytree.repository;

import com.ekmk.familytree.model.FamilyBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FamilyBranchRepository extends JpaRepository<FamilyBranch, String> {
}
