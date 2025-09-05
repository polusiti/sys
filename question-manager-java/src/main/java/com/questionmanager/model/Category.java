package com.questionmanager.model;

import java.util.UUID;

public class Category {
    private String id;
    private String name;
    private String description;
    private String color;
    private String icon;
    private boolean isActive;
    private int questionCount;

    public Category() {
        this.id = UUID.randomUUID().toString();
        this.isActive = true;
        this.questionCount = 0;
    }

    public Category(String name, String description, String color) {
        this();
        this.name = name;
        this.description = description;
        this.color = color;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }

    public void incrementQuestionCount() {
        this.questionCount++;
    }

    public void decrementQuestionCount() {
        if (this.questionCount > 0) {
            this.questionCount--;
        }
    }

    @Override
    public String toString() {
        return "Category{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", color='" + color + '\'' +
                ", questionCount=" + questionCount +
                '}';
    }
}