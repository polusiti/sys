class WorkersAPIClient {
  constructor() {
    this.baseURL = 'https://questa-r2-api.t88596565.workers.dev/api';
    this.adminToken = 'questa-admin-2024';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.adminToken}`,
        ...options.headers
      }
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Workers API Request Failed:', error);
      throw error;
    }
  }

  async listFiles(subject, prefix = '') {
    try {
      const response = await this.request(`/files/${subject}?prefix=${encodeURIComponent(prefix)}`);
      return response.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async getFile(subject, key) {
    try {
      const response = await this.request(`/files/${subject}/${encodeURIComponent(key)}`);
      return response;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  async getJsonFile(subject, key) {
    try {
      const response = await this.request(`/files/${subject}/${encodeURIComponent(key)}`);
      if (response.data) {
        return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      }
      return response;
    } catch (error) {
      console.error('Error getting JSON file:', error);
      throw error;
    }
  }

  async getSubjectFiles(subject) {
    try {
      const files = await this.listFiles(subject);
      return files.map(file => ({
        key: file.key || file.name,
        size: file.size || 0,
        lastModified: file.lastModified || new Date(),
        name: (file.key || file.name).split('/').pop()
      }));
    } catch (error) {
      console.error(`Error getting ${subject} files:`, error);
      throw error;
    }
  }

  async getQuestionData(subject, questionId) {
    try {
      const key = `questions/${questionId}.json`;
      return await this.getJsonFile(subject, key);
    } catch (error) {
      console.error(`Error getting question data:`, error);
      throw error;
    }
  }

  async getRandomQuestion(subject, difficulty = null) {
    try {
      const files = await this.getSubjectFiles(subject);
      const questionFiles = files.filter(file => 
        file.name.endsWith('.json') && file.key.includes('questions')
      );
      
      if (questionFiles.length === 0) {
        throw new Error('No questions found');
      }
      
      let selectedFile;
      if (difficulty) {
        const difficultyFiles = questionFiles.filter(file => 
          file.name.toLowerCase().includes(difficulty.toLowerCase())
        );
        selectedFile = difficultyFiles[Math.floor(Math.random() * difficultyFiles.length)];
      } else {
        selectedFile = questionFiles[Math.floor(Math.random() * questionFiles.length)];
      }
      
      if (!selectedFile) {
        throw new Error('No suitable question found');
      }
      
      const questionData = await this.getJsonFile(subject, selectedFile.key);
      return {
        id: selectedFile.name.replace('.json', ''),
        subject,
        data: questionData,
        fileKey: selectedFile.key
      };
    } catch (error) {
      console.error('Error getting random question:', error);
      throw error;
    }
  }

  async getSubjects() {
    try {
      const subjects = ['english', 'japanese', 'math'];
      const subjectData = {};
      
      for (const subject of subjects) {
        try {
          const files = await this.getSubjectFiles(subject);
          const questionFiles = files.filter(file => 
            file.name.endsWith('.json') && file.key.includes('questions')
          );
          subjectData[subject] = {
            questionCount: questionFiles.length,
            available: questionFiles.length > 0
          };
        } catch (error) {
          subjectData[subject] = {
            questionCount: 0,
            available: false,
            error: error.message
          };
        }
      }
      
      return subjectData;
    } catch (error) {
      console.error('Error getting subjects:', error);
      throw error;
    }
  }

  async getAudioFile(subject, filename) {
    try {
      const response = await this.request(`/files/${subject}/audio/${encodeURIComponent(filename)}`);
      return response;
    } catch (error) {
      console.error('Error getting audio file:', error);
      throw error;
    }
  }

  async getAudioUrl(subject, filename) {
    return `${this.baseURL}/files/${subject}/audio/${encodeURIComponent(filename)}?token=${this.adminToken}`;
  }
}

module.exports = WorkersAPIClient;