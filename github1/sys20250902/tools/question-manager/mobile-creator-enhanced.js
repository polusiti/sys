// Enhanced Mobile Question Creator with R2 Integration
import { initR2Storage, AutoSync } from './r2-storage.js'
import { initDB, saveQuestion, getQuestions, searchQuestions } from './database.js'

class EnhancedMobileCreator {
  constructor() {
    this.currentView = 'dashboard'
    this.currentQuestion = null
    this.r2Storage = null
    this.autoSync = null
    this.isOnline = navigator.onLine
    this.init()
  }

  async init() {
    // Load configuration
    this.config = await this.loadConfig()
    
    // Initialize databases
    await initDB()
    
    // Initialize R2 storage
    this.r2Storage = initR2Storage(this.config)
    
    // Setup auto-sync
    this.autoSync = new AutoSync(this.r2Storage, window.localDB)
    await this.autoSync.init()
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Load dashboard
    await this.loadDashboard()
    
    // Check online status
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  async loadConfig() {
    try {
      const response = await fetch('config.json')
      return await response.json()
    } catch (error) {
      console.error('Failed to load config:', error)
      return {}
    }
  }

  setupEventListeners() {
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view
        this.switchView(view)
      })
    })

    // Template selection
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectTemplate(card.dataset.template)
      })
    })

    // Form inputs
    document.getElementById('subject').addEventListener('change', () => {
      this.updateTopicOptions()
    })

    document.getElementById('answerFormat').addEventListener('change', (e) => {
      this.handleAnswerFormatChange(e.target.value)
    })

    // Question text input with LaTeX detection
    document.getElementById('questionText').addEventListener('input', () => {
      this.detectLatexAndShowHelpers()
      this.updatePreview()
    })

    // Auto-save
    let saveTimeout
    const form = document.getElementById('questionForm')
    form.addEventListener('input', () => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => this.autoSave(), 2000)
    })

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      this.saveQuestion()
    })

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.handleSearch(e.target.value)
    })
  }

  async loadDashboard() {
    // Load stats
    const stats = await this.getStats()
    this.updateStatsDisplay(stats)
    
    // Load recent questions
    const recent = await getQuestions({ limit: 5 })
    this.renderRecentQuestions(recent)
    
    // Show sync status
    this.updateSyncStatus()
  }

  async getStats() {
    // Try R2 first if online
    if (this.isOnline) {
      const r2Stats = await this.r2Storage.getStats()
      if (r2Stats) return r2Stats
    }
    
    // Fallback to local stats
    const localQuestions = await getQuestions()
    const bySubject = {}
    let todayCount = 0
    
    localQuestions.forEach(q => {
      bySubject[q.subject] = (bySubject[q.subject] || 0) + 1
      if (this.isToday(q.createdAt)) todayCount++
    })
    
    return {
      totalQuestions: localQuestions.length,
      todayCreated: todayCount,
      bySubject
    }
  }

  updateStatsDisplay(stats) {
    document.getElementById('totalQuestions').textContent = stats.totalQuestions || 0
    document.getElementById('todayCreated').textContent = stats.todayCreated || 0
    
    // Update subject breakdown
    const subjectBreakdown = document.getElementById('subjectBreakdown')
    if (subjectBreakdown && stats.bySubject) {
      subjectBreakdown.innerHTML = Object.entries(stats.bySubject)
        .map(([subject, count]) => `
          <div class="stat-item">
            <span class="subject-icon">${this.getSubjectIcon(subject)}</span>
            <span class="count">${count}</span>
          </div>
        `).join('')
    }
  }

  selectTemplate(templateType) {
    this.currentTemplate = templateType
    
    // Update UI
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.template === templateType)
    })
    
    // Setup form based on template
    this.setupFormForTemplate(templateType)
    
    // Switch to form view
    this.switchView('form')
    
    this.showToast(`${this.getTemplateName(templateType)}を選択しました`)
  }

  setupFormForTemplate(templateType) {
    const config = this.config.categories.formats.find(f => f.id === templateType)
    if (!config) return
    
    // Set answer format
    document.getElementById('answerFormat').value = templateType
    
    // Show/hide choice inputs
    const choiceSection = document.getElementById('choiceInputs')
    if (config.choices) {
      choiceSection.classList.remove('hidden')
      this.generateChoiceInputs(config.choices)
    } else {
      choiceSection.classList.add('hidden')
    }
    
    // Set default subject based on template
    const subjectMap = {
      'math-choice': 'math',
      'english-choice': 'english',
      'science-choice': 'chemistry'
    }
    if (subjectMap[templateType]) {
      document.getElementById('subject').value = subjectMap[templateType]
      this.updateTopicOptions()
    }
  }

  generateChoiceInputs(count) {
    const container = document.getElementById('choiceContainer')
    container.innerHTML = Array.from({ length: count }, (_, i) => `
      <div class="choice-input">
        <label>選択肢 ${i + 1}</label>
        <input type="text" 
          class="mobile-input" 
          placeholder="選択肢を入力"
          data-choice="${i}">
        ${i === 0 ? '<span class="correct-label">正解</span>' : ''}
      </div>
    `).join('')
    
    // Add correct answer selection
    container.querySelectorAll('.choice-input input').forEach((input, index) => {
      input.addEventListener('focus', () => {
        container.querySelectorAll('.correct-label').forEach(label => {
          label.style.display = 'none'
        })
        const label = input.parentElement.querySelector('.correct-label')
        if (label) label.style.display = 'block'
      })
    })
  }

  handleAnswerFormatChange(format) {
    const config = this.config.categories.formats.find(f => f.id === format)
    if (config && config.choices) {
      this.generateChoiceInputs(config.choices)
    }
  }

  detectLatexAndShowHelpers() {
    const text = document.getElementById('questionText').value
    const helpers = document.getElementById('latexHelpers')
    
    // Detect math patterns
    const mathPatterns = /[+\-*/=^(){}[\]\\]|x|y|sqrt|frac|sum|int|pi/g
    if (mathPatterns.test(text)) {
      helpers.classList.remove('hidden')
    } else {
      helpers.classList.add('hidden')
    }
  }

  insertLatex(latex) {
    const textarea = document.getElementById('questionText')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)
    
    const wrapped = selected ? `$${selected}$` : latex
    textarea.value = textarea.value.substring(0, start) + wrapped + textarea.value.substring(end)
    
    // Set cursor position
    const cursorPos = start + wrapped.length
    textarea.setSelectionRange(cursorPos, cursorPos)
    textarea.focus()
    
    // Update preview
    this.updatePreview()
  }

  updatePreview() {
    const text = document.getElementById('questionText').value
    const preview = document.getElementById('preview')
    
    if (text) {
      // Simple LaTeX rendering (can be enhanced with KaTeX)
      let rendered = text
        .replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>')
        .replace(/\$\$(.*?)\$\$/g, '<div class="math-block">$1</div>')
      
      preview.innerHTML = rendered
    } else {
      preview.innerHTML = '<p class="preview-placeholder">プレビューがここに表示されます</p>'
    }
  }

  async saveQuestion() {
    const formData = this.collectFormData()
    
    // Validate
    if (!this.validateQuestion(formData)) return
    
    // Save to local DB
    await saveQuestion(formData)
    
    // Queue for sync
    if (this.r2Storage) {
      await this.autoSync.queueForSync(formData)
    }
    
    // Show success message
    this.showToast('問題を保存しました')
    
    // Reset form
    this.resetForm()
    
    // Return to dashboard
    this.switchView('dashboard')
  }

  collectFormData() {
    const choices = []
    document.querySelectorAll('#choiceContainer input').forEach(input => {
      if (input.value) choices.push(input.value)
    })
    
    return {
      id: this.currentQuestion?.id || Date.now().toString(),
      subject: document.getElementById('subject').value,
      topic: document.getElementById('topic').value,
      difficulty: parseInt(document.getElementById('difficulty').value) || 1,
      answerFormat: document.getElementById('answerFormat').value,
      question: document.getElementById('questionText').value,
      choices: choices.length > 0 ? choices : undefined,
      correctAnswer: this.getCorrectAnswer(),
      explanation: document.getElementById('explanation').value,
      createdAt: this.currentQuestion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  getCorrectAnswer() {
    const format = document.getElementById('answerFormat').value
    
    if (['A1', 'A2', 'A3'].includes(format)) {
      // Find which choice is marked as correct
      const inputs = document.querySelectorAll('#choiceContainer input')
      for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].parentElement.querySelector('.correct-label')?.style.display !== 'none') {
          return i
        }
      }
    } else {
      return document.getElementById('correctAnswer').value
    }
    
    return 0
  }

  validateQuestion(question) {
    if (!question.subject) {
      this.showToast('教科を選択してください', 'error')
      return false
    }
    
    if (!question.question) {
      this.showToast('問題文を入力してください', 'error')
      return false
    }
    
    if (['A1', 'A2', 'A3'].includes(question.answerFormat) && (!question.choices || question.choices.length < 2)) {
      this.showToast('選択肢を2つ以上入力してください', 'error')
      return false
    }
    
    return true
  }

  async autoSave() {
    const draft = this.collectFormData()
    localStorage.setItem('questionDraft', JSON.stringify(draft))
  }

  loadDraft() {
    const draft = localStorage.getItem('questionDraft')
    if (draft) {
      const data = JSON.parse(draft)
      this.populateForm(data)
      localStorage.removeItem('questionDraft')
      this.showToast('下書きを読み込みました')
    }
  }

  populateForm(data) {
    document.getElementById('subject').value = data.subject || ''
    document.getElementById('topic').value = data.topic || ''
    document.getElementById('difficulty').value = data.difficulty || 1
    document.getElementById('answerFormat').value = data.answerFormat || 'A1'
    document.getElementById('questionText').value = data.question || ''
    document.getElementById('explanation').value = data.explanation || ''
    
    if (data.choices) {
      this.handleAnswerFormatChange(data.answerFormat)
      setTimeout(() => {
        data.choices.forEach((choice, i) => {
          const input = document.querySelector(`[data-choice="${i}"]`)
          if (input) input.value = choice
        })
      }, 100)
    }
    
    this.updatePreview()
  }

  resetForm() {
    document.getElementById('questionForm').reset()
    document.getElementById('choiceInputs').classList.add('hidden')
    this.updatePreview()
  }

  switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.add('hidden')
    })
    
    // Show selected view
    document.getElementById(`${viewName}View`).classList.remove('hidden')
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName)
    })
    
    this.currentView = viewName
    
    // Load view-specific data
    switch (viewName) {
      case 'dashboard':
        this.loadDashboard()
        break
      case 'search':
        document.getElementById('searchInput').focus()
        break
    }
  }

  async handleSearch(query) {
    if (!query) {
      document.getElementById('searchResults').innerHTML = 
        '<p class="no-results">検索語句を入力してください</p>'
      return
    }
    
    try {
      const results = await searchQuestions({ query })
      this.renderSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  renderSearchResults(results) {
    const container = document.getElementById('searchResults')
    
    if (results.length === 0) {
      container.innerHTML = '<p class="no-results">結果がありません</p>'
      return
    }
    
    container.innerHTML = results.map(q => `
      <div class="search-result" onclick="app.editQuestion('${q.id}')">
        <div class="result-header">
          <span class="subject-tag">${this.getSubjectIcon(q.subject)} ${this.getSubjectName(q.subject)}</span>
          <span class="format-tag">${q.answerFormat}</span>
        </div>
        <div class="result-content">${this.truncateText(q.question, 100)}</div>
      </div>
    `).join('')
  }

  updateSyncStatus() {
    const status = document.getElementById('syncStatus')
    if (status) {
      const isSynced = this.autoSync?.syncQueue.length === 0
      status.className = `sync-status ${isSynced ? 'synced' : 'syncing'}`
      status.textContent = isSynced ? '同期完了' : '同期待機中'
    }
  }

  handleOnline() {
    this.isOnline = true
    this.showToast('オンラインに接続しました')
    this.autoSync?.sync()
  }

  handleOffline() {
    this.isOnline = false
    this.showToast('オフラインモードです')
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.textContent = message
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.classList.add('show')
    }, 100)
    
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  // Helper methods
  getSubjectIcon(subject) {
    const icons = {
      math: '🔢',
      english: '🇺🇸',
      chemistry: '🧪',
      physics: '⚡',
      info: '💻',
      law: '⚖️'
    }
    return icons[subject] || '📝'
  }

  getSubjectName(subject) {
    const names = {
      math: '数学',
      english: '英語',
      chemistry: '化学',
      physics: '物理',
      info: '情報',
      law: '法学'
    }
    return names[subject] || subject
  }

  getTemplateName(template) {
    const names = {
      'math-choice': '数学4択問題',
      'english-choice': '英語4択問題',
      'science-choice': '理科4択問題',
      'free-text': '記述式問題'
    }
    return names[template] || template
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  isToday(dateString) {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
}

// Initialize the enhanced creator
const app = new EnhancedMobileCreator()
window.app = app
export default app