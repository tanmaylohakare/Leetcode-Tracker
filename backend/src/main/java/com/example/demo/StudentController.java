package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.transaction.Transactional;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class StudentController {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private SectionInfoRepository sectionInfoRepository;
    
    @Autowired
    private LeetCodeService leetCodeService;
    
    @GetMapping
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    @PostMapping
    public Student addStudent(@RequestBody Student student) {
        if(!studentRepository.existsByUsername(student.getUsername())) {
             if (studentRepository.countBySection(student.getSection()) >= 100) {
                 throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Section limit of 100 students reached");
             }
             return studentRepository.save(student);
        }
        return studentRepository.findAll().stream().filter(s -> s.getUsername().equals(student.getUsername())).findFirst().orElse(student);
    }
    
    @Transactional
    @PostMapping("/bulk")
    public List<Student> addStudentsBulk(@RequestBody List<Student> students) {
        List<Student> result = new java.util.ArrayList<>();
        for (Student s : students) {
            // Upsert: update existing student's info if username already in DB
            studentRepository.findByUsername(s.getUsername()).ifPresentOrElse(
                existing -> {
                    existing.setName(s.getName());
                    existing.setUnivRoll(s.getUnivRoll());
                    existing.setSection(s.getSection());
                    result.add(studentRepository.save(existing));
                },
                () -> {
                    if (studentRepository.countBySection(s.getSection()) < 100) {
                        result.add(studentRepository.save(s));
                    }
                }
            );
        }
        return result;
    }
    
    @Transactional
    @DeleteMapping("/{username}")
    public void deleteStudent(@PathVariable String username) {
        studentRepository.deleteByUsername(username);
    }

    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable Long id, @RequestBody Student updatedData) {
        return studentRepository.findById(id).map(student -> {
            student.setName(updatedData.getName());
            student.setUsername(updatedData.getUsername());
            student.setUnivRoll(updatedData.getUnivRoll());
            student.setSection(updatedData.getSection());
            
            if (updatedData.getEasyLastWeek() != null) student.setEasyLastWeek(updatedData.getEasyLastWeek());
            if (updatedData.getMediumLastWeek() != null) student.setMediumLastWeek(updatedData.getMediumLastWeek());
            if (updatedData.getHardLastWeek() != null) student.setHardLastWeek(updatedData.getHardLastWeek());
            if (updatedData.getTotalLastWeek() != null) student.setTotalLastWeek(updatedData.getTotalLastWeek());
            if (updatedData.getStreakLastWeek() != null) student.setStreakLastWeek(updatedData.getStreakLastWeek());
            if (updatedData.getActiveDaysLastWeek() != null) student.setActiveDaysLastWeek(updatedData.getActiveDaysLastWeek());
            
            return studentRepository.save(student);
        }).orElseThrow(() -> new RuntimeException("Student not found"));
    }

    @Transactional
    @PutMapping("/snapshot")
    public void updateSnapshots(@RequestBody List<Student> students) {
        for (Student s : students) {
            studentRepository.findByUsername(s.getUsername()).ifPresent(existing -> {
                existing.setEasyLastWeek(s.getEasyLastWeek());
                existing.setMediumLastWeek(s.getMediumLastWeek());
                existing.setHardLastWeek(s.getHardLastWeek());
                existing.setTotalLastWeek(s.getTotalLastWeek());
                existing.setStreakLastWeek(s.getStreakLastWeek());
                existing.setActiveDaysLastWeek(s.getActiveDaysLastWeek());
                studentRepository.save(existing);
            });
        }
    }
    
    @Transactional
    @DeleteMapping("/section/{sectionName}")
    public void deleteSection(@PathVariable String sectionName) {
        studentRepository.deleteBySection(sectionName);
        sectionInfoRepository.deleteBySectionName(sectionName);
    }
    
    @GetMapping("/{username}/stats")
    public String getStats(@PathVariable String username) {
        return leetCodeService.fetchStudentStats(username);
    }
    
    @PostMapping("/bulk-stats")
    public java.util.Map<String, String> getBulkStats(@RequestBody List<String> usernames) {
        return usernames.parallelStream()
            .collect(java.util.stream.Collectors.toConcurrentMap(
                username -> username,
                username -> leetCodeService.fetchStudentStats(username)
            ));
    }
}
