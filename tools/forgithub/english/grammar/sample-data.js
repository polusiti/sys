// 文法問題サンプルデータ
const sampleGrammarQuestions = [
    {
        id: 2001,
        type: 'grammar',
        format: 'underline',
        sentence: 'I ___ been studying English for three years.',
        choices: ['have', 'has', 'had', 'having'],
        difficulty: 2,
        estimatedTime: 2,
        points: 2,
        createdAt: '2024-01-15T11:00:00.000Z'
    },
    {
        id: 2002,
        type: 'grammar',
        format: 'underline',
        sentence: 'If I ___ rich, I would travel around the world.',
        choices: ['were', 'am', 'is', 'been'],
        difficulty: 3,
        estimatedTime: 2,
        points: 3,
        createdAt: '2024-01-15T11:05:00.000Z'
    },
    {
        id: 2003,
        type: 'grammar',
        format: 'reorder',
        words: 'I, to, the, library, go, every, Sunday',
        correctOrder: 'I go to the library every Sunday',
        difficulty: 2,
        estimatedTime: 3,
        points: 3,
        createdAt: '2024-01-15T11:10:00.000Z'
    },
    {
        id: 2004,
        type: 'grammar',
        format: 'reorder',
        words: 'The, weather, yesterday, was, beautiful, so, we, went, hiking',
        correctOrder: 'The weather was beautiful yesterday so we went hiking',
        difficulty: 3,
        estimatedTime: 3,
        points: 4,
        createdAt: '2024-01-15T11:15:00.000Z'
    },
    {
        id: 2005,
        type: 'grammar',
        format: 'choice4',
        question: 'Choose the correct sentence:',
        choices: [
            'She enjoys reading books in her free time.',
            'She enjoy reading books in her free time.',
            'She enjoys read books in her free time.',
            'She enjoying reading books in her free time.'
        ],
        difficulty: 3,
        estimatedTime: 2,
        points: 3,
        createdAt: '2024-01-15T11:20:00.000Z'
    },
    {
        id: 2006,
        type: 'grammar',
        format: 'choice5',
        question: 'Which sentence uses the passive voice correctly?',
        choices: [
            'The book was written by Shakespeare.',
            'Shakespeare wrote the book.',
            'The book has written by Shakespeare.',
            'Shakespeare was writing the book.',
            'The book wrote by Shakespeare.'
        ],
        difficulty: 4,
        estimatedTime: 3,
        points: 4,
        createdAt: '2024-01-15T11:25:00.000Z'
    },
    {
        id: 2007,
        type: 'grammar',
        format: 'underline',
        sentence: 'Neither my brother nor I ___ going to the party.',
        choices: ['am', 'is', 'are', 'be'],
        difficulty: 3,
        estimatedTime: 2,
        points: 3,
        createdAt: '2024-01-15T11:30:00.000Z'
    },
    {
        id: 2008,
        type: 'grammar',
        format: 'underline',
        sentence: 'By the time we arrived, the movie ___ already started.',
        choices: ['has', 'had', 'have', 'having'],
        difficulty: 3,
        estimatedTime: 2,
        points: 3,
        createdAt: '2024-01-15T11:35:00.000Z'
    },
    {
        id: 2009,
        type: 'grammar',
        format: 'underline',
        sentence: 'I wish I ___ speak French fluently.',
        choices: ['can', 'could', 'will', 'would'],
        difficulty: 3,
        estimatedTime: 2,
        points: 3,
        createdAt: '2024-01-15T11:40:00.000Z'
    },
    {
        id: 2010,
        type: 'grammar',
        format: 'reorder',
        words: 'She, has, been, working, on, this, project, since, January',
        correctOrder: 'She has been working on this project since January',
        difficulty: 3,
        estimatedTime: 3,
        points: 4,
        createdAt: '2024-01-15T11:45:00.000Z'
    },
    {
        id: 2011,
        type: 'grammar',
        format: 'choice4',
        question: 'Choose the correct question tag:',
        sentence: 'You\'re coming with us, ___?',
        choices: ['aren\'t you', 'don\'t you', 'won\'t you', 'haven\'t you'],
        difficulty: 3,
        estimatedTime: 2,
        points: 3,
        createdAt: '2024-01-15T11:50:00.000Z'
    },
    {
        id: 2012,
        type: 'grammar',
        format: 'choice5',
        question: 'Which sentence contains a relative clause?',
        choices: [
            'The man who lives next door is a doctor.',
            'The man lives next door is a doctor.',
            'The man he lives next door is a doctor.',
            'The man which lives next door is a doctor.',
            'The man that his lives next door is a doctor.'
        ],
        difficulty: 4,
        estimatedTime: 3,
        points: 4,
        createdAt: '2024-01-15T11:55:00.000Z'
    },
    {
        id: 2013,
        type: 'grammar',
        format: 'underline',
        sentence: 'If I ___ known about the traffic, I would have left earlier.',
        choices: ['have', 'had', 'would have', 'could have'],
        difficulty: 4,
        estimatedTime: 2,
        points: 4,
        createdAt: '2024-01-15T12:00:00.000Z'
    }
];

// 文法問題をlocalStorageに保存
localStorage.setItem('grammarQuestions', JSON.stringify(sampleGrammarQuestions));

console.log('文法問題サンプルデータを保存しました（13問）');