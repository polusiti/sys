// 問題タイプ定義
window.QUESTION_TYPES = {
    // 語彙問題
    vocab_meaning: {
        name: '語彙・意味選択',
        description: '単語の意味を選択する問題',
        fields: [
            { name: 'word', type: 'text', label: '単語', required: true },
            { name: 'options', type: 'array', label: '選択肢', required: true, min: 4, max: 6 },
            { name: 'correct', type: 'number', label: '正解番号', required: true, min: 1 },
            { name: 'explanation', type: 'textarea', label: '解説', required: false }
        ],
        difficulty: [1, 2, 3, 4],
        subject: 'english'
    },
    
    vocab_fill: {
        name: '語彙・空所補充',
        description: '空所に適切な単語を入れる問題',
        fields: [
            { name: 'sentence', type: 'text', label: '英文', required: true },
            { name: 'blank_word', type: 'text', label: '空所の単語', required: true },
            { name: 'options', type: 'array', label: '選択肢', required: true, min: 4, max: 6 },
            { name: 'correct', type: 'number', label: '正解番号', required: true, min: 1 },
            { name: 'explanation', type: 'textarea', label: '解説', required: false }
        ],
        difficulty: [1, 2, 3, 4],
        subject: 'english'
    },
    
    // 文法問題
    grammar_underline: {
        name: '文法・下線部選択',
        description: '下線部の文法要素を選択する問題',
        fields: [
            { name: 'sentence', type: 'text', label: '英文', required: true },
            { name: 'underline_part', type: 'text', label: '下線部', required: true },
            { name: 'options', type: 'array', label: '選択肢', required: true, min: 4, max: 6 },
            { name: 'correct', type: 'number', label: '正解番号', required: true, min: 1 },
            { name: 'explanation', type: 'textarea', label: '解説', required: false }
        ],
        difficulty: [2, 3, 4],
        subject: 'english'
    },
    
    grammar_reorder: {
        name: '文法・語順並べ替え',
        description: '単語を正しい順番に並べ替える問題',
        fields: [
            { name: 'scrambled_words', type: 'array', label: '単語リスト', required: true, min: 4 },
            { name: 'correct_order', type: 'array', label: '正解順序', required: true },
            { name: 'explanation', type: 'textarea', label: '解説', required: false }
        ],
        difficulty: [2, 3, 4],
        subject: 'english'
    },
    
    // 読解問題
    reading_comprehension: {
        name: '読解問題',
        description: '長文読解と設問',
        fields: [
            { name: 'passage', type: 'textarea', label: '本文', required: true },
            { name: 'questions', type: 'array', label: '設問', required: true, min: 1 },
            { name: 'source', type: 'text', label: '出典', required: false },
            { name: 'difficulty', type: 'number', label: '難易度', required: true, min: 1, max: 4 }
        ],
        difficulty: [2, 3, 4],
        subject: 'english'
    },
    
    // リスニング問題
    listening_comprehension: {
        name: 'リスニング問題',
        description: '音声を聞いて答える問題',
        fields: [
            { name: 'audio_url', type: 'text', label: '音声URL', required: true },
            { name: 'transcript', type: 'textarea', label: '文字起こし', required: true },
            { name: 'questions', type: 'array', label: '設問', required: true, min: 1 },
            { name: 'difficulty', type: 'number', label: '難易度', required: true, min: 1, max: 4 }
        ],
        difficulty: [2, 3, 4],
        subject: 'english'
    },
    
    // 要約問題
    summary_short: {
        name: '要約問題（短）',
        description: '50字以内で要約する問題',
        fields: [
            { name: 'passage', type: 'textarea', label: '本文', required: true },
            { name: 'target_length', type: 'number', label: '目標字数', required: true, default: 50 },
            { name: 'sample_answer', type: 'textarea', label: '模範解答', required: false },
            { name: 'keywords', type: 'array', label: 'キーワード', required: false }
        ],
        difficulty: [2, 3, 4],
        subject: 'english'
    },
    
    summary_medium: {
        name: '要約問題（中）',
        description: '100字以内で要約する問題',
        fields: [
            { name: 'passage', type: 'textarea', label: '本文', required: true },
            { name: 'target_length', type: 'number', label: '目標字数', required: true, default: 100 },
            { name: 'sample_answer', type: 'textarea', label: '模範解答', required: false },
            { name: 'keywords', type: 'array', label: 'キーワード', required: false }
        ],
        difficulty: [3, 4],
        subject: 'english'
    },
    
    summary_long: {
        name: '要約問題（長）',
        description: '200字以内で要約する問題',
        fields: [
            { name: 'passage', type: 'textarea', label: '本文', required: true },
            { name: 'target_length', type: 'number', label: '目標字数', required: true, default: 200 },
            { name: 'sample_answer', type: 'textarea', label: '模範解答', required: false },
            { name: 'keywords', type: 'array', label: 'キーワード', required: false }
        ],
        difficulty: [3, 4],
        subject: 'english'
    }
};

// ヘルパー関数
window.getQuestionType = function(typeKey) {
    return window.QUESTION_TYPES[typeKey] || null;
};

window.getAllQuestionTypes = function() {
    return Object.keys(window.QUESTION_TYPES);
};

window.getQuestionTypesBySubject = function(subject) {
    return Object.keys(window.QUESTION_TYPES).filter(key => 
        window.QUESTION_TYPES[key].subject === subject
    );
};