package com.questionmanager.repository;

import com.questionmanager.model.Question;
import com.questionmanager.model.Category;
import com.questionmanager.model.UserProgress;
import java.util.List;
import java.util.Optional;

public interface QuestionRepository {
    // CRUD operations
    Question save(Question question);
    Optional<Question> findById(String id);
    List<Question> findAll();
    List<Question> findByCategory(Category category);
    List<Question> findByCategoryAndDifficulty(Category category, Question.Difficulty difficulty);
    void deleteById(String id);
    boolean existsById(String id);
    
    // Search operations
    List<Question> searchByTitle(String keyword);
    List<Question> searchByContent(String keyword);
    List<Question> searchByTags(List<String> tags);
    
    // Category operations
    List<Question> findByCategoryName(String categoryName);
    
    // Active/inactive operations
    List<Question> findActiveQuestions();
    List<Question> findInactiveQuestions();
    
    // Statistics
    long countByCategory(Category category);
    long countByDifficulty(Question.Difficulty difficulty);
}