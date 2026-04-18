package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.transaction.Transactional;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByUsername(String username);
    long countBySection(String section);

    @Transactional
    @Modifying
    @Query("DELETE FROM Student s WHERE s.username = :username")
    void deleteByUsername(@Param("username") String username);

    @Transactional
    @Modifying
    @Query("DELETE FROM Student s WHERE s.section = :section")
    void deleteBySection(@Param("section") String section);

    Optional<Student> findByUsername(String username);

    @jakarta.transaction.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Student s SET s.section = :newName WHERE s.section = :oldName")
    void updateSectionName(String oldName, String newName);
}
