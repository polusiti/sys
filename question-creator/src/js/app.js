// Main Application Class
import { initDB, saveQuestion, getQuestions, searchQuestions } from './db.js'
import { renderLatex } from './latex.js'
import { setupOfflineSync } from './sync.js'

class QuestionCreatorApp {
  constructor() {
    this.currentView = 'dashboard'
    this.currentQuestion = null
    this.isOnline = navigator.onLine
    this.init()
  }

  async init() {
    // Initialize IndexedDB
    await initDB()
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Setup offline sync
    setupOfflineSync()
    
    // Load initial data
    await this.loadDashboard()
    
    // Check online status
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Setup auto-save
    this.setupAutoSave()
  }

  setupEventListeners() {
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view
        this.switchView(view)
      })
    })

    // Search button
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.switchView('search')
    })

    // Form submission
    document.getElementById('questionForm').addEventListener('submit', (e) => {
      e.preventDefault()
      this.saveQuestion()
    })

    // Answer format change
    document.getElementById('answerFormat').addEventListener('change', (e) => {
      this.handleAnswerFormatChange(e.target.value)
    })

    // Real-time preview
    document.getElementById('questionText').addEventListener('input', () => {
      this.updatePreview()
    })

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.handleSearch(e.target.value)
    })

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
        chip.classList.add('active')
        this.handleSearch(document.getElementById('searchInput').value, chip.dataset.filter)
      })
    })
  }

  async loadDashboard() {
    try {
      // Load stats
      const stats = await this.getStats()
      document.getElementById('totalQuestions').textContent = stats.total
      document.getElementById('todayCreated').textContent = stats.today

      // Load recent questions
      const recent = await getQuestions({ limit: 5 })
      this.renderRecentQuestions(recent)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  async getStats() {
    // Get stats from local storage or API
    const cached = localStorage.getItem('questionStats')
    if (cached) {
      return JSON.parse(cached)
    }

    // Fetch from API if online
    if (this.isOnline) {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        if (data.success) {
          localStorage.setItem('questionStats', JSON.stringify(data.stats))
          return data.stats
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    // Default stats
    return { total: 0, today: 0, bySubject: {} }
  }

  renderRecentQuestions(questions) {
    const container = document.getElementById('recentQuestions')
    
    if (questions.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">問題がありません</p>'
      return
    }

    container.innerHTML = questions.map(q => `
      <div class="mobile-card" onclick="app.editQuestion('${q.id}')">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-medium text-gray-800">${this.truncateText(q.question, 50)}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">${this.getSubjectLabel(q.subject)}</span>
              <span class="text-xs text-gray-500">${q.answerFormat}</span>
            </div>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>
    `).join('')
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

  showCreateForm() {
    this.currentQuestion = null
    document.getElementById('questionForm').reset()
    this.handleAnswerFormatChange('')
    this.switchView('form')
  }

  async editQuestion(id) {
    try {
      const question = await this.getQuestion(id)
      if (question) {
        this.currentQuestion = question
        this.populateForm(question)
        this.switchView('form')
      }
    } catch (error) {
      console.error('Failed to load question:', error)
    }
  }

  populateForm(question) {
    document.getElementById('subject').value = question.subject || ''
    document.getElementById('topic').value = question.topic || ''
    document.getElementById('answerFormat').value = question.answerFormat || ''
    document.getElementById('questionText').value = question.question || ''
    document.getElementById('correctAnswer').value = question.correctAnswer || ''
    document.getElementById('explanation').value = question.explanation || ''
    
    this.handleAnswerFormatChange(question.answerFormat)
    this.updatePreview()
  }

  handleAnswerFormatChange(format) {
    const choicesSection = document.getElementById('choicesSection')
    const container = document.getElementById('choicesContainer')
    
    if (['A1', 'A2', 'A3'].includes(format)) {
      choicesSection.classList.remove('hidden')
      const choiceCount = format === 'A1' ? 4 : format === 'A2' ? 6 : 9
      
      container.innerHTML = Array.from({ length: choiceCount }, (_, i) => `
        <input type="text" class="field-input" placeholder="選択肢 ${i + 1}" data-choice="${i}">
      `).join('')
    } else {
      choicesSection.classList.add('hidden')
    }
  }

  updatePreview() {
    const questionText = document.getElementById('questionText').value
    const preview = document.getElementById('preview')
    
    if (questionText) {
      const rendered = renderLatex(questionText)
      preview.innerHTML = `<div class="question-preview">${rendered}</div>`
    } else {
      preview.innerHTML = '<p class="text-gray-500">プレビューがここに表示されます</p>'
    }
  }

  async saveQuestion() {
    const formData = new FormData(document.getElementById('questionForm'))
    const question = {
      id: this.currentQuestion?.id || Date.now().toString(),
      subject: document.getElementById('subject').value,
      topic: document.getElementById('topic').value,
      answerFormat: document.getElementById('answerFormat').value,
      question: document.getElementById('questionText').value,
      correctAnswer: document.getElementById('correctAnswer').value,
      explanation: document.getElementById('explanation').value,
      createdAt: this.currentQuestion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add choices if applicable
    if (['A1', 'A2', 'A3'].includes(question.answerFormat)) {
      const choices = []
      document.querySelectorAll('#choicesContainer input').forEach(input => {
        if (input.value) choices.push(input.value)
      })
      question.choices = choices
    }

    try {
      // Save to IndexedDB
      await saveQuestion(question)
      
      // Sync to server if online
      if (this.isOnline) {
        await this.syncToServer(question)
      }

      // Show success message
      this.showToast('問題を保存しました', 'success')
      
      // Return to dashboard
      this.switchView('dashboard')
    } catch (error) {
      console.error('Failed to save question:', error)
      this.showToast('保存に失敗しました', 'error')
    }
  }

  async syncToServer(question) {
    try {
      const response = await fetch(`/api/questions/${question.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(question)
      })
      
      if (!response.ok) {
        throw new Error('Sync failed')
      }
    } catch (error) {
      console.error('Failed to sync to server:', error)
      // Queue for later sync
      this.queueForSync(question)
    }
  }

  async handleSearch(query, filter = 'all') {
    if (!query && filter === 'all') {
      document.getElementById('searchResults').innerHTML = 
        '<p class="text-gray-500 text-center py-4">検索語句を入力してください</p>'
      return
    }

    try {
      const results = await searchQuestions({ query, subject: filter === 'all' ? null : filter })
      this.renderSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  renderSearchResults(results) {
    const container = document.getElementById('searchResults')
    
    if (results.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">結果がありません</p>'
      return
    }

    container.innerHTML = results.map(q => `
      <div class="mobile-card" onclick="app.editQuestion('${q.id}')">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-medium text-gray-800">${this.truncateText(q.question, 100)}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">${this.getSubjectLabel(q.subject)}</span>
              <span class="text-xs text-gray-500">${q.topic || ''}</span>
            </div>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>
    `).join('')
  }

  setupAutoSave() {
    let saveTimeout
    const form = document.getElementById('questionForm')
    
    form.addEventListener('input', () => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        if (this.currentView === 'form') {
          this.saveDraft()
        }
      }, 2000) // Auto-save after 2 seconds of inactivity
    })
  }

  saveDraft() {
    const draft = {
      subject: document.getElementById('subject').value,
      topic: document.getElementById('topic').value,
      answerFormat: document.getElementById('answerFormat').value,
      question: document.getElementById('questionText').value,
      correctAnswer: document.getElementById('correctAnswer').value,
      explanation: document.getElementById('explanation').value
    }
    
    localStorage.setItem('questionDraft', JSON.stringify(draft))
  }

  loadDraft() {
    const draft = localStorage.getItem('questionDraft')
    if (draft) {
      const data = JSON.parse(draft)
      this.populateForm(data)
      localStorage.removeItem('questionDraft')
    }
  }

  handleOnline() {
    this.isOnline = true
    this.showToast('オンラインに接続しました', 'success')
    // Sync queued items
    this.syncQueuedItems()
  }

  handleOffline() {
    this.isOnline = false
    this.showToast('オフラインモードです', 'warning')
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`
    toast.textContent = message
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  getSubjectLabel(subject) {
    const labels = {
      math: '数学',
      english: '英語',
      chemistry: '化学',
      physics: '物理',
      info: '情報',
      law: '法学'
    }
    return labels[subject] || subject
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  insertLatex() {
    const textarea = document.getElementById('questionText')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)
    
    const latex = selected ? `$${selected}$` : '$$'
    
    textarea.value = textarea.value.substring(0, start) + latex + textarea.value.substring(end)
    textarea.focus()
    textarea.setSelectionRange(start + latex.length, start + latex.length)
    
    this.updatePreview()
  }
}

// Initialize app
const app = new QuestionCreatorApp()
export default app