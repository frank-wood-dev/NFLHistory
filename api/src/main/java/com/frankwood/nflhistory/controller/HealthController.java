package com.frankwood.nflhistory.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public String health() {
        return "NFL History API is running! Someday soon, it will be POPULAR!";
    }
}