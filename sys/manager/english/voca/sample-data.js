// 語彙問題サンプルデータ
const sampleVocabQuestions = [
    {
        id: 1001,
        type: 'vocab',
        format: 'meaning',
        word: 'perspective',
        definition: '観点、視点、見方',
        example: 'From my perspective, this solution is the most efficient.',
        choices: ['観点', '解決策', '効率的', '最も'],
        difficulty: 3,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:00:00.000Z'
    },
    {
        id: 1002,
        type: 'vocab',
        format: 'meaning',
        word: 'sustainable',
        definition: '持続可能な、維持できる',
        example: 'We need to find sustainable energy sources for the future.',
        choices: ['持続可能な', 'エネルギー', '未来', '見つける'],
        difficulty: 4,
        estimatedTime: 1,
        points: 3,
        createdAt: '2024-01-15T10:05:00.000Z'
    },
    {
        id: 1003,
        type: 'vocab',
        format: 'fillblank',
        sentence: 'The company needs to ( ) its marketing strategy to reach younger customers.',
        answer: 'revise',
        translation: '会社は若い顧客に届けるためにマーケティング戦略を見直す必要がある。',
        choices: ['revise', 'maintain', 'ignore', 'cancel'],
        difficulty: 3,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:10:00.000Z'
    },
    {
        id: 1004,
        type: 'vocab',
        format: 'fillblank',
        sentence: 'Her ( ) to detail makes her an excellent researcher.',
        answer: 'attention',
        translation: '細部への注意力が彼女を優秀な研究者にしている。',
        choices: ['attention', 'ignorance', 'resistance', 'opposition'],
        difficulty: 4,
        estimatedTime: 1,
        points: 3,
        createdAt: '2024-01-15T10:15:00.000Z'
    },
    {
        id: 1005,
        type: 'vocab',
        format: 'meaning',
        word: 'innovative',
        definition: '革新的な、先進的な',
        example: 'This startup is known for its innovative approach to problem-solving.',
        choices: ['革新的な', 'スタートアップ', '問題解決', 'アプローチ'],
        difficulty: 3,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:20:00.000Z'
    },
    {
        id: 1006,
        type: 'vocab',
        format: 'meaning',
        word: 'collaborate',
        definition: '協力する、共同で作業する',
        example: 'The two companies decided to collaborate on a new project.',
        choices: ['協力する', '会社', 'プロジェクト', '決定する'],
        difficulty: 3,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:25:00.000Z'
    },
    {
        id: 1007,
        type: 'vocab',
        format: 'fillblank',
        sentence: 'The government announced new ( ) to address climate change.',
        answer: 'policies',
        translation: '政府は気候変動に対処するための新しい政策を発表した。',
        choices: ['policies', 'problems', 'weather', 'changes'],
        difficulty: 3,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:30:00.000Z'
    },
    {
        id: 1008,
        type: 'vocab',
        format: 'meaning',
        word: 'resilient',
        definition: '回復力のある、しなやかな',
        example: 'Children are often more resilient than adults in difficult situations.',
        choices: ['回復力のある', '子供', '状況', '大人'],
        difficulty: 4,
        estimatedTime: 1,
        points: 3,
        createdAt: '2024-01-15T10:35:00.000Z'
    },
    {
        id: 1009,
        type: 'vocab',
        format: 'fillblank',
        sentence: 'The team showed great ( ) when facing unexpected challenges.',
        answer: 'flexibility',
        translation: 'チームは予期せぬ挑戦に直面した際に大きな柔軟性を示した。',
        choices: ['flexibility', 'rigidity', 'confusion', 'failure'],
        difficulty: 3,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:40:00.000Z'
    },
    {
        id: 1010,
        type: 'vocab',
        format: 'meaning',
        word: 'significant',
        definition: '重要な、著しい',
        example: 'There has been a significant improvement in sales this quarter.',
        choices: ['重要な', '改善', '売上', '四半期'],
        difficulty: 2,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:45:00.000Z'
    },
    {
        id: 1011,
        type: 'vocab',
        format: 'fillblank',
        sentence: 'Scientists are trying to find a ( ) for this rare disease.',
        answer: 'cure',
        translation: '科学者たちはこの珍しい病気の治療法を見つけようとしている。',
        choices: ['cure', 'cause', 'symptom', 'patient'],
        difficulty: 3,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:50:00.000Z'
    },
    {
        id: 1012,
        type: 'vocab',
        format: 'meaning',
        word: 'efficient',
        definition: '効率的な、有能な',
        example: 'The new software is much more efficient than the old version.',
        choices: ['効率的な', 'ソフトウェア', 'バージョン', '新しい'],
        difficulty: 2,
        estimatedTime: 1,
        points: 2,
        createdAt: '2024-01-15T10:55:00.000Z'
    }
];

// 語彙問題をlocalStorageに保存
localStorage.setItem('vocabQuestions', JSON.stringify(sampleVocabQuestions));

console.log('語彙問題サンプルデータを保存しました（12問）');