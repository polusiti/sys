package com.questionmanager.model;

import java.util.HashMap;
import java.util.Map;

public class Statistics {
    private int totalQuestions;
    private int correctAnswers;
    private int incorrectAnswers;
    private double averageTimeSpent;
    private Map<String, Integer> categoryStats;
    private Map<String, Integer> difficultyStats;
    private int streakCount;
    private int bestStreak;
    private double accuracyRate;

    public Statistics() {
        this.totalQuestions = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.averageTimeSpent = 0.0;
        this.categoryStats = new HashMap<>();
        this.difficultyStats = new HashMap<>();
        this.streakCount = 0;
        this.bestStreak = 0;
        this.accuracyRate = 0.0;
    }

    public void recordAnswer(boolean isCorrect, int timeSpent, String category, String difficulty) {
        totalQuestions++;
        if (isCorrect) {
            correctAnswers++;
            streakCount++;
            if (streakCount > bestStreak) {
                bestStreak = streakCount;
            }
        } else {
            incorrectAnswers++;
            streakCount = 0;
        }

        // Update average time
        averageTimeSpent = ((averageTimeSpent * (totalQuestions - 1)) + timeSpent) / totalQuestions;

        // Update category stats
        categoryStats.merge(category, 1, Integer::sum);

        // Update difficulty stats
        difficultyStats.merge(difficulty, 1, Integer::sum);

        // Update accuracy rate
        accuracyRate = (double) correctAnswers / totalQuestions * 100;
    }

    // Getters and Setters
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    
    public int getIncorrectAnswers() { return incorrectAnswers; }
    public void setIncorrectAnswers(int incorrectAnswers) { this.incorrectAnswers = incorrectAnswers; }
    
    public double getAverageTimeSpent() { return averageTimeSpent; }
    public void setAverageTimeSpent(double averageTimeSpent) { this.averageTimeSpent = averageTimeSpent; }
    
    public Map<String, Integer> getCategoryStats() { return categoryStats; }
    public void setCategoryStats(Map<String, Integer> categoryStats) { this.categoryStats = categoryStats; }
    
    public Map<String, Integer> getDifficultyStats() { return difficultyStats; }
    public void setDifficultyStats(Map<String, Integer> difficultyStats) { this.difficultyStats = difficultyStats; }
    
    public int getStreakCount() { return streakCount; }
    public void setStreakCount(int streakCount) { this.streakCount = streakCount; }
    
    public int getBestStreak() { return bestStreak; }
    public void setBestStreak(int bestStreak) { this.bestStreak = bestStreak; }
    
    public double getAccuracyRate() { return accuracyRate; }
    public void setAccuracyRate(double accuracyRate) { this.accuracyRate = accuracyRate; }

    @Override
    public String toString() {
        return "Statistics{" +
                "totalQuestions=" + totalQuestions +
                ", correctAnswers=" + correctAnswers +
                ", incorrectAnswers=" + incorrectAnswers +
                ", accuracyRate=" + String.format("%.2f", accuracyRate) + "%" +
                ", averageTimeSpent=" + String.format("%.2f", averageTimeSpent) + "s" +
                ", currentStreak=" + streakCount +
                ", bestStreak=" + bestStreak +
                '}';
    }
}