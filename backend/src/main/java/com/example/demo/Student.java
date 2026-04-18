package com.example.demo;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String name;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = true)
    private String univRoll;

    @Column(nullable = true)
    private String section;


    @Column(nullable = true)
    private String email;

    @Column(nullable = true)
    private Integer easyLastWeek = 0;
    @Column(nullable = true)
    private Integer mediumLastWeek = 0;
    @Column(nullable = true)
    private Integer hardLastWeek = 0;
    @Column(nullable = true)
    private Integer totalLastWeek = 0;
    @Column(nullable = true)
    private Integer streakLastWeek = 0;
    @Column(nullable = true)
    private Integer activeDaysLastWeek = 0;
}
