package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sections")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class SectionInfoController {

    @Autowired
    private SectionInfoRepository sectionInfoRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public List<SectionInfo> getAllSectionInfo() {
        return sectionInfoRepository.findAll();
    }

    @PostMapping
    public SectionInfo saveSectionInfo(@RequestBody SectionInfo sectionInfo) {
        Optional<SectionInfo> existing = sectionInfoRepository.findBySectionName(sectionInfo.getSectionName());
        if (existing.isPresent()) {
            SectionInfo info = existing.get();
            info.setTrainerName(sectionInfo.getTrainerName());
            return sectionInfoRepository.save(info);
        }
        return sectionInfoRepository.save(sectionInfo);
    }

    @Transactional
    @PutMapping("/rename")
    public SectionInfo renameSection(@RequestParam String oldName, @RequestParam String newName, @RequestParam(required = false) String trainerName) {
        // 1. Update Students bulk
        studentRepository.updateSectionName(oldName, newName);

        // 2. Manage SectionInfo
        Optional<SectionInfo> oldInfo = sectionInfoRepository.findBySectionName(oldName);
        Optional<SectionInfo> newInfo = sectionInfoRepository.findBySectionName(newName);

        SectionInfo targetInfo;
        if (newInfo.isPresent()) {
            // If new name already exists, update THAT record
            targetInfo = newInfo.get();
            // If we are renaming FROM something else, remove the old record
            if (!oldName.equals(newName)) {
                oldInfo.ifPresent(info -> sectionInfoRepository.delete(info));
            }
        } else if (oldInfo.isPresent()) {
            // Rename the old record
            targetInfo = oldInfo.get();
            targetInfo.setSectionName(newName);
        } else {
            // Create brand new
            targetInfo = new SectionInfo(null, newName, "");
        }

        if (trainerName != null) {
            targetInfo.setTrainerName(trainerName);
        }
        return sectionInfoRepository.save(targetInfo);
    }

    @Transactional
    @DeleteMapping("/{sectionName}")
    public void deleteSection(@PathVariable String sectionName) {
        studentRepository.deleteBySection(sectionName);
        sectionInfoRepository.findBySectionName(sectionName).ifPresent(info -> sectionInfoRepository.delete(info));
    }
}
