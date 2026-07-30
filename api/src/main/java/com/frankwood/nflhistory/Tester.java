package com.frankwood.nflhistory;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class Tester implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public Tester(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        
        System.out.println("Database connection successful: " + one);
    }
}