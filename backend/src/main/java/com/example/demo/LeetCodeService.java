package com.example.demo;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Service
public class LeetCodeService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final java.util.concurrent.ConcurrentHashMap<String, CacheEntry> cache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final long CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

    private static class CacheEntry {
        String data;
        long timestamp;
        CacheEntry(String data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }
    }

    public String fetchStudentStats(String username) {
        CacheEntry entry = cache.get(username);
        if (entry != null && (System.currentTimeMillis() - entry.timestamp) < CACHE_DURATION_MS) {
            return entry.data;
        }

        String url = "https://leetcode.com/graphql/";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Referer", "https://leetcode.com/");
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set("Origin", "https://leetcode.com");

        String query = "{\"query\":\"query getUserProfile($username: String!) { matchedUser(username: $username) { submitStats: submitStatsGlobal { acSubmissionNum { difficulty count } } userCalendar { streak totalActiveDays } } }\", \"variables\":{\"username\":\"" + username + "\"}}";

        HttpEntity<String> entity = new HttpEntity<>(query, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            cache.put(username, new CacheEntry(response.getBody()));
            return response.getBody();
        } catch(Exception e) {
            e.printStackTrace();
            return "{\"error\": \"Could not fetch data\"}";
        }
    }
}
