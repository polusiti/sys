// 読解問題サンプルデータ
const sampleReadingQuestions = [
    {
        id: 3001,
        type: 'reading',
        title: '環境保護の重要性',
        passage: 'Environmental protection has become one of the most pressing issues of our time. Climate change, pollution, and loss of biodiversity are threatening ecosystems worldwide. Individuals can contribute to environmental protection by reducing waste, conserving energy, and supporting sustainable practices. Governments and businesses also play crucial roles in implementing policies and technologies that minimize environmental damage.',
        passageTitle: 'The Importance of Environmental Protection',
        source: 'Environmental Science Textbook',
        readingType: 'short',
        difficulty: 3,
        estimatedTime: 10,
        points: 12,
        questions: [
            {
                number: 1,
                text: '本文で述べられている3つの主要な環境問題は何ですか？',
                answer: '気候変動、汚染、生物多様性の損失',
                explanation: '本文で明示的に述べられている3つの脅威です。'
            },
            {
                number: 2,
                text: '個人が環境保護に貢献できる方法は何ですか？',
                answer: '廃棄物の削減、エネルギーの節約、持続可能な慣行の支援',
                explanation: '本文に具体的な行動として挙げられています。'
            },
            {
                number: 3,
                text: '政府と企業の役割は何ですか？',
                answer: '環境被害を最小限に抑える政策と技術を実施すること',
                explanation: '本文の最後にその役割が述べられています。'
            }
        ],
        createdAt: '2024-01-15T12:00:00.000Z'
    },
    {
        id: 3002,
        type: 'reading',
        title: '技術と教育',
        passage: 'TOKYO, JAPAN - A recent study conducted by the Japanese Ministry of Education has revealed that schools implementing technology-based learning methods have shown significant improvements in student performance. The study, which analyzed data from over 500 schools across the country, found that students in technology-equipped classrooms scored an average of 15% higher on standardized tests.\n\nThe research focused on schools that had integrated tablets, interactive whiteboards, and educational software into their curriculum. Teachers reported increased student engagement and more personalized learning experiences. However, the study also noted challenges such as technical issues and the need for additional teacher training.\n\nEducation experts believe that while technology can enhance learning, it should complement traditional teaching methods rather than replace them entirely. The Ministry plans to expand the program to more schools in the coming academic year.',
        passageTitle: 'Technology Boosts Student Performance in Japanese Schools',
        source: 'Tokyo Education News',
        readingType: 'news',
        difficulty: 4,
        estimatedTime: 15,
        points: 20,
        questions: [
            {
                number: 1,
                text: '研究によると、技術を導入した教室の生徒はテストで何%高いスコアを示しましたか？',
                answer: '15%高い',
                explanation: '本文に具体的な数値が記載されています。'
            },
            {
                number: 2,
                text: 'この研究では何校のデータを分析しましたか？',
                answer: '500校以上',
                explanation: '本文で分析した学校数が述べられています。'
            },
            {
                number: 3,
                text: '教室に統合された具体的な技術は何ですか？',
                answer: 'タブレット、インタラクティブなホワイトボード、教育ソフトウェア',
                explanation: '具体的な技術が3つ挙げられています。'
            },
            {
                number: 4,
                text: '研究で指摘された課題は何ですか？',
                answer: '技術的な問題と追加の教師研修の必要性',
                explanation: '課題として2つの点が挙げられています。'
            },
            {
                number: 5,
                text: '教育専門家は技術についてどのように考えていますか？',
                answer: '技術は学習を強化できるが、従来の教育方法を補完すべきで、完全に置き換えるべきではない',
                explanation: '専門家の見解が本文の最後に述べられています。'
            }
        ],
        createdAt: '2024-01-15T12:10:00.000Z'
    },
    {
        id: 3003,
        type: 'reading',
        title: '面接の会話',
        passage: 'Sarah: Good morning! Thank you for coming in today. I\'m Sarah, the HR manager.\nMike: Good morning, Sarah. Thank you for having me. I\'m Mike Johnson.\nSarah: Let\'s start by telling me a bit about your experience in software development.\nMike: I\'ve been working as a software developer for five years, primarily focusing on web applications.\nSarah: That\'s impressive. What programming languages are you most comfortable with?\nMike: I\'m most proficient in Java and Python, but I also have experience with JavaScript and C++.\nSarah: Great! Why are you interested in joining our company?\nMike: I\'ve been following your company\'s innovative projects and I\'m excited about the opportunity to contribute.',
        passageTitle: 'Job Interview Conversation',
        source: 'Business English Sample',
        readingType: 'dialogue',
        difficulty: 3,
        estimatedTime: 8,
        points: 10,
        questions: [
            {
                number: 1,
                text: 'サラの役職は何ですか？',
                answer: 'HRマネージャー',
                explanation: 'サラが自己紹介した際に明言されています。'
            },
            {
                number: 2,
                text: 'マイクはソフトウェア開発者として何年経験がありますか？',
                answer: '5年',
                explanation: 'マイクが直接経験年数を述べています。'
            },
            {
                number: 3,
                text: 'マイクが最も得意なプログラミング言語は何ですか？',
                answer: 'JavaとPython',
                explanation: 'マイクが最も習熟している言語として挙げています。'
            },
            {
                number: 4,
                text: 'なぜマイクはこの会社に興味を持っていますか？',
                answer: '会社の革新的なプロジェクトを追っており、貢献する機会に興奮しているから',
                explanation: 'マイクの最後の発言に理由が述べられています。'
            }
        ],
        createdAt: '2024-01-15T12:20:00.000Z'
    }
];

// 読解問題をlocalStorageに保存
localStorage.setItem('readingQuestions', JSON.stringify(sampleReadingQuestions));

console.log('読解問題サンプルデータを保存しました（3問）');