// サンプルデータ
window.SAMPLE_DATA = {
    // 語彙・意味選択問題
    vocab_meaning: [
        {
            id: 'vocab_001',
            type: 'vocab_meaning',
            word: 'perspective',
            options: ['視点', '遠近法', '展望', '観点'],
            correct: 3,
            difficulty: 3,
            explanation: 'perspectiveは「観点、視点」という意味です。',
            created: '2024-01-01',
            version: 1,
            status: 'published',
            tags: ['語彙', '抽象概念']
        },
        {
            id: 'vocab_002',
            type: 'vocab_meaning',
            word: 'sustainable',
            options: ['持続可能な', '持続不可能な', '安定した', '不安定な'],
            correct: 0,
            difficulty: 2,
            explanation: 'sustainableは「持続可能な」という意味です。',
            created: '2024-01-01',
            version: 1,
            status: 'published',
            tags: ['語彙', '環境']
        }
    ],
    
    // 語彙・空所補充問題
    vocab_fill: [
        {
            id: 'fill_001',
            type: 'vocab_fill',
            sentence: 'The company is committed to _____ development.',
            blank_word: 'sustainable',
            options: ['sustainable', 'rapid', 'slow', 'temporary'],
            correct: 0,
            difficulty: 2,
            explanation: '持続可能な開発という意味でsustainableが適切です。',
            created: '2024-01-01',
            version: 1,
            status: 'published',
            tags: ['語彙', '環境']
        }
    ],
    
    // 文法・下線部選択問題
    grammar_underline: [
        {
            id: 'grammar_001',
            type: 'grammar_underline',
            sentence: 'She <u>has been working</u> here for three years.',
            underline_part: 'has been working',
            options: ['現在完了進行形', '過去完了形', '現在進行形', '過去進行形'],
            correct: 0,
            difficulty: 3,
            explanation: 'has been workingは現在完了進行形です。',
            created: '2024-01-01',
            version: 1,
            status: 'published',
            tags: ['文法', '時制']
        }
    ],
    
    // 文法・語順並べ替え問題
    grammar_reorder: [
        {
            id: 'reorder_001',
            type: 'grammar_reorder',
            scrambled_words: ['have', 'you', 'lunch', 'had', '?'],
            correct_order: ['Have', 'you', 'had', 'lunch', '?'],
            difficulty: 2,
            explanation: '現在完了の疑問文です。',
            created: '2024-01-01',
            version: 1,
            status: 'published',
            tags: ['文法', '語順']
        }
    ],
    
    // 読解問題
    reading_comprehension: [
        {
            id: 'reading_001',
            type: 'reading_comprehension',
            passage: 'Environmental protection has become a global priority. Governments and organizations worldwide are implementing policies to reduce carbon emissions and promote sustainable practices. Individuals can contribute by making eco-friendly choices in their daily lives.',
            questions: [
                {
                    question: 'What is the main topic of the passage?',
                    options: ['Environmental protection', 'Government policies', 'Individual choices', 'Carbon emissions'],
                    correct: 0,
                    explanation: '文章全体で環境保護について述べています。'
                },
                {
                    question: 'How can individuals help according to the passage?',
                    options: ['By making eco-friendly choices', 'By implementing policies', 'By reducing carbon emissions', 'By promoting sustainability'],
                    correct: 0,
                    explanation: '個人の貢献方法としてエコフレンドリーな選択が挙げられています。'
                }
            ],
            source: 'Environmental Awareness',
            difficulty: 2,
            created: '2024-01-01',
            version: 1,
            status: 'published',
            tags: ['読解', '環境']
        }
    ],
    
    // 要約問題
    summary_short: [
        {
            id: 'summary_001',
            type: 'summary_short',
            passage: 'Remote work has become increasingly popular in recent years. Many companies have adopted flexible work arrangements, allowing employees to work from home or other locations. This trend has been accelerated by technological advancements and changing work preferences.',
            target_length: 50,
            sample_answer: '技術進歩と働き方の変化により、在宅勤務などの柔軟な働き方が普及している。',
            keywords: ['在宅勤務', '柔軟な働き方', '技術進歩'],
            difficulty: 3,
            created: '2024-01-01',
            version: 1,
            status: 'published',
            tags: ['要約', '社会']
        }
    ]
};

// サンプルデータをロードする関数
window.loadSampleData = function() {
    Object.keys(window.SAMPLE_DATA).forEach(type => {
        const questions = window.SAMPLE_DATA[type];
        questions.forEach(question => {
            const storageKey = window.CONFIG.STORAGE_PREFIX + 'questions_' + type;
            let existingQuestions = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // 重複チェック
            if (!existingQuestions.find(q => q.id === question.id)) {
                existingQuestions.push(question);
                localStorage.setItem(storageKey, JSON.stringify(existingQuestions));
            }
        });
    });
    
    // 統計データを初期化
    const stats = {
        totalQuestions: Object.values(window.SAMPLE_DATA).flat().length,
        questionsByType: {},
        lastUpdated: new Date().toISOString(),
        sampleDataLoaded: true
    };
    
    Object.keys(window.SAMPLE_DATA).forEach(type => {
        stats.questionsByType[type] = window.SAMPLE_DATA[type].length;
    });
    
    localStorage.setItem(window.CONFIG.STORAGE_PREFIX + 'statistics', JSON.stringify(stats));
    
    return true;
};