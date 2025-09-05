class AdvancedQuestionEditor {
    constructor() {
        this.currentUser = null;
        this.allQuestions = [];
        this.currentQuestion = null;
        this.isEditMode = false;
        this.choiceCount = 0;
        this.stepCount = 0;
        this.isDirty = false;

        this.checkAuthentication();
        this.init();
    }

    checkAuthentication() {
        this.currentUser = window.auth?.getCurrentUser() || AuthenticationSystem?.getCurrentUser();
        
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        if (!this.currentUser.permissions?.includes('write')) {
            alert('⚠️ 編集権限が必要です');
            window.location.href = 'dashboard.html';
            return;
        }
        
        this.loadUserInfo();
    }

    loadUserInfo() {
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = this.currentUser.displayName;
        if (userRole) userRole.textContent = this.getRoleDisplayName(this.currentUser.role);
        if (userAvatar) userAvatar.textContent = this.currentUser.displayName.charAt(0);
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': '管理者',
            'teacher': '教師',
        };
        return roleNames[role] || role;
    }

    async init() {
        await this.loadAllQuestions();

        const urlParams = new URLSearchParams(window.location.search);
        const questionId = urlParams.get('id');

        if (questionId) {
            this.isEditMode = true;
            const question = this.allQuestions.find(q => q.id === questionId);
            if (question) {
                this.currentQuestion = JSON.parse(JSON.stringify(question)); // Deep copy
                document.title = `編集: ${question.id}`;
            } else {
                alert('指定されたIDの問題が見つかりません。');
                this.currentQuestion = this.createEmptyQuestion();
                document.title = '新規作成';
            }
        } else {
            this.isEditMode = false;
            this.currentQuestion = this.createEmptyQuestion();
            this.generateId();
            document.title = '新規作成';
        }

        this.populateForm();
        this.updateAnswerFormat();
        this.updatePreview();
        this.setupAutoSave();
        this.setupFormListeners();
    }

    async loadAllQuestions() {
        const questionFiles = [
            '/data/questions/quiz-choice-questions.json',
            '/data/questions/quiz-f1-questions.json',
            '/data/questions/quiz-f2-questions.json'
        ];
        this.allQuestions = [];
        for (const file of questionFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const questions = await response.json();
                    this.allQuestions.push(...questions);
                }
            } catch (error) {
                console.warn(`Failed to load question file: ${file}`, error);
            }
        }
    }

    populateForm() {
        if (!this.currentQuestion) return;
        const q = this.currentQuestion;
        document.getElementById('questionId').value = q.id || '';
        document.getElementById('answerFormat').value = q.answerFormat || 'A1';
        document.getElementById('subject').value = q.subject || 'math';
        document.getElementById('difficulty').value = q.difficulty || 2;
        document.getElementById('estimatedTime').value = q.metadata?.estimatedTime ? q.metadata.estimatedTime / 60 : 3;
        document.getElementById('topic').value = q.topic || '';
        document.getElementById('tags').value = (q.tags || []).join(', ');
        document.getElementById('questionStem').value = q.questionContent?.stem || '';
        document.getElementById('questionText').value = q.questionContent?.text || '';
        document.getElementById('questionLatex').checked = q.questionContent?.latex || false;
        document.getElementById('explanationText').value = q.explanation?.text || '';
        document.getElementById('explanationLatex').checked = q.explanation?.latex || false;
        document.getElementById('detailedExplanation').value = q.explanation?.detailed || '';
        document.getElementById('hints').value = (q.explanation?.hints || []).join('\n');
    }

    createEmptyQuestion() {
        return {
            id: '',
            answerFormat: 'A1',
            subject: 'math',
            topic: '',
            difficulty: 2,
            tags: [],
            questionContent: {
                stem: '',
                text: '',
                latex: false,
                images: []
            },
            answerData: {
                type: 'multiple-choice',
                choices: [],
                correctAnswers: [],
                closeAnswers: []
            },
            explanation: {
                text: '',
                latex: false,
                detailed: '',
                steps: [],
                hints: []
            },
            metadata: {
                estimatedTime: 180,
                createdAt: new Date().toISOString()
            },
            active: true
        };
    }

    setupFormListeners() {
        // ... (rest of the original file content)
    }
}

// ... (rest of the global functions)
