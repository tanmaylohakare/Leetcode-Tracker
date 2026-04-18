package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.transaction.Transactional;
import java.util.Optional;

public interface SectionInfoRepository extends JpaRepository<SectionInfo, Long> {
    Optional<SectionInfo> findBySectionName(String sectionName);

    @Transactional
    @Modifying
    @Query("DELETE FROM SectionInfo s WHERE s.sectionName = :sectionName")
    void deleteBySectionName(@Param("sectionName") String sectionName);
}
