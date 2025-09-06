const express = require('express');
const path = require('path');
const WorkersAPIClient = require('./workers-api-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const workersClient = new WorkersAPIClient();

app.use(express.json());
app.use(express.static('public'));

class QuestionSystem {
  constructor() {
    this.currentSession = {};
    this.userProgress = {};
  }

  async getRandomQuestion(subject, difficulty = null) {
    try {
      return await workersClient.getRandomQuestion(subject, difficulty);
    } catch (error) {
      console.error('Error getting random question:', error);
      throw error;
    }
  }

  async getQuestionById(subject, questionId) {
    try {
      const questionData = await workersClient.getQuestionData(subject, questionId);
      return {
        id: questionId,
        subject,
        data: questionData
      };
    } catch (error) {
      console.error('Error getting question by ID:', error);
      throw error;
    }
  }

  validateAnswer(question, userAnswer) {
    if (!question.data) {
      return { correct: false, message: 'Question data not found' };
    }
    
    // 語彙問題の場合: 選択肢インデックスで判定
    if (question.data.type === 'vocabulary' && question.data.correctAnswer !== undefined) {
      const correctIndex = question.data.correctAnswer;
      const userIndex = parseInt(userAnswer);
      const isCorrect = userIndex === correctIndex;
      
      return {
        correct: isCorrect,
        correctAnswer: question.data.choices ? question.data.choices[correctIndex] : correctIndex,
        userAnswer: question.data.choices ? question.data.choices[userIndex] : userAnswer,
        explanation: question.data.explanation || null,
        word: question.data.word || null
      };
    }
    
    // 従来の文字列マッチング（後方互換性）
    if (question.data.answer) {
      const correctAnswer = question.data.answer;
      const isCorrect = this.normalizeAnswer(userAnswer) === this.normalizeAnswer(correctAnswer);
      
      return {
        correct: isCorrect,
        correctAnswer: correctAnswer,
        userAnswer: userAnswer,
        explanation: question.data.explanation || null
      };
    }
    
    return { correct: false, message: 'No answer validation method available' };
  }

  normalizeAnswer(answer) {
    return String(answer).trim().toLowerCase()
      .replace(/[。、.，]/g, '')
      .replace(/\s+/g, '');
  }

  startSession(userId, subject) {
    const sessionId = `${userId}_${Date.now()}`;
    this.currentSession[sessionId] = {
      userId,
      subject,
      startTime: new Date(),
      questions: [],
      currentQuestionIndex: 0,
      score: 0
    };
    return sessionId;
  }

  async addQuestionToSession(sessionId, question) {
    if (!this.currentSession[sessionId]) {
      throw new Error('Session not found');
    }
    
    // 音声ファイルのURLを取得
    if (question.data.audioFile) {
      try {
        question.data.audioUrl = await workersClient.getAudioUrl(question.subject, question.data.audioFile);
      } catch (error) {
        console.warn('Error getting audio URL:', error);
        question.data.audioUrl = null;
      }
    }
    
    this.currentSession[sessionId].questions.push({
      ...question,
      userAnswer: null,
      isCorrect: false,
      answeredAt: null
    });
  }

  submitAnswer(sessionId, questionIndex, userAnswer) {
    if (!this.currentSession[sessionId]) {
      throw new Error('Session not found');
    }
    
    const session = this.currentSession[sessionId];
    const question = session.questions[questionIndex];
    
    if (!question) {
      throw new Error('Question not found');
    }
    
    const result = this.validateAnswer(question, userAnswer);
    
    session.questions[questionIndex].userAnswer = userAnswer;
    session.questions[questionIndex].isCorrect = result.correct;
    session.questions[questionIndex].answeredAt = new Date();
    
    if (result.correct) {
      session.score++;
    }
    
    return result;
  }

  getSessionStats(sessionId) {
    if (!this.currentSession[sessionId]) {
      throw new Error('Session not found');
    }
    
    const session = this.currentSession[sessionId];
    const answeredQuestions = session.questions.filter(q => q.userAnswer !== null);
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect);
    
    return {
      totalQuestions: session.questions.length,
      answeredQuestions: answeredQuestions.length,
      correctAnswers: correctAnswers.length,
      score: session.score,
      accuracy: answeredQuestions.length > 0 ? 
        (correctAnswers.length / answeredQuestions.length * 100).toFixed(1) : 0,
      timeSpent: new Date() - session.startTime
    };
  }
}

const questionSystem = new QuestionSystem();

app.get('/api/subjects', async (req, res) => {
  try {
    const subjectData = await workersClient.getSubjects();
    res.json(subjectData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session/start', async (req, res) => {
  try {
    const { userId, subject, questionCount = 10, difficulty } = req.body;
    
    const sessionId = questionSystem.startSession(userId, subject);
    
    for (let i = 0; i < questionCount; i++) {
      try {
        const question = await questionSystem.getRandomQuestion(subject, difficulty);
        await questionSystem.addQuestionToSession(sessionId, question);
      } catch (error) {
        console.error(`Error adding question ${i + 1}:`, error);
      }
    }
    
    res.json({ 
      sessionId, 
      questionCount: questionSystem.currentSession[sessionId].questions.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/session/:sessionId/question/:questionIndex', (req, res) => {
  try {
    const { sessionId, questionIndex } = req.params;
    const session = questionSystem.currentSession[sessionId];
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const question = session.questions[questionIndex];
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({
      questionIndex: parseInt(questionIndex),
      totalQuestions: session.questions.length,
      question: {
        id: question.id,
        subject: question.subject,
        data: question.data
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session/:sessionId/answer/:questionIndex', (req, res) => {
  try {
    const { sessionId, questionIndex } = req.params;
    const { answer } = req.body;
    
    const result = questionSystem.submitAnswer(sessionId, parseInt(questionIndex), answer);
    const stats = questionSystem.getSessionStats(sessionId);
    
    res.json({
      result,
      stats,
      nextQuestionIndex: parseInt(questionIndex) + 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/session/:sessionId/stats', (req, res) => {
  try {
    const { sessionId } = req.params;
    const stats = questionSystem.getSessionStats(sessionId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/question/random/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const { difficulty } = req.query;
    
    const question = await questionSystem.getRandomQuestion(subject, difficulty);
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    api: 'Workers API',
    endpoint: 'https://questa-r2-api.t88596565.workers.dev/api'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Question Answering System with Workers API running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}`);
});