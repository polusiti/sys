// サンプル問題データ
const sampleQuestions = [
    // 多肢選択問題
    {
        id: 1,
        type: 'multiple',
        difficulty: 'medium',
        category: 'grammar',
        text: '次のうち、正しい文法はどれですか？',
        choices: ['I goes to school.', 'I go to school.', 'I going to school.', 'I gone to school.'],
        correctAnswer: 1,
        points: 2,
        explanation: '現在形の三人称単数形は "goes" ですが、主語が "I" の場合は "go" になります。',
        createdAt: '2024-01-15T10:00:00.000Z'
    },
    {
        id: 2,
        type: 'multiple',
        difficulty: 'easy',
        category: 'vocabulary',
        text: '「perspective」の意味として最も適切なものはどれですか？',
        choices: ['観点、視点', '解決策', '効率的', '最も'],
        correctAnswer: 0,
        points: 1,
        explanation: 'perspective = 観点、視点、見方',
        createdAt: '2024-01-15T11:00:00.000Z'
    },
    
    // 穴埋め問題
    {
        id: 3,
        type: 'fillblank',
        difficulty: 'medium',
        field: 'grammar',
        text: 'I _____ been studying English for three years.',
        blankCount: 1,
        correctAnswer: ['have'],
        wrongAnswers: ['has', 'had', 'having'],
        points: 2,
        explanation: '現在完了形の構文は "have + 過去分詞" です。',
        createdAt: '2024-01-15T12:00:00.000Z'
    },
    {
        id: 4,
        type: 'fillblank',
        difficulty: 'hard',
        field: 'vocabulary',
        text: 'The company needs to _____ its marketing strategy to reach younger audiences.',
        blankCount: 1,
        correctAnswer: ['revitalize', 'revamp', 'rejuvenate'],
        wrongAnswers: ['maintain', 'reduce', 'eliminate'],
        points: 3,
        hint: '「若い視聴者に届けるために」という文脈から、戦略を「活性化させる」必要があります。',
        explanation: 'revitalize = 活性化させる、復活させる。マーケティング戦略を新しくするという文脈で適切です。',
        createdAt: '2024-01-15T13:00:00.000Z'
    },
    
    // 短答問題
    {
        id: 5,
        type: 'shortanswer',
        difficulty: 'medium',
        subject: 'programming',
        text: 'HTMLでリンクを作成するために使用するタグは何ですか？',
        correctAnswer: 'a',
        alternatives: ['<a>', 'anchor', 'link'],
        points: 2,
        explanation: 'HTMLでハイパーリンクを作成するには <a> タグを使用します。',
        createdAt: '2024-01-15T14:00:00.000Z'
    },
    
    // 論述問題
    {
        id: 6,
        type: 'essay',
        difficulty: 'hard',
        topic: 'environment',
        text: '気候変動に対処するために、個人レベルでできる具体的な対策を3つ挙げ、それぞれの効果について説明してください。',
        minWords: 200,
        maxWords: 500,
        points: 10,
        criteria: [
            '対策の具体性',
            '効果の説明',
            '論理的な構成',
            '表現の適切性'
        ],
        createdAt: '2024-01-15T15:00:00.000Z'
    },
    
    // 組み合わせ問題
    {
        id: 7,
        type: 'matching',
        difficulty: 'medium',
        category: 'vocabulary',
        instructions: '左側の英単語と右側の日本語訳を正しく組み合わせてください。',
        leftItems: ['innovation', 'sustainability', 'collaboration', 'efficiency'],
        rightItems: ['持続可能性', '効率性', '革新', '協力'],
        correctPairs: [
            {left: 'innovation', right: '革新'},
            {left: 'sustainability', right: '持続可能性'},
            {left: 'collaboration', right: '協力'},
            {left: 'efficiency', right: '効率性'}
        ],
        points: 4,
        createdAt: '2024-01-15T16:00:00.000Z'
    }
];

// 問題タイプ別のサンプルデータをエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sampleQuestions;
} else {
    window.sampleQuestions = sampleQuestions;
}