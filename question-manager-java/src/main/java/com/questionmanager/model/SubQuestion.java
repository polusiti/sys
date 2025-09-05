package com.questionmanager.model;

import java.util.UUID;

public class SubQuestion {
    private String id;
    private int questionNumber; // (1), (2), (3)...
    private String content;
    private String answer;
    private String explanation;
    private Question.Difficulty difficulty;
    private int points; // 配点
    private boolean isRequired; // 必須問題か

    public SubQuestion() {
        this.id = UUID.randomUUID().toString();
        this.points = 1;
        this.isRequired = true;
    }

    public SubQuestion(int questionNumber, String content, String answer) {
        this();
        this.questionNumber = questionNumber;
        this.content = content;
        this.answer = answer;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public int getQuestionNumber() { return questionNumber; }
    public void setQuestionNumber(int questionNumber) { this.questionNumber = questionNumber; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    
    public Question.Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Question.Difficulty difficulty) { this.difficulty = difficulty; }
    
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
    
    public boolean isRequired() { return isRequired; }
    public void setRequired(boolean required) { isRequired = required; }

    public String getFormattedQuestionNumber() {
        return "(" + questionNumber + ")";
    }

    @Override
    public String toString() {
        return "SubQuestion{" +
                "questionNumber=" + questionNumber +
                ", content='" + content + '\'' +
                ", difficulty=" + difficulty +
                ", points=" + points +
                '}';
    }
}