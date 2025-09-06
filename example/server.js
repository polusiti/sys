const express = require('express');
const path = require('path');
const WorkersAPIClient = require('./workers-api-client');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const workersClient = new WorkersAPIClient();

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

class UserAuthSystem {
  constructor() {
    this.users = new Map(); // username -> user data
    this.sessions = new Map(); // sessionId -> user session
  }

  async createOrGetUser(username) {
    if (!username || username.trim() === '') {
      throw new Error('Username is required');
    }

    const normalizedUsername = username.trim().toLowerCase();
    
    if (this.users.has(normalizedUsername)) {
      return this.users.get(normalizedUsername);
    }

    // Create new user
    const userData = {
      username: normalizedUsername,
      displayName: username.trim(),
      createdAt: new Date().toISOString(),
      totalSessions: 0,
      totalCorrect: 0,
      totalQuestions: 0
    };

    this.users.set(normalizedUsername, userData);
    
    // Save to R2
    try {
      await this.saveUserToR2(userData);
    } catch (error) {
      console.warn('Failed to save user to R2:', error.message);
    }

    return userData;
  }

  async saveUserToR2(userData) {
    // TODO: Implement R2 save - for now just log
    console.log('User created:', userData.username);
    return Promise.resolve();
  }

  createSession(userData) {
    const sessionId = `${userData.username}_${Date.now()}`;
    const sessionData = {
      sessionId,
      user: userData,
      createdAt: new Date().toISOString()
    };
    
    this.sessions.set(sessionId, sessionData);
    return sessionData;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
}

class QuestionSystem {
  constructor() {
    this.currentSession = {};
    this.userProgress = {};
    this.questionComments = new Map(); // questionId -> comments array
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
    if (!question.data || !question.data.answer) {
      return { correct: false, message: 'Answer data not found' };
    }
    
    const correctAnswer = question.data.answer;
    const isCorrect = this.normalizeAnswer(userAnswer) === this.normalizeAnswer(correctAnswer);
    
    return {
      correct: isCorrect,
      correctAnswer: correctAnswer,
      userAnswer: userAnswer,
      explanation: question.data.explanation || null
    };
  }

  async addCommentToQuestion(questionId, username, comment) {
    if (!this.questionComments.has(questionId)) {
      this.questionComments.set(questionId, []);
    }

    const commentData = {
      id: Date.now(),
      username,
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    };

    this.questionComments.get(questionId).push(commentData);
    
    // TODO: Save to R2
    console.log('Comment added:', { questionId, username, comment });
    
    return commentData;
  }

  getQuestionComments(questionId) {
    return this.questionComments.get(questionId) || [];
  }

  async updateUserStats(username, isCorrect) {
    // Simple stats tracking
    if (!this.userProgress[username]) {
      this.userProgress[username] = {
        totalQuestions: 0,
        correctAnswers: 0,
        sessions: []
      };
    }

    this.userProgress[username].totalQuestions++;
    if (isCorrect) {
      this.userProgress[username].correctAnswers++;
    }
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

const authSystem = new UserAuthSystem();
const questionSystem = new QuestionSystem();

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await authSystem.createOrGetUser(username);
    const session = authSystem.createSession(user);
    
    // Production logging
    console.log(`User login: ${user.username} at ${new Date().toISOString()}`);
    
    res.json({ 
      success: true,
      user: {
        username: user.username,
        displayName: user.displayName,
        totalSessions: user.totalSessions
      },
      sessionId: session.sessionId
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/user/:username/stats', (req, res) => {
  try {
    const { username } = req.params;
    const stats = questionSystem.userProgress[username] || {
      totalQuestions: 0,
      correctAnswers: 0,
      sessions: []
    };
    
    res.json({
      username,
      ...stats,
      accuracy: stats.totalQuestions > 0 ? 
        (stats.correctAnswers / stats.totalQuestions * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comment endpoints
app.post('/api/questions/:questionId/comments', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { username, comment } = req.body;
    
    if (!username || !comment) {
      return res.status(400).json({ error: 'Username and comment are required' });
    }

    const commentData = await questionSystem.addCommentToQuestion(questionId, username, comment);
    res.json({ success: true, comment: commentData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/questions/:questionId/comments', (req, res) => {
  try {
    const { questionId } = req.params;
    const comments = questionSystem.getQuestionComments(questionId);
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

app.post('/api/session/:sessionId/answer/:questionIndex', async (req, res) => {
  try {
    const { sessionId, questionIndex } = req.params;
    const { answer, username } = req.body;
    
    const result = questionSystem.submitAnswer(sessionId, parseInt(questionIndex), answer);
    const stats = questionSystem.getSessionStats(sessionId);
    
    // Update user stats
    if (username) {
      await questionSystem.updateUserStats(username, result.correct);
    }
    
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
    endpoint: 'https://questa-r2-api.t88596565.workers.dev/api',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      authentication: true,
      comments: true,
      history: true,
      r2Integration: true
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Question Answering System with Workers API running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}`);
});