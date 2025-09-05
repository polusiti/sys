// Advanced Question Editor with Auto ID Generation and Subject-Specific Interfaces
class AdvancedQuestionEditor {
    constructor() {
        this.currentUser = null;
        this.allQuestions = [];
        this.currentQuestion = null;
        this.isEditMode = false;
        this.choiceCount = 0;
        this.stepCount = 0;
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.subjectTemplates = null;
        
        this.init();
    }
    
    async init() {
        await this.checkAuthentication();
        await this.loadSubjectTemplates();
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
                this.showToast('指定されたIDの問題が見つかりません。', 'warning');
                this.currentQuestion = this.createEmptyQuestion();
                document.title = '新規作成';
            }
        } else {
            this.isEditMode = false;
            this.currentQuestion = this.createEmptyQuestion();
            this.generateAutoId();
            document.title = '新規作成';
        }
        
        this.loadUserInfo();
        this.setupEventListeners();
        this.renderSubjectInterface();
        this.populateForm();
        this.updatePreview();
        this.setupAutoSave();
        this.updateStatistics();
    }
    
    async checkAuthentication() {
        // Check for authentication system
        if (window.auth) {
            this.currentUser = window.auth.getCurrentUser();
        } else if (window.AuthenticationSystem) {
            this.currentUser = AuthenticationSystem.getCurrentUser();
        } else if (localStorage.getItem('currentUser')) {
            this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        }
        
        if (!this.currentUser) {
            // For demo purposes, create a default user
            this.currentUser = {
                id: 'demo-user',
                displayName: 'デモユーザー',
                role: 'teacher',
                permissions: ['read', 'write', 'delete']
            };
        }
        
        if (!this.currentUser.permissions?.includes('write')) {
            alert('⚠️ 編集権限が必要です');
            window.location.href = 'index.html';
            return;
        }
    }
    
    async loadSubjectTemplates() {
        this.subjectTemplates = {
            math: {
                name: '数学',
                icon: '🔢',
                color: '#3b82f6',
                difficultySystem: 'A1-D4',
                answerFormats: ['A1', 'F1', 'F2'],
                topics: [
                    '数と式', '方程式と不等式', '二次関数', '図形と計量',
                    '三角比', '確率', '整数', '図形の性質', 'ベクトル',
                    '数列', '極限', '微分法', '積分法'
                ],
                templates: {
                    'A1': {
                        levels: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'],
                        estimatedTimes: { 'A': 60, 'B': 90, 'C': 120, 'D': 180 }
                    }
                }
            },
            english: {
                name: '英語',
                icon: '🇺🇸',
                color: '#10b981',
                difficultySystem: '1-5',
                answerFormats: ['A1', 'A4', 'A2', 'F3', 'F2'],
                topics: [
                    '語彙', '文法', '読解', 'リスニング', '英作文',
                    '会話表現', 'イディオム', '時制', '仮定法'
                ]
            },
            science: {
                name: '理科',
                icon: '🧪',
                color: '#8b5cf6',
                difficultySystem: '1-5',
                answerFormats: ['A1', 'F1'],
                subjects: {
                    physics: {
                        name: '物理',
                        topics: ['力学', '電磁気', '熱', '波動']
                    },
                    chemistry: {
                        name: '化学',
                        topics: ['化学反応', '物質の状態', '酸化還元']
                    },
                    biology: {
                        name: '生物',
                        topics: ['細胞', '遺伝', '代謝', '生態系']
                    }
                }
            },
            japanese: {
                name: '国語',
                icon: '📚',
                color: '#ef4444',
                difficultySystem: '1-5',
                answerFormats: ['A1', 'A2', 'F2'],
                topics: [
                    '漢字', '文法', '古典', '現代文', '文学史',
                    '表現技法', '語彙', '読解'
                ]
            },
            social: {
                name: '社会',
                icon: '🌍',
                color: '#f59e0b',
                difficultySystem: '1-5',
                answerFormats: ['A1', 'F2'],
                subjects: {
                    history: {
                        name: '歴史',
                        topics: ['日本史', '世界史', '文化史']
                    },
                    geography: {
                        name: '地理',
                        topics: ['自然地理', '人文地理', '地図']
                    },
                    politics: {
                        name: '公民',
                        topics: ['政治', '経済', '社会', '倫理']
                    }
                }
            }
        };
    }
    
    async loadAllQuestions() {
        // Try to load from IndexedDB first
        if (window.Database) {
            try {
                const db = await window.Database.getInstance();
                const questions = await db.getQuestions({ limit: 10000 });
                this.allQuestions = questions;
                return;
            } catch (error) {
                console.warn('Failed to load from IndexedDB:', error);
            }
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem('questions');
        if (stored) {
            try {
                this.allQuestions = JSON.parse(stored);
            } catch (error) {
                console.warn('Failed to parse questions from localStorage:', error);
                this.allQuestions = [];
            }
        } else {
            this.allQuestions = [];
        }
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
            'editor': '編集者',
            'viewer': '閲覧者'
        };
        return roleNames[role] || role;
    }
    
    renderSubjectInterface() {
        const subject = document.getElementById('subject').value;
        const interfaceContainer = document.getElementById('subjectInterface');
        
        if (!interfaceContainer) return;
        
        interfaceContainer.innerHTML = this.getSubjectInterfaceHTML(subject);
        
        // Initialize subject-specific components
        if (subject === 'math') {
            this.initMathInterface();
        } else if (subject === 'english') {
            this.initEnglishInterface();
        } else if (subject === 'science') {
            this.initScienceInterface();
        }
    }
    
    getSubjectInterfaceHTML(subject) {
        const template = this.subjectTemplates[subject];
        if (!template) return '';
        
        switch (subject) {
            case 'math':
                return `
                    <div class="subject-specific math-interface">
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">📐 数学特有設定</h3>
                            </div>
                            
                            <div class="form-group">
                                <label>難易度コード (A1-D4)</label>
                                <div class="math-difficulty-grid">
                                    ${['A', 'B', 'C', 'D'].map(level => `
                                        <div class="difficulty-level">
                                            <div class="level-header">${level}レベル</div>
                                            <div class="level-options">
                                                ${[1, 2, 3, 4].map(num => `
                                                    <label class="difficulty-option">
                                                        <input type="radio" name="mathDifficulty" value="${level}${num}" 
                                                               onchange="editor.setMathDifficulty('${level}${num}')">
                                                        <span class="option-label">${level}${num}</span>
                                                        <span class="option-desc">${this.getMathDifficultyDesc(level, num)}</span>
                                                    </label>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="mathTopic">数学分野</label>
                                <select id="mathTopic" class="form-control" onchange="editor.updateTopicSuggestions()">
                                    ${template.topics.map(topic => `
                                        <option value="${topic}">${topic}</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>使用可能な数式</label>
                                <div class="latex-shortcuts">
                                    ${['\\\\frac{}{}', '\\\\sqrt{}', 'x^2', 'x^n', '\\\\sum', '\\\\int', '\\\\lim', '\\\\infty', '\\\\pi', '\\\\alpha', '\\\\beta', '\\\\theta'].map(latex => `
                                        <button type="button" class="latex-shortcut" onclick="editor.insertLatex('${latex}')">
                                            ${latex}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
            case 'english':
                return `
                    <div class="subject-specific english-interface">
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">🇺🇸 英語特有設定</h3>
                            </div>
                            
                            <div class="form-group">
                                <label for="englishCategory">問題カテゴリー</label>
                                <select id="englishCategory" class="form-control" onchange="editor.updateEnglishOptions()">
                                    <option value="vocabulary">語彙問題</option>
                                    <option value="grammar">文法問題</option>
                                    <option value="reading">読解問題</option>
                                    <option value="listening">リスニング問題</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="wordLevelGroup">
                                <label for="wordLevel">語彙レベル</label>
                                <select id="wordLevel" class="form-control">
                                    <option value="basic">基礎 (中学レベル)</option>
                                    <option value="intermediate">中級 (高校基礎)</option>
                                    <option value="advanced">上級 (高校発展)</option>
                                    <option value="toeic">TOEIC 600-800</option>
                                    <option value="toefl">TOEFL iBT 80+</option>
                                </select>
                            </div>
                            
                            <div id="vocabularyOptions" class="form-group">
                                <label for="targetWord">対象単語</label>
                                <input type="text" id="targetWord" class="form-control" 
                                       placeholder="例: ubiquitous" onchange="editor.getWordDefinitions()">
                                <div id="wordDefinitions" class="word-definitions"></div>
                            </div>
                        </div>
                    </div>
                `;
                
            case 'science':
                return `
                    <div class="subject-specific science-interface">
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">🧪 理科特有設定</h3>
                            </div>
                            
                            <div class="form-group">
                                <label for="scienceSubject">理科科目</label>
                                <select id="scienceSubject" class="form-control" onchange="editor.updateScienceTopics()">
                                    <option value="">選択してください</option>
                                    ${Object.entries(template.subjects).map(([key, subj]) => `
                                        <option value="${key}">${subj.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="scienceTopic">専門分野</label>
                                <select id="scienceTopic" class="form-control">
                                    <option value="">先に理科科目を選択</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="formula">関連公式</label>
                                <input type="text" id="formula" class="form-control" 
                                       placeholder="例: F = ma">
                            </div>
                            
                            <div class="form-group">
                                <label for="units">単位</label>
                                <input type="text" id="units" class="form-control" 
                                       placeholder="例: m/s, kg, N">
                            </div>
                        </div>
                    </div>
                `;
                
            default:
                return `
                    <div class="subject-specific default-interface">
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">📋 一般設定</h3>
                            </div>
                            
                            <div class="form-group">
                                <label for="customTopic">カスタム分野</label>
                                <input type="text" id="customTopic" class="form-control" 
                                       placeholder="特定の分野を入力">
                            </div>
                        </div>
                    </div>
                `;
        }
    }
    
    getMathDifficultyDesc(level, num) {
        const descriptions = {
            'A': { 1: '基礎計算', 2: '基本問題', 3: '標準問題', 4: '応用問題' },
            'B': { 1: '標準的', 2: 'やや難', 3: '難問', 4: '高度な応用' },
            'C': { 1: '発展レベル', 2: '難解', 3: '非常に難解', 4: '最難関予備' },
            'D': { 1: '最難関', 2: 'オリンピック級', 3: '研究レベル', 4: '創造的問題' }
        };
        return descriptions[level][num] || '';
    }
    
    initMathInterface() {
        // Set initial difficulty if editing
        if (this.currentQuestion?.difficulty?.match(/[A-D][1-4]/)) {
            const difficulty = this.currentQuestion.difficulty;
            const radio = document.querySelector(`input[name="mathDifficulty"][value="${difficulty}"]`);
            if (radio) radio.checked = true;
        }
    }
    
    initEnglishInterface() {
        // Initialize English-specific features
        this.updateEnglishOptions();
    }
    
    initScienceInterface() {
        // Initialize science-specific features
        if (this.currentQuestion?.scienceSubject) {
            document.getElementById('scienceSubject').value = this.currentQuestion.scienceSubject;
            this.updateScienceTopics();
            if (this.currentQuestion.scienceTopic) {
                document.getElementById('scienceTopic').value = this.currentQuestion.scienceTopic;
            }
        }
    }
    
    setMathDifficulty(difficulty) {
        this.currentQuestion.difficulty = difficulty;
        const template = this.subjectTemplates.math.templates.A1;
        const level = difficulty[0];
        this.currentQuestion.metadata = this.currentQuestion.metadata || {};
        this.currentQuestion.metadata.estimatedTime = template.estimatedTimes[level] || 120;
        document.getElementById('estimatedTime').value = Math.round(this.currentQuestion.metadata.estimatedTime / 60);
        this.markDirty();
    }
    
    updateEnglishOptions() {
        const category = document.getElementById('englishCategory').value;
        const wordLevelGroup = document.getElementById('wordLevelGroup');
        const vocabularyOptions = document.getElementById('vocabularyOptions');
        
        if (category === 'vocabulary') {
            wordLevelGroup.style.display = 'block';
            vocabularyOptions.style.display = 'block';
        } else {
            wordLevelGroup.style.display = 'none';
            vocabularyOptions.style.display = 'none';
        }
    }
    
    updateScienceTopics() {
        const subject = document.getElementById('scienceSubject').value;
        const topicSelect = document.getElementById('scienceTopic');
        
        topicSelect.innerHTML = '<option value="">選択してください</option>';
        
        if (subject && this.subjectTemplates.science.subjects[subject]) {
            const topics = this.subjectTemplates.science.subjects[subject].topics;
            topics.forEach(topic => {
                topicSelect.innerHTML += `<option value="${topic}">${topic}</option>`;
            });
        }
    }
    
    async getWordDefinitions() {
        const word = document.getElementById('targetWord').value;
        if (!word) return;
        
        // This would typically call an API, but for demo we'll use mock data
        const mockDefinitions = {
            ubiquitous: [
                { part: 'adj.', definition: '至る所にある、どこにでもある' },
                { part: 'synonyms', definition: 'omnipresent, pervasive, widespread' }
            ]
        };
        
        const definitions = mockDefinitions[word.toLowerCase()] || [];
        const container = document.getElementById('wordDefinitions');
        
        if (definitions.length > 0) {
            container.innerHTML = definitions.map(def => `
                <div class="word-definition">
                    <strong>${def.part}</strong>: ${def.definition}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="no-definitions">定義が見つかりません</div>';
        }
    }
    
    insertLatex(latex) {
        const textarea = document.getElementById('questionText');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        // For templates with braces, place cursor in the first brace
        if (latex.includes('{}')) {
            const insertText = latex.replace('{}', '{█}');
            textarea.value = text.substring(0, start) + insertText + text.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + latex.indexOf('{█}') + 1;
        } else {
            textarea.value = text.substring(0, start) + latex + text.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + latex.length;
        }
        
        textarea.focus();
        this.updatePreview();
        this.markDirty();
    }
    
    setupEventListeners() {
        // Subject change
        document.getElementById('subject')?.addEventListener('change', (e) => {
            this.currentQuestion.subject = e.target.value;
            this.renderSubjectInterface();
            this.updateAnswerFormatOptions();
            this.markDirty();
        });
        
        // Answer format change
        document.getElementById('answerFormat')?.addEventListener('change', (e) => {
            this.currentQuestion.answerFormat = e.target.value;
            this.updateAnswerFormat();
            this.markDirty();
        });
        
        // Form inputs
        const formInputs = document.querySelectorAll('#basic-tab input, #basic-tab select, #basic-tab textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', () => this.markDirty());
            input.addEventListener('change', () => this.markDirty());
        });
        
        // Auto-save on field changes
        let autoSaveTimeout;
        const debouncedSave = () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => this.autoSave(), 2000);
        };
        
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-control, .form-input')) {
                debouncedSave();
            }
        });
    }
    
    updateAnswerFormatOptions() {
        const subject = document.getElementById('subject').value;
        const formatSelect = document.getElementById('answerFormat');
        const formats = this.subjectTemplates[subject]?.answerFormats || ['A1'];
        
        formatSelect.innerHTML = formats.map(format => {
            const formatNames = {
                'A1': 'A1 - 4択問題',
                'A2': 'A2 - 長文読解',
                'A4': 'A4 - 5択問題',
                'F1': 'F1 - 計算問題',
                'F2': 'F2 - 記述問題',
                'F3': 'F3 - リスニング'
            };
            return `<option value="${format}">${formatNames[format] || format}</option>`;
        }).join('');
    }
    
    updateAnswerFormat() {
        const format = document.getElementById('answerFormat').value;
        const answerSections = document.querySelectorAll('#answer-tab > .form-section');
        
        // Hide all answer sections
        answerSections.forEach(section => section.classList.add('hidden'));
        
        // Show relevant section
        switch (format) {
            case 'A1':
            case 'A2':
            case 'A4':
                document.getElementById('multipleChoiceAnswer').classList.remove('hidden');
                this.updateChoiceInputs(format === 'A4' ? 5 : 4);
                break;
            case 'F1':
                document.getElementById('fractionAnswer').classList.remove('hidden');
                break;
            case 'F2':
                document.getElementById('freeTextAnswer').classList.remove('hidden');
                break;
            case 'ESSAY':
                document.getElementById('essayAnswer').classList.remove('hidden');
                break;
        }
    }
    
    updateChoiceInputs(count) {
        const choicesList = document.getElementById('choicesList');
        choicesList.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            choicesList.innerHTML += `
                <div class="choice-item">
                    <div class="choice-header">
                        <span class="choice-number">${i + 1}</span>
                        <div class="choice-indicators">
                            <label class="choice-badge badge-correct">
                                <input type="radio" name="correctChoice" value="${i}">
                                正解
                            </label>
                            <label class="choice-badge badge-close">
                                <input type="checkbox" value="${i}">
                                不正解
                            </label>
                        </div>
                    </div>
                    <input type="text" class="form-control choice-text" placeholder="選択肢${i + 1}">
                </div>
            `;
        }
        
        this.choiceCount = count;
    }
    
    generateAutoId() {
        const subject = document.getElementById('subject').value;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        const id = `q_${subject}_${timestamp}_${random}`;
        
        document.getElementById('questionId').value = id;
        this.currentQuestion.id = id;
        
        return id;
    }
    
    populateForm() {
        if (!this.currentQuestion) return;
        
        const q = this.currentQuestion;
        
        // Basic info
        document.getElementById('questionId').value = q.id || '';
        document.getElementById('subject').value = q.subject || 'math';
        document.getElementById('answerFormat').value = q.answerFormat || 'A1';
        
        // Handle math difficulty
        if (q.subject === 'math' && q.difficulty?.match(/[A-D][1-4]/)) {
            // Will be set by initMathInterface
        } else {
            document.getElementById('difficulty').value = q.difficulty || 3;
        }
        
        document.getElementById('estimatedTime').value = q.metadata?.estimatedTime ? 
            Math.round(q.metadata.estimatedTime / 60) : 3;
        document.getElementById('topic').value = q.topic || '';
        document.getElementById('tags').value = (q.tags || []).join(', ');
        
        // Question content
        document.getElementById('questionStem').value = q.questionContent?.stem || '';
        document.getElementById('questionText').value = q.questionContent?.text || '';
        document.getElementById('questionLatex').checked = q.questionContent?.latex || false;
        
        // Answer data
        if (q.answerData?.choices) {
            this.updateAnswerFormat();
            q.answerData.choices.forEach((choice, i) => {
                const input = document.querySelector(`#choicesList .choice-text:nth-child(${i + 1})`);
                if (input) input.value = choice;
            });
            
            if (q.answerData.correctAnswers?.length > 0) {
                const correctRadio = document.querySelector(`input[name="correctChoice"][value="${q.answerData.correctAnswers[0]}"]`);
                if (correctRadio) correctRadio.checked = true;
            }
        }
        
        // Explanation
        document.getElementById('explanationText').value = q.explanation?.text || '';
        document.getElementById('explanationLatex').checked = q.explanation?.latex || false;
        document.getElementById('detailedExplanation').value = q.explanation?.detailed || '';
        document.getElementById('hints').value = (q.explanation?.hints || []).join('\n');
        
        // Subject-specific fields
        if (q.subject === 'math' && q.mathTopic) {
            document.getElementById('mathTopic').value = q.mathTopic;
        }
        
        if (q.subject === 'english' && q.englishCategory) {
            document.getElementById('englishCategory').value = q.englishCategory;
            this.updateEnglishOptions();
        }
        
        if (q.subject === 'science') {
            if (q.scienceSubject) {
                document.getElementById('scienceSubject').value = q.scienceSubject;
                this.updateScienceTopics();
                if (q.scienceTopic) {
                    document.getElementById('scienceTopic').value = q.scienceTopic;
                }
            }
            document.getElementById('formula').value = q.formula || '';
            document.getElementById('units').value = q.units || '';
        }
    }
    
    createEmptyQuestion() {
        return {
            id: '',
            answerFormat: 'A1',
            subject: 'math',
            topic: '',
            difficulty: 'A1',
            tags: [],
            questionContent: {
                stem: '',
                text: '',
                latex: false,
                images: []
            },
            answerData: {
                choices: [],
                correctAnswers: [],
                explanation: ''
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
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.id
            },
            active: true
        };
    }
    
    async saveQuestion() {
        if (!this.validateQuestion()) {
            return false;
        }
        
        this.buildQuestionData();
        
        try {
            // Save to IndexedDB if available
            if (window.Database) {
                const db = await window.Database.getInstance();
                await db.saveQuestion(this.currentQuestion);
            }
            
            // Fallback to localStorage
            const existingIndex = this.allQuestions.findIndex(q => q.id === this.currentQuestion.id);
            if (existingIndex >= 0) {
                this.allQuestions[existingIndex] = this.currentQuestion;
            } else {
                this.allQuestions.push(this.currentQuestion);
            }
            
            localStorage.setItem('questions', JSON.stringify(this.allQuestions));
            
            this.isDirty = false;
            this.updateSaveStatus('saved');
            this.showToast('問題を保存しました！', 'success');
            
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            this.showToast('保存に失敗しました', 'error');
            return false;
        }
    }
    
    buildQuestionData() {
        const q = this.currentQuestion;
        
        // Basic info
        q.id = document.getElementById('questionId').value;
        q.subject = document.getElementById('subject').value;
        q.answerFormat = document.getElementById('answerFormat').value;
        
        // Difficulty
        if (q.subject === 'math') {
            const selected = document.querySelector('input[name="mathDifficulty"]:checked');
            q.difficulty = selected ? selected.value : 'A1';
        } else {
            q.difficulty = parseInt(document.getElementById('difficulty').value);
        }
        
        // Metadata
        q.metadata = q.metadata || {};
        q.metadata.estimatedTime = parseInt(document.getElementById('estimatedTime').value) * 60;
        q.metadata.updatedAt = new Date().toISOString();
        
        // Topic and tags
        q.topic = document.getElementById('topic').value;
        q.tags = document.getElementById('tags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t);
        
        // Question content
        q.questionContent = {
            stem: document.getElementById('questionStem').value,
            text: document.getElementById('questionText').value,
            latex: document.getElementById('questionLatex').checked,
            images: q.questionContent?.images || []
        };
        
        // Answer data based on format
        switch (q.answerFormat) {
            case 'A1':
            case 'A2':
            case 'A4':
                const choices = Array.from(document.querySelectorAll('.choice-text')).map(input => input.value);
                const correctChoice = document.querySelector('input[name="correctChoice"]:checked');
                q.answerData = {
                    choices: choices,
                    correctAnswers: correctChoice ? [parseInt(correctChoice.value)] : []
                };
                break;
                
            case 'F1':
                q.answerData = {
                    type: 'fraction',
                    a: parseInt(document.getElementById('fractionA').value) || 0,
                    b: parseInt(document.getElementById('fractionB').value) || 0,
                    c: parseInt(document.getElementById('fractionC').value) || 1
                };
                break;
                
            case 'F2':
                q.answerData = {
                    type: 'free-text',
                    expectedAnswers: document.getElementById('expectedAnswers').value
                        .split('\n')
                        .filter(a => a.trim())
                };
                break;
        }
        
        // Explanation
        q.explanation = {
            text: document.getElementById('explanationText').value,
            latex: document.getElementById('explanationLatex').checked,
            detailed: document.getElementById('detailedExplanation').value,
            hints: document.getElementById('hints').value
                .split('\n')
                .filter(h => h.trim())
        };
        
        // Subject-specific data
        if (q.subject === 'math') {
            q.mathTopic = document.getElementById('mathTopic')?.value;
        } else if (q.subject === 'english') {
            q.englishCategory = document.getElementById('englishCategory')?.value;
            q.wordLevel = document.getElementById('wordLevel')?.value;
            q.targetWord = document.getElementById('targetWord')?.value;
        } else if (q.subject === 'science') {
            q.scienceSubject = document.getElementById('scienceSubject')?.value;
            q.scienceTopic = document.getElementById('scienceTopic')?.value;
            q.formula = document.getElementById('formula')?.value;
            q.units = document.getElementById('units')?.value;
        }
    }
    
    validateQuestion() {
        const required = ['questionId', 'subject', 'answerFormat', 'questionText'];
        
        for (const field of required) {
            const element = document.getElementById(field);
            if (!element || !element.value.trim()) {
                this.showToast(`${field} は必須です`, 'error');
                return false;
            }
        }
        
        // Validate answer format specific requirements
        const format = document.getElementById('answerFormat').value;
        if (['A1', 'A2', 'A4'].includes(format)) {
            const choices = Array.from(document.querySelectorAll('.choice-text'));
            if (choices.some(c => !c.value.trim())) {
                this.showToast('すべての選択肢を入力してください', 'error');
                return false;
            }
            
            if (!document.querySelector('input[name="correctChoice"]:checked')) {
                this.showToast('正解を選択してください', 'error');
                return false;
            }
        }
        
        return true;
    }
    
    updatePreview() {
        const preview = document.getElementById('previewContent');
        if (!preview) return;
        
        const questionText = document.getElementById('questionText').value;
        const questionStem = document.getElementById('questionStem').value;
        
        let html = '';
        
        if (questionStem) {
            html += `<div class="preview-stem">${questionStem}</div>`;
        }
        
        if (questionText) {
            html += `<div class="preview-question">${questionText.replace(/\n/g, '<br>')}</div>`;
        }
        
        // Show choices if they exist
        const choices = Array.from(document.querySelectorAll('.choice-text'));
        if (choices.length > 0) {
            html += '<div class="preview-choices">';
            choices.forEach((choice, i) => {
                if (choice.value) {
                    html += `<div class="preview-choice">${String.fromCharCode(65 + i)}. ${choice.value}</div>`;
                }
            });
            html += '</div>';
        }
        
        preview.innerHTML = html || '<div class="preview-empty">プレビューがここに表示されます</div>';
        
        // Render MathJax if needed
        if (window.MathJax && (questionText.includes('$') || questionText.includes('\\'))) {
            MathJax.typesetPromise([preview]).catch((e) => console.warn('MathJax error:', e));
        }
    }
    
    updateStatistics() {
        const charCount = document.getElementById('questionText')?.value.length || 0;
        const choiceCount = document.querySelectorAll('.choice-text').length;
        const stepCount = document.querySelectorAll('.step-item').length;
        
        document.getElementById('charCount').textContent = charCount;
        document.getElementById('choiceCount').textContent = choiceCount;
        document.getElementById('stepCount').textContent = stepCount;
    }
    
    setupAutoSave() {
        setInterval(() => {
            if (this.isDirty) {
                this.autoSave();
            }
        }, 30000); // Auto-save every 30 seconds
    }
    
    async autoSave() {
        if (!this.isDirty) return;
        
        try {
            this.buildQuestionData();
            
            // Save to localStorage as draft
            const drafts = JSON.parse(localStorage.getItem('questionDrafts') || '{}');
            drafts[this.currentQuestion.id] = {
                question: this.currentQuestion,
                timestamp: Date.now()
            };
            localStorage.setItem('questionDrafts', JSON.stringify(drafts));
            
            this.updateSaveStatus('autosaved');
            console.log('Auto-saved draft');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    markDirty() {
        this.isDirty = true;
        this.updateSaveStatus('unsaved');
        this.updatePreview();
        this.updateStatistics();
    }
    
    updateSaveStatus(status) {
        const indicator = document.getElementById('saveStatus');
        const text = document.getElementById('saveText');
        
        if (!indicator || !text) return;
        
        switch (status) {
            case 'saved':
                indicator.className = 'status-indicator saved';
                text.textContent = '保存済み';
                break;
            case 'unsaved':
                indicator.className = 'status-indicator unsaved';
                text.textContent = '未保存';
                break;
            case 'autosaved':
                indicator.className = 'status-indicator autosaved';
                text.textContent = '自動保存済み';
                break;
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Export methods
    exportJSON() {
        this.buildQuestionData();
        const json = JSON.stringify(this.currentQuestion, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentQuestion.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Navigation
    goToManager() {
        window.location.href = 'question-manager.html';
    }
}

// Global functions for HTML onclick handlers
let editor;

window.addEventListener('DOMContentLoaded', () => {
    editor = new AdvancedQuestionEditor();
});

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
}

// Answer format update
function updateAnswerFormat() {
    editor.updateAnswerFormat();
}

// Save question
async function saveQuestion() {
    await editor.saveQuestion();
}

// Auto-generate ID
function generateId() {
    editor.generateAutoId();
}

// Validate question
function validateQuestion() {
    return editor.validateQuestion();
}

// Export JSON
function exportJson() {
    editor.exportJSON();
}

// Go to manager
function goToManager() {
    editor.goToManager();
}

// Insert LaTeX
function insertLatex(latex) {
    editor.insertLatex(latex);
}

// Subject-specific functions
function setMathDifficulty(difficulty) {
    editor.setMathDifficulty(difficulty);
}

function updateEnglishOptions() {
    editor.updateEnglishOptions();
}

function updateScienceTopics() {
    editor.updateScienceTopics();
}

// Image upload handler
function handleImageUpload(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById(previewId);
        preview.innerHTML = `<img src="${e.target.result}" class="image-preview" alt="Preview">`;
        
        // Store the image data
        const imageData = e.target.result;
        if (!editor.currentQuestion.questionContent.images) {
            editor.currentQuestion.questionContent.images = [];
        }
        editor.currentQuestion.questionContent.images.push(imageData);
        
        editor.markDirty();
    };
    reader.readAsDataURL(file);
}

// Choice management
function addChoice() {
    const choicesList = document.getElementById('choicesList');
    const newIndex = choicesList.children.length + 1;
    
    const choiceHTML = `
        <div class="choice-item">
            <div class="choice-header">
                <span class="choice-number">${newIndex}</span>
                <div class="choice-indicators">
                    <label class="choice-badge badge-correct">
                        <input type="radio" name="correctChoice" value="${newIndex - 1}">
                        正解
                    </label>
                    <label class="choice-badge badge-close">
                        <input type="checkbox" value="${newIndex - 1}">
                        不正解
                    </label>
                </div>
            </div>
            <input type="text" class="form-control choice-text" placeholder="選択肢${newIndex}">
        </div>
    `;
    
    choicesList.insertAdjacentHTML('beforeend', choiceHTML);
    editor.markDirty();
}

// Step management
function addStep() {
    const stepsList = document.getElementById('stepsList');
    const stepNumber = stepsList.children.length + 1;
    
    const stepHTML = `
        <div class="step-item">
            <div class="step-header">
                <div class="step-number">${stepNumber}</div>
                <button type="button" class="btn btn-outline btn-small" onclick="this.parentElement.parentElement.parentElement.remove()">
                    削除
                </button>
            </div>
            <textarea class="form-control" placeholder="ステップ${stepNumber}の説明"></textarea>
        </div>
    `;
    
    stepsList.insertAdjacentHTML('beforeend', stepHTML);
    editor.markDirty();
}

// Clear form
function clearQuestion() {
    if (confirm('現在の内容をクリアしてもよろしいですか？')) {
        editor.currentQuestion = editor.createEmptyQuestion();
        editor.generateAutoId();
        editor.populateForm();
        editor.renderSubjectInterface();
        editor.isDirty = false;
        editor.updateSaveStatus('saved');
    }
}

// Duplicate question
function duplicateQuestion() {
    const duplicate = JSON.parse(JSON.stringify(editor.currentQuestion));
    duplicate.id = '';
    duplicate.metadata.createdAt = new Date().toISOString();
    duplicate.metadata.updatedAt = new Date().toISOString();
    
    editor.currentQuestion = duplicate;
    editor.generateAutoId();
    editor.populateForm();
    editor.markDirty();
    editor.showToast('問題を複製しました', 'success');
}

// Logout
function logout() {
    if (window.auth) {
        window.auth.logout();
    } else if (window.AuthenticationSystem) {
        AuthenticationSystem.logout();
    } else {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}