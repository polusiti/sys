// TOEIC対策問題データベース
const questionDatabase = {
    reading: [
        {
            id: 1,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The new marketing campaign was _____ successful that the company decided to extend it for another month.",
            options: [
                "A) so",
                "B) such",
                "C) very",
                "D) too"
            ],
            correct: 0,
            explanation: "「so + 形容詞 + that」の構文です。successfulは形容詞なので、soが正解です。"
        },
        {
            id: 2,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "All employees are required to _____ their ID cards at all times while on company premises.",
            options: [
                "A) wear",
                "B) carry",
                "C) bring",
                "D) take"
            ],
            correct: 1,
            explanation: "IDカードは「携帯する」ものなので、carryが適切です。"
        },
        {
            id: 3,
            type: "reading",
            category: "Part 6 - 長文穴埋め",
            question: "Dear Mr. Johnson,\n\nThank you for your interest in our products. We are pleased to _____ that we can offer you a 15% discount on bulk orders.",
            options: [
                "A) inform",
                "B) informing",
                "C) informed",
                "D) information"
            ],
            correct: 0,
            explanation: "「be pleased to + 動詞の原形」の構文です。informが正解です。"
        },
        {
            id: 4,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The conference room is _____ for meetings between 9 AM and 5 PM on weekdays.",
            options: [
                "A) available",
                "B) convenient",
                "C) suitable",
                "D) accessible"
            ],
            correct: 0,
            explanation: "会議室が「利用可能」という意味でavailableが適切です。"
        },
        {
            id: 5,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "_____ the heavy rain, the outdoor event was postponed until next week.",
            options: [
                "A) Because",
                "B) Due to",
                "C) Since",
                "D) As"
            ],
            correct: 1,
            explanation: "「Due to + 名詞」の構文です。the heavy rainは名詞句なので、Due toが正解です。"
        },
        {
            id: 6,
            type: "reading",
            category: "Part 6 - 長文穴埋め",
            question: "We regret to inform you that your application has not been successful. _____, we will keep your resume on file for future opportunities.",
            options: [
                "A) Therefore",
                "B) However",
                "C) Moreover",
                "D) Furthermore"
            ],
            correct: 1,
            explanation: "前文は否定的な内容、後文は肯定的な内容なので、逆接のHoweverが適切です。"
        },
        {
            id: 7,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The project manager asked all team members to _____ their reports by Friday afternoon.",
            options: [
                "A) submit",
                "B) submission",
                "C) submitting",
                "D) submitted"
            ],
            correct: 0,
            explanation: "「ask someone to + 動詞の原形」の構文です。submitが正解です。"
        },
        {
            id: 8,
            type: "reading",
            category: "Part 7 - 読解",
            question: "According to the company policy, employees who work overtime on weekends are entitled to _____ compensation.",
            options: [
                "A) addition",
                "B) additional",
                "C) additionally",
                "D) adding"
            ],
            correct: 1,
            explanation: "compensationは名詞なので、形容詞のadditionalで修飾します。"
        },
        {
            id: 9,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The new software system will be _____ throughout the organization next month.",
            options: [
                "A) implemented",
                "B) implementing",
                "C) implement",
                "D) implementation"
            ],
            correct: 0,
            explanation: "受動態「will be + 過去分詞」の構文です。implementedが正解です。"
        },
        {
            id: 10,
            type: "reading",
            category: "Part 6 - 長文穴埋め",
            question: "Our customer service team is _____ to assist you with any questions or concerns you may have.",
            options: [
                "A) available",
                "B) capable",
                "C) responsible",
                "D) qualified"
            ],
            correct: 0,
            explanation: "「利用可能」「対応可能」という意味でavailableが適切です。"
        },
        {
            id: 11,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The annual sales meeting has been _____ from March to April due to scheduling conflicts.",
            options: [
                "A) delayed",
                "B) postponed",
                "C) cancelled",
                "D) rescheduled"
            ],
            correct: 3,
            explanation: "3月から4月に変更されたので、「再スケジュール」のrescheduledが適切です。"
        },
        {
            id: 12,
            type: "reading",
            category: "Part 7 - 読解",
            question: "Employees must _____ their supervisor before taking any vacation days.",
            options: [
                "A) notify",
                "B) notice",
                "C) note",
                "D) nominate"
            ],
            correct: 0,
            explanation: "上司に「通知する」という意味でnotifyが正解です。"
        },
        {
            id: 13,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The company's _____ performance this quarter exceeded all expectations.",
            options: [
                "A) finance",
                "B) financial",
                "C) financially",
                "D) financing"
            ],
            correct: 1,
            explanation: "performanceは名詞なので、形容詞のfinancialで修飾します。"
        },
        {
            id: 14,
            type: "reading",
            category: "Part 6 - 長文穴埋め",
            question: "We are currently _____ applications for the position of Marketing Director.",
            options: [
                "A) accepting",
                "B) receiving",
                "C) taking",
                "D) getting"
            ],
            correct: 0,
            explanation: "応募を「受け付けている」という意味でacceptingが適切です。"
        },
        {
            id: 15,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The training session will cover _____ aspects of customer service excellence.",
            options: [
                "A) variety",
                "B) various",
                "C) vary",
                "D) varied"
            ],
            correct: 1,
            explanation: "aspectsは名詞なので、形容詞のvariousで修飾します。"
        },
        {
            id: 16,
            type: "reading",
            category: "Part 7 - 読解",
            question: "All visitors must _____ at the reception desk before entering the building.",
            options: [
                "A) register",
                "B) registration",
                "C) registered",
                "D) registering"
            ],
            correct: 0,
            explanation: "「must + 動詞の原形」の構文です。registerが正解です。"
        },
        {
            id: 17,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The presentation was _____ informative and well-organized.",
            options: [
                "A) extreme",
                "B) extremely",
                "C) extremes",
                "D) extremity"
            ],
            correct: 1,
            explanation: "informativeは形容詞なので、副詞のextremelyで修飾します。"
        },
        {
            id: 18,
            type: "reading",
            category: "Part 6 - 長文穴埋め",
            question: "Please _____ that all documents are properly filed before the end of the day.",
            options: [
                "A) ensure",
                "B) assure",
                "C) insure",
                "D) secure"
            ],
            correct: 0,
            explanation: "「確実にする」という意味でensureが適切です。"
        },
        {
            id: 19,
            type: "reading",
            category: "Part 5 - 文法・語彙",
            question: "The company is looking for candidates with _____ experience in international trade.",
            options: [
                "A) extend",
                "B) extensive",
                "C) extension",
                "D) extensively"
            ],
            correct: 1,
            explanation: "experienceは名詞なので、形容詞のextensiveで修飾します。"
        },
        {
            id: 20,
            type: "reading",
            category: "Part 7 - 読解",
            question: "The deadline for submitting proposals has been _____ by two weeks.",
            options: [
                "A) extended",
                "B) expanded",
                "C) enlarged",
                "D) increased"
            ],
            correct: 0,
            explanation: "締切を「延長する」という意味でextendedが適切です。"
        }
    ],
    
    listening: [
        {
            id: 21,
            type: "listening",
            category: "Part 1 - 写真描写",
            question: "音声を聞いて、写真に最も適した説明を選んでください。",
            audioText: "The woman is typing on her laptop computer.",
            options: [
                "A) The woman is making a phone call.",
                "B) The woman is typing on her laptop computer.",
                "C) The woman is reading a newspaper.",
                "D) The woman is writing with a pen."
            ],
            correct: 1,
            explanation: "音声では「女性がラップトップコンピューターでタイピングしている」と言っています。"
        },
        {
            id: 22,
            type: "listening",
            category: "Part 2 - 応答問題",
            question: "質問に対する最も適切な応答を選んでください。",
            audioText: "When is the meeting scheduled?",
            options: [
                "A) In the conference room.",
                "B) At 3 o'clock this afternoon.",
                "C) About marketing strategies.",
                "D) Mr. Johnson will attend."
            ],
            correct: 1,
            explanation: "「いつ」という時間を尋ねる質問なので、時刻を答えるBが適切です。"
        },
        {
            id: 23,
            type: "listening",
            category: "Part 3 - 会話問題",
            question: "会話を聞いて、男性が何を探しているかを答えてください。",
            audioText: "Man: Excuse me, do you know where I can find the printer paper? Woman: It should be in the supply closet on the second floor.",
            options: [
                "A) A printer",
                "B) Printer paper",
                "C) The supply closet",
                "D) The second floor"
            ],
            correct: 1,
            explanation: "男性は「プリンター用紙はどこにありますか」と尋ねています。"
        },
        {
            id: 24,
            type: "listening",
            category: "Part 1 - 写真描写",
            question: "音声を聞いて、写真に最も適した説明を選んでください。",
            audioText: "The documents are stacked on the desk.",
            options: [
                "A) The documents are being filed.",
                "B) The documents are stacked on the desk.",
                "C) The documents are being shredded.",
                "D) The documents are in the drawer."
            ],
            correct: 1,
            explanation: "音声では「書類が机の上に積まれている」と言っています。"
        },
        {
            id: 25,
            type: "listening",
            category: "Part 2 - 応答問題",
            question: "質問に対する最も適切な応答を選んでください。",
            audioText: "Who's in charge of the project?",
            options: [
                "A) It starts next Monday.",
                "B) Sarah Miller is the project manager.",
                "C) It's about product development.",
                "D) In the main office building."
            ],
            correct: 1,
            explanation: "「誰が」という人を尋ねる質問なので、人名を答えるBが適切です。"
        },
        {
            id: 26,
            type: "listening",
            category: "Part 4 - 説明文問題",
            question: "アナウンスを聞いて、何時に建物が閉まるかを答えてください。",
            audioText: "Attention all employees. Please note that the building will close at 6 PM today for maintenance work.",
            options: [
                "A) 5 PM",
                "B) 6 PM",
                "C) 7 PM",
                "D) 8 PM"
            ],
            correct: 1,
            explanation: "アナウンスで「建物は今日午後6時に閉まります」と言っています。"
        },
        {
            id: 27,
            type: "listening",
            category: "Part 3 - 会話問題",
            question: "会話を聞いて、女性がなぜ遅れたかを答えてください。",
            audioText: "Man: You're late for the meeting. Woman: Sorry, I got stuck in traffic on the highway.",
            options: [
                "A) She overslept",
                "B) She got stuck in traffic",
                "C) She missed the bus",
                "D) She had car trouble"
            ],
            correct: 1,
            explanation: "女性は「高速道路で渋滞に巻き込まれた」と説明しています。"
        },
        {
            id: 28,
            type: "listening",
            category: "Part 2 - 応答問題",
            question: "質問に対する最も適切な応答を選んでください。",
            audioText: "How much does this cost?",
            options: [
                "A) It's very popular.",
                "B) Twenty-five dollars.",
                "C) It's made in Japan.",
                "D) Next to the cashier."
            ],
            correct: 1,
            explanation: "「いくら」という値段を尋ねる質問なので、価格を答えるBが適切です。"
        },
        {
            id: 29,
            type: "listening",
            category: "Part 1 - 写真描写",
            question: "音声を聞いて、写真に最も適した説明を選んでください。",
            audioText: "The man is presenting to a group of people.",
            options: [
                "A) The man is sitting at his desk.",
                "B) The man is presenting to a group of people.",
                "C) The man is talking on the phone.",
                "D) The man is reading a book."
            ],
            correct: 1,
            explanation: "音声では「男性がグループの人々にプレゼンテーションをしている」と言っています。"
        },
        {
            id: 30,
            type: "listening",
            category: "Part 4 - 説明文問題",
            question: "電話メッセージを聞いて、何をするように言われているかを答えてください。",
            audioText: "This is a reminder that your appointment is scheduled for tomorrow at 2 PM. Please call back to confirm.",
            options: [
                "A) Reschedule the appointment",
                "B) Cancel the appointment",
                "C) Call back to confirm",
                "D) Arrive 30 minutes early"
            ],
            correct: 2,
            explanation: "メッセージで「確認のため電話をかけ直してください」と言っています。"
        },
        {
            id: 31,
            type: "listening",
            category: "Part 3 - 会話問題",
            question: "会話を聞いて、男性の職業は何かを答えてください。",
            audioText: "Woman: Thank you for fixing my computer. Man: No problem. That's what we IT technicians are here for.",
            options: [
                "A) Computer salesperson",
                "B) IT technician",
                "C) Office manager",
                "D) Software developer"
            ],
            correct: 1,
            explanation: "男性は「私たちITテクニシャンがいる理由です」と言っています。"
        },
        {
            id: 32,
            type: "listening",
            category: "Part 2 - 応答問題",
            question: "質問に対する最も適切な応答を選んでください。",
            audioText: "Where did you put the files?",
            options: [
                "A) Yesterday morning.",
                "B) In the filing cabinet.",
                "C) About 50 files.",
                "D) They're very important."
            ],
            correct: 1,
            explanation: "「どこに」という場所を尋ねる質問なので、場所を答えるBが適切です。"
        },
        {
            id: 33,
            type: "listening",
            category: "Part 4 - 説明文問題",
            question: "店内アナウンスを聞いて、セールはいつまでかを答えてください。",
            audioText: "Attention shoppers. Our spring sale continues through this weekend. All items are 30% off.",
            options: [
                "A) Today only",
                "B) Through this weekend",
                "C) Until next month",
                "D) For two weeks"
            ],
            correct: 1,
            explanation: "アナウンスで「春のセールは今週末まで続きます」と言っています。"
        },
        {
            id: 34,
            type: "listening",
            category: "Part 1 - 写真描写",
            question: "音声を聞いて、写真に最も適した説明を選んでください。",
            audioText: "The woman is watering the plants.",
            options: [
                "A) The woman is planting flowers.",
                "B) The woman is watering the plants.",
                "C) The woman is picking vegetables.",
                "D) The woman is cutting grass."
            ],
            correct: 1,
            explanation: "音声では「女性が植物に水をやっている」と言っています。"
        },
        {
            id: 35,
            type: "listening",
            category: "Part 3 - 会話問題",
            question: "会話を聞いて、女性が何を注文したかを答えてください。",
            audioText: "Waiter: What would you like to drink? Woman: I'll have a coffee, please. Black, no sugar.",
            options: [
                "A) Tea with milk",
                "B) Coffee with sugar",
                "C) Black coffee",
                "D) Orange juice"
            ],
            correct: 2,
            explanation: "女性は「コーヒーをお願いします。ブラック、砂糖なしで」と注文しています。"
        },
        {
            id: 36,
            type: "listening",
            category: "Part 2 - 応答問題",
            question: "質問に対する最も適切な応答を選んでください。",
            audioText: "Why was the meeting cancelled?",
            options: [
                "A) At 3 o'clock.",
                "B) In the conference room.",
                "C) The manager is sick.",
                "D) About the budget."
            ],
            correct: 2,
            explanation: "「なぜ」という理由を尋ねる質問なので、理由を答えるCが適切です。"
        },
        {
            id: 37,
            type: "listening",
            category: "Part 4 - 説明文問題",
            question: "天気予報を聞いて、明日の天気はどうかを答えてください。",
            audioText: "Tomorrow will be partly cloudy with a chance of rain in the afternoon. High temperature will be 22 degrees.",
            options: [
                "A) Sunny all day",
                "B) Partly cloudy with possible rain",
                "C) Heavy rain all day",
                "D) Snow in the morning"
            ],
            correct: 1,
            explanation: "天気予報で「明日は一部曇りで午後に雨の可能性」と言っています。"
        },
        {
            id: 38,
            type: "listening",
            category: "Part 1 - 写真描写",
            question: "音声を聞いて、写真に最も適した説明を選んでください。",
            audioText: "The people are boarding the bus.",
            options: [
                "A) The people are waiting for the bus.",
                "B) The people are boarding the bus.",
                "C) The people are getting off the bus.",
                "D) The people are washing the bus."
            ],
            correct: 1,
            explanation: "音声では「人々がバスに乗り込んでいる」と言っています。"
        },
        {
            id: 39,
            type: "listening",
            category: "Part 3 - 会話問題",
            question: "会話を聞いて、男性はいつ出張から戻るかを答えてください。",
            audioText: "Woman: When will you be back from your business trip? Man: I'll return on Friday evening.",
            options: [
                "A) Thursday morning",
                "B) Friday morning",
                "C) Friday evening",
                "D) Saturday morning"
            ],
            correct: 2,
            explanation: "男性は「金曜日の夕方に戻ります」と答えています。"
        },
        {
            id: 40,
            type: "listening",
            category: "Part 2 - 応答問題",
            question: "質問に対する最も適切な応答を選んでください。",
            audioText: "Could you help me with this report?",
            options: [
                "A) It's due tomorrow.",
                "B) Sure, I'd be happy to help.",
                "C) It's about sales figures.",
                "D) In my office."
            ],
            correct: 1,
            explanation: "手伝いを求める依頼なので、「喜んでお手伝いします」というBが適切です。"
        }
    ]
};

// 問題をシャッフルする関数
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 指定されたタイプの問題を取得する関数
function getQuestions(type, count = 20) {
    let questions = [];
    
    if (type === 'reading') {
        questions = shuffleArray(questionDatabase.reading).slice(0, count);
    } else if (type === 'listening') {
        questions = shuffleArray(questionDatabase.listening).slice(0, count);
    } else if (type === 'mixed') {
        const readingQuestions = shuffleArray(questionDatabase.reading).slice(0, count / 2);
        const listeningQuestions = shuffleArray(questionDatabase.listening).slice(0, count / 2);
        questions = shuffleArray([...readingQuestions, ...listeningQuestions]);
    }
    
    return questions;
}