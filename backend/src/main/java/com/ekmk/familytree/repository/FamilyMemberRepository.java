package com.ekmk.familytree.repository;

import com.ekmk.familytree.model.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, String> {
    List<FamilyMember> findByBranchId(String branchId);
    List<FamilyMember> findByGeneration(int generation);
    List<FamilyMember> findByFatherId(String fatherId);
    List<FamilyMember> findByMotherId(String motherId);
    List<FamilyMember> findBySpouseId(String spouseId);
}
