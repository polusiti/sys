package com.questionmanager.controller;

import com.questionmanager.model.ReadingComprehensionQuestion;
import com.questionmanager.model.SubQuestion;
import com.questionmanager.model.Question;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.Text;
import javafx.scene.web.WebView;
import java.util.List;

public class ReadingComprehensionUI {
    
    private ReadingComprehensionQuestion currentQuestion;
    private int currentSubQuestionIndex = 0;
    private VBox mainContainer;
    private WebView passageView;
    private VBox subQuestionsContainer;
    private Label progressLabel;
    private Button previousButton;
    private Button nextButton;
    private Button checkAnswerButton;
    private TextField answerField;
    private TextArea feedbackArea;
    
    public VBox createReadingComprehensionView() {
        mainContainer = new VBox(10);
        mainContainer.setPadding(new Insets(20));
        mainContainer.setStyle("-fx-background-color: #f8f9fa;");
        
        // タイトルセクション
        VBox titleSection = createTitleSection();
        
        // 本文表示セクション
        VBox passageSection = createPassageSection();
        
        // 進捗表示
        progressLabel = new Label();
        progressLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #666;");
        
        // サブ問題セクション
        subQuestionsContainer = new VBox(15);
        subQuestionsContainer.setPadding(new Insets(20, 0, 20, 0));
        
        // 回答セクション
        VBox answerSection = createAnswerSection();
        
        // ナビゲーションボタン
        HBox navigationBox = createNavigationButtons();
        
        mainContainer.getChildren().addAll(
            titleSection, 
            passageSection, 
            new Separator(), 
            progressLabel,
            subQuestionsContainer,
            answerSection,
            navigationBox
        );
        
        return mainContainer;
    }
    
    private VBox createTitleSection() {
        VBox titleBox = new VBox(10);
        titleBox.setPadding(new Insets(0, 0, 20, 0));
        
        Label titleLabel = new Label("読解問題");
        titleLabel.setFont(Font.font("Arial", FontWeight.BOLD, 24));
        titleLabel.setStyle("-fx-text-fill: #2c3e50;");
        
        Label questionTitleLabel = new Label();
        questionTitleLabel.setFont(Font.font("Arial", FontWeight.BOLD, 18));
        questionTitleLabel.setStyle("-fx-text-fill: #34495e;");
        questionTitleLabel.setWrapText(true);
        
        Label infoLabel = new Label();
        infoLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #7f8c8d;");
        
        titleBox.getChildren().addAll(titleLabel, questionTitleLabel, infoLabel);
        
        // タイトルを更新するメソッドを設定
        titleBox.getProperties().put("titleUpdater", (java.util.function.Consumer<ReadingComprehensionQuestion>) question -> {
            questionTitleLabel.setText(question.getPassageTitle() != null ? question.getPassageTitle() : question.getTitle());
            infoLabel.setText(String.format("種類: %s | 設問数: %d | 総配点: %d点", 
                question.getReadingType(), 
                question.getSubQuestionCount(), 
                question.getTotalPoints()));
        });
        
        return titleBox;
    }
    
    private VBox createPassageSection() {
        VBox passageBox = new VBox(10);
        passageBox.setStyle("-fx-background-color: white; -fx-border-color: #ddd; -fx-border-radius: 5;");
        passageBox.setPadding(new Insets(15));
        
        Label passageLabel = new Label("本文");
        passageLabel.setFont(Font.font("Arial", FontWeight.BOLD, 16));
        passageLabel.setStyle("-fx-text-fill: #2c3e50;");
        
        passageView = new WebView();
        passageView.setPrefHeight(300);
        passageView.getEngine().setUserStyleSheetLocation(
            "data:text/css,body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; }"
        );
        
        passageBox.getChildren().addAll(passageLabel, passageView);
        return passageBox;
    }
    
    private VBox createAnswerSection() {
        VBox answerBox = new VBox(10);
        answerBox.setPadding(new Insets(20, 0, 20, 0));
        
        Label answerLabel = new Label("回答");
        answerLabel.setFont(Font.font("Arial", FontWeight.BOLD, 16));
        answerLabel.setStyle("-fx-text-fill: #2c3e50;");
        
        answerField = new TextField();
        answerField.setPromptText("ここに回答を入力してください");
        answerField.setStyle("-fx-font-size: 14px; -fx-padding: 10px;");
        
        checkAnswerButton = new Button("回答を確認");
        checkAnswerButton.setStyle("-fx-background-color: #3498db; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 10 20;");
        
        feedbackArea = new TextArea();
        feedbackArea.setEditable(false);
        feedbackArea.setWrapText(true);
        feedbackArea.setPrefRowCount(3);
        feedbackArea.setStyle("-fx-background-color: #f8f9fa; -fx-border-color: #ddd;");
        
        answerBox.getChildren().addAll(answerLabel, answerField, checkAnswerButton, feedbackArea);
        
        return answerBox;
    }
    
    private HBox createNavigationButtons() {
        HBox navigationBox = new HBox(10);
        navigationBox.setAlignment(Pos.CENTER);
        navigationBox.setPadding(new Insets(20, 0, 0, 0));
        
        previousButton = new Button("← 前の問題");
        previousButton.setStyle("-fx-background-color: #95a5a6; -fx-text-fill: white; -fx-padding: 10 20;");
        
        nextButton = new Button("次の問題 →");
        nextButton.setStyle("-fx-background-color: #27ae60; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 10 20;");
        
        navigationBox.getChildren().addAll(previousButton, nextButton);
        
        return navigationBox;
    }
    
    public void setQuestion(ReadingComprehensionQuestion question) {
        this.currentQuestion = question;
        this.currentSubQuestionIndex = 0;
        
        // タイトルを更新
        java.util.function.Consumer<ReadingComprehensionQuestion> titleUpdater = 
            (java.util.function.Consumer<ReadingComprehensionQuestion>) mainContainer.getChildren().get(0).getProperties().get("titleUpdater");
        titleUpdater.accept(question);
        
        // 本文を表示
        String passageContent = question.getPassage();
        if (question.getPassageTitle() != null) {
            passageContent = "<h3 style='color: #2c3e50; margin-bottom: 15px;'>" + question.getPassageTitle() + "</h3>" + passageContent;
        }
        if (question.getSource() != null) {
            passageContent += "<p style='font-style: italic; color: #7f8c8d; margin-top: 15px;'>出典: " + question.getSource() + "</p>";
        }
        passageView.getEngine().loadContent("<div style='padding: 10px;'>" + passageContent + "</div>");
        
        // サブ問題を表示
        displaySubQuestions();
        
        // ナビゲーションボタンの状態を更新
        updateNavigationButtons();
    }
    
    private void displaySubQuestions() {
        subQuestionsContainer.getChildren().clear();
        
        List<SubQuestion> subQuestions = currentQuestion.getSubQuestions();
        for (int i = 0; i < subQuestions.size(); i++) {
            SubQuestion subQuestion = subQuestions.get(i);
            
            VBox subQuestionBox = new VBox(10);
            subQuestionBox.setPadding(new Insets(15));
            subQuestionBox.setStyle("-fx-background-color: " + (i == currentSubQuestionIndex ? "#e8f4fd" : "white") + 
                                   "; -fx-border-color: #ddd; -fx-border-radius: 5;");
            
            // 問題番号と内容
            HBox questionHeader = new HBox(10);
            Label numberLabel = new Label(subQuestion.getFormattedQuestionNumber());
            numberLabel.setFont(Font.font("Arial", FontWeight.BOLD, 16));
            numberLabel.setStyle("-fx-text-fill: #2980b9;");
            
            Text contentText = new Text(subQuestion.getContent());
            contentText.setFont(Font.font(14));
            contentText.setWrappingWidth(600);
            
            questionHeader.getChildren().addAll(numberLabel, contentText);
            
            // 難易度と配点
            HBox infoBox = new HBox(20);
            Label difficultyLabel = new Label("難易度: " + subQuestion.getDifficulty());
            difficultyLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #7f8c8d;");
            
            Label pointsLabel = new Label("配点: " + subQuestion.getPoints() + "点");
            pointsLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #7f8c8d;");
            
            infoBox.getChildren().addAll(difficultyLabel, pointsLabel);
            
            subQuestionBox.getChildren().addAll(questionHeader, infoBox);
            
            // クリックで問題を選択
            subQuestionBox.setOnMouseClicked(e -> {
                currentSubQuestionIndex = i;
                displaySubQuestions();
                updateNavigationButtons();
                updateProgressLabel();
            });
            
            subQuestionsContainer.getChildren().add(subQuestionBox);
        }
        
        updateProgressLabel();
    }
    
    private void updateProgressLabel() {
        if (currentQuestion != null) {
            progressLabel.setText(String.format("設問 %d / %d", currentSubQuestionIndex + 1, currentQuestion.getSubQuestionCount()));
        }
    }
    
    private void updateNavigationButtons() {
        previousButton.setDisable(currentSubQuestionIndex <= 0);
        nextButton.setDisable(currentSubQuestionIndex >= currentQuestion.getSubQuestionCount() - 1);
    }
    
    // イベントハンドラ設定用のメソッド
    public void setOnCheckAnswer(javafx.event.EventHandler<javafx.event.ActionEvent> handler) {
        checkAnswerButton.setOnAction(handler);
    }
    
    public void setOnPreviousQuestion(javafx.event.EventHandler<javafx.event.ActionEvent> handler) {
        previousButton.setOnAction(handler);
    }
    
    public void setOnNextQuestion(javafx.event.EventHandler<javafx.event.ActionEvent> handler) {
        nextButton.setOnAction(handler);
    }
    
    // 現在の回答を取得
    public String getCurrentAnswer() {
        return answerField.getText();
    }
    
    // フィードバックを設定
    public void setFeedback(String feedback, boolean isCorrect) {
        feedbackArea.setText(feedback);
        feedbackArea.setStyle("-fx-background-color: " + (isCorrect ? "#d4edda" : "#f8d7da") + 
                             "; -fx-border-color: " + (isCorrect ? "#c3e6cb" : "#f5c6cb") + ";");
    }
    
    // 次の問題に移動
    public void moveToNextQuestion() {
        if (currentSubQuestionIndex < currentQuestion.getSubQuestionCount() - 1) {
            currentSubQuestionIndex++;
            displaySubQuestions();
            updateNavigationButtons();
            answerField.clear();
            feedbackArea.clear();
            feedbackArea.setStyle("-fx-background-color: #f8f9fa; -fx-border-color: #ddd;");
        }
    }
    
    // 前の問題に移動
    public void moveToPreviousQuestion() {
        if (currentSubQuestionIndex > 0) {
            currentSubQuestionIndex--;
            displaySubQuestions();
            updateNavigationButtons();
            answerField.clear();
            feedbackArea.clear();
            feedbackArea.setStyle("-fx-background-color: #f8f9fa; -fx-border-color: #ddd;");
        }
    }
    
    // 現在のサブ問題を取得
    public SubQuestion getCurrentSubQuestion() {
        return currentQuestion.getSubQuestions().get(currentSubQuestionIndex);
    }
}