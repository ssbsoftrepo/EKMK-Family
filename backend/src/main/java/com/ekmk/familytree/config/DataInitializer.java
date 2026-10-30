package com.ekmk.familytree.config;

import com.ekmk.familytree.model.FamilyBranch;
import com.ekmk.familytree.model.FamilyMember;
import com.ekmk.familytree.repository.FamilyBranchRepository;
import com.ekmk.familytree.repository.FamilyMemberRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final FamilyMemberRepository memberRepository;
    private final FamilyBranchRepository branchRepository;
    private final ObjectMapper objectMapper;

    public DataInitializer(FamilyMemberRepository memberRepository,
                           FamilyBranchRepository branchRepository,
                           ObjectMapper objectMapper) {
        this.memberRepository = memberRepository;
        this.branchRepository = branchRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        if (branchRepository.count() == 0) {
            logger.info("Initializing family branches from seed-branches.json...");
            ClassPathResource branchResource = new ClassPathResource("data/seed-branches.json");
            if (branchResource.exists()) {
                try (InputStream is = branchResource.getInputStream()) {
                    List<FamilyBranch> branches = objectMapper.readValue(is, new TypeReference<List<FamilyBranch>>() {});
                    branchRepository.saveAll(branches);
                    logger.info("Successfully loaded {} family branches.", branches.size());
                }
            } else {
                logger.warn("seed-branches.json not found in classpath.");
            }
        }

        if (memberRepository.count() == 0) {
            logger.info("Initializing family members from seed-members.json...");
            ClassPathResource memberResource = new ClassPathResource("data/seed-members.json");
            if (memberResource.exists()) {
                try (InputStream is = memberResource.getInputStream()) {
                    List<FamilyMember> members = objectMapper.readValue(is, new TypeReference<List<FamilyMember>>() {});
                    memberRepository.saveAll(members);
                    logger.info("Successfully loaded {} family members into database.", members.size());
                }
            } else {
                logger.warn("seed-members.json not found in classpath.");
            }
        } else {
            logger.info("Database already contains {} family members. Skipping initial seed.", memberRepository.count());
        }
    }
}
