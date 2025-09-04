// 設定ファイル
window.CONFIG = {
    // 基本設定
    APP_NAME: '問題管理作成システム',
    VERSION: '1.0.0',
    DEBUG: false,
    
    // データ設定
    STORAGE_PREFIX: 'qm_',
    AUTO_SAVE: true,
    AUTO_SAVE_INTERVAL: 30000, // 30秒
    
    // 問題タイプ
    QUESTION_TYPES: {
        VOCAB_MEANING: 'vocab_meaning',
        VOCAB_FILL: 'vocab_fill',
        GRAMMAR_UNDERLINE: 'grammar_underline',
        GRAMMAR_REORDER: 'grammar_reorder',
        READING_COMPREHENSION: 'reading_comprehension',
        LISTENING_COMPREHENSION: 'listening_comprehension',
        SUMMARY_SHORT: 'summary_short',
        SUMMARY_MEDIUM: 'summary_medium',
        SUMMARY_LONG: 'summary_long'
    },
    
    // 科目
    SUBJECTS: {
        ENGLISH: 'english',
        CHEMISTRY: 'chemistry',
        MATH: 'math',
        PHYSICS: 'physics'
    },
    
    // 難易度
    DIFFICULTY_LEVELS: {
        1: '初級',
        2: '中級',
        3: '上級',
        4: '最上級'
    },
    
    // 表示設定
    ITEMS_PER_PAGE: 10,
    MAX_RECENT_ITEMS: 5,
    
    // UI設定
    THEME: 'light',
    ANIMATION_SPEED: 300,
    
    // エクスポート設定
    EXPORT_FORMATS: ['json', 'csv', 'txt'],
    
    // 統計設定
    TRACK_USER_ACTIONS: true,
    SAVE_STATISTICS: true
};