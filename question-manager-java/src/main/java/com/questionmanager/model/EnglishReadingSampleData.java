package com.questionmanager.model;

import java.util.Arrays;
import java.util.List;

public class EnglishReadingSampleData {
    
    public static List<ReadingComprehensionQuestion> createSampleQuestions() {
        return Arrays.asList(
            createShortPassageQuestion(),
            createDialogueQuestion(),
            createNewsArticleQuestion()
        );
    }
    
    private static ReadingComprehensionQuestion createShortPassageQuestion() {
        Category readingCategory = new Category("Reading", "Reading Comprehension", "#3b82f6");
        
        ReadingComprehensionQuestion question = new ReadingComprehensionQuestion(
            "Environmental Protection",
            "Environmental protection has become one of the most pressing issues of our time. " +
            "Climate change, pollution, and loss of biodiversity are threatening ecosystems worldwide. " +
            "Individuals can contribute to environmental protection by reducing waste, conserving energy, " +
            "and supporting sustainable practices. Governments and businesses also play crucial roles " +
            "in implementing policies and technologies that minimize environmental damage.",
            readingCategory
        );
        
        question.setPassageTitle("The Importance of Environmental Protection");
        question.setReadingType(ReadingComprehensionQuestion.ReadingType.SHORT_PASSAGE);
        question.setSource("Sample Textbook");
        
        // サブ問題の追加
        SubQuestion q1 = new SubQuestion(1, "What are the three main environmental threats mentioned in the passage?", 
            "Climate change, pollution, and loss of biodiversity");
        q1.setExplanation("The passage explicitly states these three threats.");
        q1.setDifficulty(Question.Difficulty.EASY);
        q1.setPoints(2);
        
        SubQuestion q2 = new SubQuestion(2, "How can individuals contribute to environmental protection according to the text?", 
            "By reducing waste, conserving energy, and supporting sustainable practices");
        q2.setExplanation("The passage lists these three specific actions individuals can take.");
        q2.setDifficulty(Question.Difficulty.MEDIUM);
        q2.setPoints(3);
        
        SubQuestion q3 = new SubQuestion(3, "What roles do governments and businesses play in environmental protection?", 
            "They implement policies and technologies that minimize environmental damage");
        q3.setExplanation("The passage mentions their roles in the final sentence.");
        q3.setDifficulty(Question.Difficulty.MEDIUM);
        q3.setPoints(2);
        
        question.addSubQuestion(q1);
        question.addSubQuestion(q2);
        question.addSubQuestion(q3);
        
        return question;
    }
    
    private static ReadingComprehensionQuestion createDialogueQuestion() {
        Category readingCategory = new Category("Reading", "Reading Comprehension", "#3b82f6");
        
        ReadingComprehensionQuestion question = new ReadingComprehensionQuestion(
            "Job Interview Dialogue",
            "Sarah: Good morning! Thank you for coming in today. I'm Sarah, the HR manager.\n" +
            "Mike: Good morning, Sarah. Thank you for having me. I'm Mike Johnson.\n" +
            "Sarah: Let's start by telling me a bit about your experience in software development.\n" +
            "Mike: I've been working as a software developer for five years, primarily focusing on web applications.\n" +
            "Sarah: That's impressive. What programming languages are you most comfortable with?\n" +
            "Mike: I'm most proficient in Java and Python, but I also have experience with JavaScript and C++.\n" +
            "Sarah: Great! Why are you interested in joining our company?\n" +
            "Mike: I've been following your company's innovative projects and I'm excited about the opportunity to contribute.",
            readingCategory
        );
        
        question.setPassageTitle("Job Interview Conversation");
        question.setReadingType(ReadingComprehensionQuestion.ReadingType.DIALOGUE);
        question.setSource("Business English Sample");
        
        // サブ問題の追加
        SubQuestion q1 = new SubQuestion(1, "What is Sarah's role in the company?", 
            "HR manager");
        q1.setExplanation("Sarah introduces herself as the HR manager.");
        q1.setDifficulty(Question.Difficulty.EASY);
        q1.setPoints(1);
        
        SubQuestion q2 = new SubQuestion(2, "How long has Mike been working as a software developer?", 
            "Five years");
        q2.setExplanation("Mike states he has been working for five years.");
        q2.setDifficulty(Question.Difficulty.EASY);
        q2.setPoints(1);
        
        SubQuestion q3 = new SubQuestion(3, "Which programming languages does Mike mention as his most proficient?", 
            "Java and Python");
        q3.setExplanation("Mike specifically states he is most proficient in Java and Python.");
        q3.setDifficulty(Question.Difficulty.MEDIUM);
        q3.setPoints(2);
        
        SubQuestion q4 = new SubQuestion(4, "Why is Mike interested in joining the company?", 
            "Because he has been following their innovative projects and wants to contribute");
        q4.setExplanation("Mike mentions the company's innovative projects and his desire to contribute.");
        q4.setDifficulty(Question.Difficulty.MEDIUM);
        q4.setPoints(2);
        
        question.addSubQuestion(q1);
        question.addSubQuestion(q2);
        question.addSubQuestion(q3);
        question.addSubQuestion(q4);
        
        return question;
    }
    
    private static ReadingComprehensionQuestion createNewsArticleQuestion() {
        Category readingCategory = new Category("Reading", "Reading Comprehension", "#3b82f6");
        
        ReadingComprehensionQuestion question = new ReadingComprehensionQuestion(
            "Technology in Education",
            "TOKYO, JAPAN - A recent study conducted by the Japanese Ministry of Education has revealed " +
            "that schools implementing technology-based learning methods have shown significant improvements " +
            "in student performance. The study, which analyzed data from over 500 schools across the country, " +
            "found that students in technology-equipped classrooms scored an average of 15% higher on standardized tests.\n\n" +
            "The research focused on schools that had integrated tablets, interactive whiteboards, and " +
            "educational software into their curriculum. Teachers reported increased student engagement and " +
            "more personalized learning experiences. However, the study also noted challenges such as " +
            "technical issues and the need for additional teacher training.\n\n" +
            "Education experts believe that while technology can enhance learning, it should complement " +
            "traditional teaching methods rather than replace them entirely. The Ministry plans to expand " +
            "the program to more schools in the coming academic year.",
            readingCategory
        );
        
        question.setPassageTitle("Technology Boosts Student Performance in Japanese Schools");
        question.setReadingType(ReadingComprehensionQuestion.ReadingType.NEWS_ARTICLE);
        question.setSource("Tokyo Education News");
        
        // サブ問題の追加
        SubQuestion q1 = new SubQuestion(1, "According to the study, how much higher did students in technology-equipped classrooms score on tests?", 
            "15% higher");
        q1.setExplanation("The passage states students scored 15% higher on standardized tests.");
        q1.setDifficulty(Question.Difficulty.EASY);
        q1.setPoints(2);
        
        SubQuestion q2 = new SubQuestion(2, "How many schools were analyzed in the study?", 
            "Over 500 schools");
        q2.setExplanation("The study analyzed data from over 500 schools across Japan.");
        q2.setDifficulty(Question.Difficulty.EASY);
        q2.setPoints(1);
        
        SubQuestion q3 = new SubQuestion(3, "What specific technologies were mentioned as being integrated into classrooms?", 
            "Tablets, interactive whiteboards, and educational software");
        q3.setExplanation("The passage lists these three specific technologies.");
        q3.setDifficulty(Question.Difficulty.MEDIUM);
        q3.setPoints(3);
        
        SubQuestion q4 = new SubQuestion(4, "What challenges did the study identify with technology-based learning?", 
            "Technical issues and the need for additional teacher training");
        q4.setExplanation("The passage mentions these two specific challenges.");
        q4.setDifficulty(Question.Difficulty.MEDIUM);
        q4.setPoints(2);
        
        SubQuestion q5 = new SubQuestion(5, "What is the Ministry of Education's plan for the future?", 
            "To expand the program to more schools in the coming academic year");
        q5.setExplanation("The final sentence mentions their expansion plans.");
        q5.setDifficulty(Question.Difficulty.MEDIUM);
        q5.setPoints(2);
        
        question.addSubQuestion(q1);
        question.addSubQuestion(q2);
        question.addSubQuestion(q3);
        question.addSubQuestion(q4);
        question.addSubQuestion(q5);
        
        return question;
    }
}