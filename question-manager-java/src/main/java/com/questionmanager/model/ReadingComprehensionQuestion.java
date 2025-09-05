package com.questionmanager.model;

import java.util.List;
import java.util.ArrayList;
import java.util.UUID;

public class ReadingComprehensionQuestion extends Question {
    private String passage; // 本文
    private String passageTitle; // 本文タイトル
    private String source; // 出典
    private List<SubQuestion> subQuestions; // サブ問題リスト
    private int totalPoints; // 総配点
    private ReadingType readingType; // 読解問題の種類

    public enum ReadingType {
        SHORT_PASSAGE,      // 短文読解
        LONG_PASSAGE,       // 長文読解
        DIALOGUE,           // 会話文
        DOCUMENT,           // ドキュメント
        ESSAY,              // エッセイ
        NEWS_ARTICLE        // ニュース記事
    }

    public ReadingComprehensionQuestion() {
        super();
        this.subQuestions = new ArrayList<>();
        this.totalPoints = 0;
        this.readingType = ReadingType.SHORT_PASSAGE;
    }

    public ReadingComprehensionQuestion(String title, String passage, Category category) {
        this();
        super.setTitle(title);
        this.passage = passage;
        super.setCategory(category);
    }

    // サブ問題の追加
    public void addSubQuestion(SubQuestion subQuestion) {
        subQuestion.setQuestionNumber(subQuestions.size() + 1);
        subQuestions.add(subQuestion);
        updateTotalPoints();
    }

    // サブ問題の削除
    public void removeSubQuestion(String subQuestionId) {
        subQuestions.removeIf(sq -> sq.getId().equals(subQuestionId));
        renumberSubQuestions();
        updateTotalPoints();
    }

    // サブ問題の番号を振り直す
    private void renumberSubQuestions() {
        for (int i = 0; i < subQuestions.size(); i++) {
            subQuestions.get(i).setQuestionNumber(i + 1);
        }
    }

    // 総配点の更新
    private void updateTotalPoints() {
        this.totalPoints = subQuestions.stream()
                .mapToInt(SubQuestion::getPoints)
                .sum();
    }

    // 特定のサブ問題を取得
    public SubQuestion getSubQuestion(int questionNumber) {
        return subQuestions.stream()
                .filter(sq -> sq.getQuestionNumber() == questionNumber)
                .findFirst()
                .orElse(null);
    }

    // 必須問題のみを取得
    public List<SubQuestion> getRequiredSubQuestions() {
        return subQuestions.stream()
                .filter(SubQuestion::isRequired)
                .toList();
    }

    // 特定の難易度のサブ問題を取得
    public List<SubQuestion> getSubQuestionsByDifficulty(Question.Difficulty difficulty) {
        return subQuestions.stream()
                .filter(sq -> sq.getDifficulty() == difficulty)
                .toList();
    }

    // Getters and Setters
    public String getPassage() { return passage; }
    public void setPassage(String passage) { this.passage = passage; }
    
    public String getPassageTitle() { return passageTitle; }
    public void setPassageTitle(String passageTitle) { this.passageTitle = passageTitle; }
    
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    
    public List<SubQuestion> getSubQuestions() { return new ArrayList<>(subQuestions); }
    public void setSubQuestions(List<SubQuestion> subQuestions) { 
        this.subQuestions = new ArrayList<>(subQuestions); 
        renumberSubQuestions();
        updateTotalPoints();
    }
    
    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
    
    public ReadingType getReadingType() { return readingType; }
    public void setReadingType(ReadingType readingType) { this.readingType = readingType; }

    public int getSubQuestionCount() {
        return subQuestions.size();
    }

    @Override
    public String toString() {
        return "ReadingComprehensionQuestion{" +
                "id='" + getId() + '\'' +
                ", title='" + getTitle() + '\'' +
                ", passageLength=" + (passage != null ? passage.length() : 0) + 
                ", subQuestionCount=" + subQuestions.size() +
                ", totalPoints=" + totalPoints +
                ", readingType=" + readingType +
                '}';
    }
}