package com.questionmanager.repository;

import com.questionmanager.model.Question;
import com.questionmanager.model.Category;
import com.questionmanager.model.UserProgress;
import com.questionmanager.util.JSONConverter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class JSONQuestionRepository implements QuestionRepository {
    private static final String DATA_DIR = "data";
    private static final String QUESTIONS_FILE = DATA_DIR + "/questions.json";
    private final ObjectMapper objectMapper;
    private List<Question> questions;

    public JSONQuestionRepository() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        
        loadData();
    }

    private void loadData() {
        try {
            File dataDir = new File(DATA_DIR);
            if (!dataDir.exists()) {
                dataDir.mkdirs();
            }
            
            File file = new File(QUESTIONS_FILE);
            if (file.exists()) {
                questions = objectMapper.readValue(file, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Question.class));
            } else {
                questions = new ArrayList<>();
            }
        } catch (IOException e) {
            System.err.println("Error loading questions: " + e.getMessage());
            questions = new ArrayList<>();
        }
    }

    private void saveData() {
        try {
            objectMapper.writeValue(new File(QUESTIONS_FILE), questions);
        } catch (IOException e) {
            System.err.println("Error saving questions: " + e.getMessage());
        }
    }

    @Override
    public Question save(Question question) {
        if (question.getId() == null || !existsById(question.getId())) {
            questions.add(question);
        } else {
            int index = questions.indexOf(findById(question.getId()).orElse(null));
            if (index != -1) {
                questions.set(index, question);
            }
        }
        saveData();
        return question;
    }

    @Override
    public Optional<Question> findById(String id) {
        return questions.stream()
                .filter(q -> q.getId().equals(id))
                .findFirst();
    }

    @Override
    public List<Question> findAll() {
        return new ArrayList<>(questions);
    }

    @Override
    public List<Question> findByCategory(Category category) {
        return questions.stream()
                .filter(q -> q.getCategory() != null && q.getCategory().getId().equals(category.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Question> findByCategoryAndDifficulty(Category category, Question.Difficulty difficulty) {
        return questions.stream()
                .filter(q -> q.getCategory() != null && 
                           q.getCategory().getId().equals(category.getId()) && 
                           q.getDifficulty() == difficulty)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        questions.removeIf(q -> q.getId().equals(id));
        saveData();
    }

    @Override
    public boolean existsById(String id) {
        return questions.stream().anyMatch(q -> q.getId().equals(id));
    }

    @Override
    public List<Question> searchByTitle(String keyword) {
        return questions.stream()
                .filter(q -> q.getTitle() != null && q.getTitle().toLowerCase().contains(keyword.toLowerCase()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Question> searchByContent(String keyword) {
        return questions.stream()
                .filter(q -> q.getContent() != null && q.getContent().toLowerCase().contains(keyword.toLowerCase()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Question> searchByTags(List<String> tags) {
        return questions.stream()
                .filter(q -> q.getTags() != null && 
                           q.getTags().stream().anyMatch(tag -> 
                               tags.stream().anyMatch(searchTag -> 
                                   tag.toLowerCase().contains(searchTag.toLowerCase()))))
                .collect(Collectors.toList());
    }

    @Override
    public List<Question> findByCategoryName(String categoryName) {
        return questions.stream()
                .filter(q -> q.getCategory() != null && 
                           q.getCategory().getName().equalsIgnoreCase(categoryName))
                .collect(Collectors.toList());
    }

    @Override
    public List<Question> findActiveQuestions() {
        return questions.stream()
                .filter(Question::isActive)
                .collect(Collectors.toList());
    }

    @Override
    public List<Question> findInactiveQuestions() {
        return questions.stream()
                .filter(q -> !q.isActive())
                .collect(Collectors.toList());
    }

    @Override
    public long countByCategory(Category category) {
        return questions.stream()
                .filter(q -> q.getCategory() != null && q.getCategory().getId().equals(category.getId()))
                .count();
    }

    @Override
    public long countByDifficulty(Question.Difficulty difficulty) {
        return questions.stream()
                .filter(q -> q.getDifficulty() == difficulty)
                .count();
    }
}