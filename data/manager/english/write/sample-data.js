// 要約問題サンプルデータ
const sampleSummaryQuestions = [
    {
        id: 5001,
        type: 'summary',
        title: 'リモートワークの影響',
        sourceText: 'The COVID-19 pandemic has dramatically changed the way we work. Remote work, once considered a perk for select employees, has become mainstream. Companies worldwide have adapted to this new reality, investing in digital infrastructure and rethinking traditional office setups. Employees report increased flexibility and better work-life balance, but also face challenges such as isolation and blurred boundaries between work and personal life. Studies show that productivity has remained stable or even improved for many remote workers, though this varies by industry and individual circumstances. As we move forward, hybrid models that combine remote and in-office work are likely to become the new standard for many organizations.',
        instructions: '次の文章を100文字以内で要約しなさい。主要なポイントを含めて簡潔にまとめること。',
        targetLength: 100,
        sampleAnswer: 'パンデミックによりリモートワークが主流になり、企業はデジタル化を進めた。従業員は柔軟性とワークライフバランスの向上を感じる一方、孤立感などの課題もあり。生産性は安定し、ハイブリッドモデルが新標準になりそう。',
        source: 'Business Weekly Magazine',
        genre: 'business',
        difficulty: 3,
        estimatedTime: 15,
        points: 20,
        criteria: {
            mainPoints: true,
            concise: true,
            coherent: true,
            original: false,
            grammar: true
        },
        createdAt: '2024-01-15T14:00:00.000Z'
    },
    {
        id: 5002,
        type: 'summary',
        title: '人工知能の進化',
        sourceText: 'Artificial Intelligence has evolved rapidly over the past decade. Machine learning algorithms can now process vast amounts of data, recognize patterns, and make decisions with minimal human intervention. This technology is transforming industries from healthcare to finance, improving diagnostics, predicting market trends, and automating routine tasks. However, this progress raises important ethical questions about privacy, bias, and the future of employment. Experts argue that while AI will eliminate some jobs, it will also create new opportunities and change the nature of work itself. The key challenge lies in ensuring that AI development benefits humanity while minimizing potential risks.',
        instructions: '次の学術文章を150文字以内で要約しなさい。技術的進歩と社会的影響の両面を含めること。',
        targetLength: 150,
        sampleAnswer: 'AIは10年で急速に進化し、大量データ処理や意思決定が可能に。医療から金融まで幅広い産業を変革しているが、プライバシーや雇用への影響といった倫理的課題も生じている。専門家は、雇用を奪う一方で新たな機会も創出するとし、人類への利益とリスク最小化のバランスが重要と指摘。',
        source: 'Journal of Technology and Society',
        genre: 'academic',
        difficulty: 4,
        estimatedTime: 20,
        points: 25,
        criteria: {
            mainPoints: true,
            concise: true,
            coherent: true,
            original: true,
            grammar: true
        },
        createdAt: '2024-01-15T14:10:00.000Z'
    },
    {
        id: 5003,
        type: 'summary',
        title: '持続可能な都市開発',
        sourceText: 'Sustainable urban development focuses on creating cities that meet current needs without compromising future generations. This approach integrates environmental protection, economic growth, and social equity. Green spaces, renewable energy, and efficient public transportation are key components. Cities like Copenhagen and Singapore have demonstrated that sustainable practices can improve quality of life while reducing environmental impact. Community involvement is crucial, as residents must participate in planning and decision-making processes. The challenge lies in balancing development with conservation, and ensuring that the benefits of sustainability are shared equitably among all citizens.',
        instructions: '持続可能な都市開発の概念と実例について、50文字以内で要約しなさい。',
        targetLength: 50,
        sampleAnswer: '持続可能な都市開発は、環境保護と経済成長、社会公平を統合し、将来世代を犠牲にせず現在のニーズを満たすアプローチ。',
        source: 'Urban Planning Review',
        genre: 'academic',
        difficulty: 4,
        estimatedTime: 12,
        points: 18,
        criteria: {
            mainPoints: true,
            concise: true,
            coherent: true,
            original: false,
            grammar: true
        },
        createdAt: '2024-01-15T14:20:00.000Z'
    },
    {
        id: 5004,
        type: 'summary',
        title: 'デジタル教育の変革',
        sourceText: 'Digital technology is revolutionizing education. Online learning platforms, interactive applications, and virtual reality are transforming how students learn. These tools offer personalized learning experiences, allowing students to progress at their own pace. Teachers can track progress more effectively and provide targeted support. However, the digital divide remains a significant challenge, as not all students have equal access to technology. Successful implementation requires teacher training, technical support, and thoughtful integration of digital tools with traditional teaching methods. The goal is not to replace teachers but to enhance their ability to educate and inspire students.',
        instructions: 'デジタル技術が教育に与える影響について200文字以内で要約しなさい。利点と課題の両方を含めること。',
        targetLength: 200,
        sampleAnswer: 'デジタル技術が教育を変革中で、オンラインプラットフォームやVRなどが学習方法を変えている。個別学習や教師の効果的なサポートが可能になる一方、デジタル格差が課題。成功には教師研修と伝統的教授法との統合が必要で、目標は教師の能力向上であり、置き換えではない。',
        source: 'Education Today',
        genre: 'news',
        difficulty: 3,
        estimatedTime: 18,
        points: 22,
        criteria: {
            mainPoints: true,
            concise: true,
            coherent: true,
            original: true,
            grammar: true
        },
        createdAt: '2024-01-15T14:30:00.000Z'
    },
    {
        id: 5005,
        type: 'summary',
        title: '健康食生活の重要性',
        sourceText: 'A balanced diet is essential for maintaining good health and preventing chronic diseases. Fresh fruits, vegetables, whole grains, and lean proteins provide necessary nutrients while limiting processed foods reduces sugar and sodium intake. Regular meal timing and proper hydration also contribute to overall wellness. Nutritionists recommend eating a variety of colorful foods to ensure diverse vitamin and mineral intake. Small, sustainable changes to eating habits are more effective than drastic diets. Reading food labels, cooking at home more often, and being mindful of portion sizes are practical steps toward healthier eating.',
        instructions: '健康食生活の重要性と実践方法について、100文字以内で要約しなさい。',
        targetLength: 100,
        sampleAnswer: 'バランスの取れた食事は健康維持と慢性病予防に不可欠。新鮮な果物、野菜、全粒穀物、赤身のタンパク質を摂り、加工食品を制限することが大切。規則正しい食事時間と水分補給も重要で、食品ラベルの確認や自炊などが実践的な方法。',
        source: 'Health and Wellness Guide',
        genre: 'general',
        difficulty: 2,
        estimatedTime: 10,
        points: 15,
        criteria: {
            mainPoints: true,
            concise: true,
            coherent: true,
            original: false,
            grammar: true
        },
        createdAt: '2024-01-15T14:40:00.000Z'
    }
];

// 要約問題をlocalStorageに保存
localStorage.setItem('summaryQuestions', JSON.stringify(sampleSummaryQuestions));

console.log('要約問題サンプルデータを保存しました（5問）');