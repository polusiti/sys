package com.questionmanager.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserProgress {
    private String id;
    private String userId;
    private String questionId;
    private boolean isCorrect;
    private int timeSpent; // in seconds
    private LocalDateTime answeredAt;
    private int attemptNumber;
    private String hintUsed;

    public UserProgress() {
        this.id = UUID.randomUUID().toString();
        this.answeredAt = LocalDateTime.now();
        this.attemptNumber = 1;
    }

    public UserProgress(String userId, String questionId, boolean isCorrect) {
        this();
        this.userId = userId;
        this.questionId = questionId;
        this.isCorrect = isCorrect;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    
    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }
    
    public int getTimeSpent() { return timeSpent; }
    public void setTimeSpent(int timeSpent) { this.timeSpent = timeSpent; }
    
    public LocalDateTime getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(LocalDateTime answeredAt) { this.answeredAt = answeredAt; }
    
    public int getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(int attemptNumber) { this.attemptNumber = attemptNumber; }
    
    public String getHintUsed() { return hintUsed; }
    public void setHintUsed(String hintUsed) { this.hintUsed = hintUsed; }

    public void incrementAttemptNumber() {
        this.attemptNumber++;
    }

    @Override
    public String toString() {
        return "UserProgress{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", questionId='" + questionId + '\'' +
                ", isCorrect=" + isCorrect +
                ", timeSpent=" + timeSpent +
                ", attemptNumber=" + attemptNumber +
                '}';
    }
}