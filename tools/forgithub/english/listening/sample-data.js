// リスニング問題サンプルデータ
const sampleListeningQuestions = [
    {
        id: 4001,
        type: 'listening',
        setTitle: '天気の会話',
        setDescription: '友人同士の天気についてのカジュアルな会話です',
        audioFile: {
            name: 'weather-conversation.mp3',
            size: 2.5,
            type: 'audio/mpeg'
        },
        difficulty: 2,
        estimatedTime: 5,
        points: 8,
        questions: [
            {
                number: 1,
                text: '今日の天気はどうですか？',
                answer: '晴れ',
                explanation: '会話の冒頭で今日の天気について話しています'
            },
            {
                number: 2,
                text: '明日の天気予報は何ですか？',
                answer: '雨',
                explanation: '明日は雨が降るという予報が話されています'
            },
            {
                number: 3,
                text: '週末の予定は何ですか？',
                answer: 'ピクニック',
                explanation: '週末にピクニックに行く予定が話されています'
            }
        ],
        createdAt: '2024-01-15T13:00:00.000Z'
    },
    {
        id: 4002,
        type: 'listening',
        setTitle: 'レストランでの注文',
        setDescription: 'レストランでウェイターと客の注文に関する会話です',
        audioFile: {
            name: 'restaurant-ordering.wav',
            size: 3.2,
            type: 'audio/wav'
        },
        difficulty: 3,
        estimatedTime: 6,
        points: 10,
        questions: [
            {
                number: 1,
                text: '客は何を注文しましたか？',
                answer: 'ステーキとサラダ',
                explanation: 'メインディッシュとしてステーキを注文しました'
            },
            {
                number: 2,
                text: '飲み物は何を選びましたか？',
                answer: '赤ワイン',
                explanation: '飲み物として赤ワインを注文しています'
            },
            {
                number: 3,
                text: 'デザートは注文しましたか？',
                answer: 'はい、チーズケーキ',
                explanation: 'デザートとしてチーズケーキを追加で注文しました'
            },
            {
                number: 4,
                text: '支払い方法は何ですか？',
                answer: 'クレジットカード',
                explanation: '会話の最後に支払い方法について話しています'
            }
        ],
        createdAt: '2024-01-15T13:10:00.000Z'
    },
    {
        id: 4003,
        type: 'listening',
        setTitle: 'ニュース放送',
        setDescription: '地域のニュースに関する短い放送です',
        audioFile: {
            name: 'local-news.m4a',
            size: 4.1,
            type: 'audio/mp4'
        },
        difficulty: 4,
        estimatedTime: 8,
        points: 15,
        questions: [
            {
                number: 1,
                text: '今日の主要なニュースは何ですか？',
                answer: '新しい図書館の開館',
                explanation: 'ニュースのトップとして図書館の開館が報道されています'
            },
            {
                number: 2,
                text: '図書館の開館時間はいつからいつまでですか？',
                answer: '午前9時から午後8時まで',
                explanation: '具体的な開館時間がアナウンスされています'
            },
            {
                number: 3,
                text: '図書館の特別なサービスは何ですか？',
                answer: '無料のWi-Fiと勉強スペース',
                explanation: '特別サービスとして2つのことが紹介されています'
            },
            {
                number: 4,
                text: '週末には何か特別なイベントがありますか？',
                answer: '子供向けの読み聞かせ会',
                explanation: '週末の特別イベントとして告知されています'
            },
            {
                number: 5,
                text: '図書館の場所はどこですか？',
                answer: '中央駅の近く',
                explanation: 'アクセス方法についての情報が含まれています'
            }
        ],
        createdAt: '2024-01-15T13:20:00.000Z'
    }
];

// リスニング問題をlocalStorageに保存
localStorage.setItem('listeningQuestions', JSON.stringify(sampleListeningQuestions));

console.log('リスニング問題サンプルデータを保存しました（3問）');