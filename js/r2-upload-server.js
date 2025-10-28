const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const port = process.env.PORT || 3001;

// R2クライアントの設定
const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || 'https://your-account.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || 'your-access-key',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'your-secret-key'
    }
});

const R2_BUCKET = 'questa'; // Fixed bucket name
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-xxxx.r2.dev';

// D1データベース設定（開発環境用SQLite）
const DB_PATH = process.env.DB_PATH || './questa.db';
let db;

// 簡単な認証トークン (あなた専用)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

// D1データベース初期化
async function initDatabase() {
    try {
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });
        console.log('✅ D1データベース接続完了:', DB_PATH);
        
        // テーブル存在確認
        const questions = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'");
        if (!questions) {
            console.warn('⚠️ questionsテーブルが存在しません。schema.sqlを実行してください。');
        }
    } catch (error) {
        console.error('❌ D1データベース初期化エラー:', error);
    }
}

// Multer設定（メモリストレージ）
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB制限
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav',
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'application/json'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('対応していないファイル形式です'), false);
        }
    }
});

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// 認証ミドルウェア
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: '認証が必要です' });
    }
    next();
};

// ヘルスチェック
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'questa-r2-manager' });
});

// 問題データをD1に保存
app.post('/api/d1/questions/batch', authenticateAdmin, async (req, res) => {
    try {
        const { subject, questions } = req.body;
        
        if (!subject || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'subject と questions 配列が必要です' });
        }

        // トランザクション開始
        await db.run('BEGIN TRANSACTION');
        
        let savedCount = 0;
        for (const question of questions) {
            try {
                await db.run(`
                    INSERT OR REPLACE INTO questions 
                    (id, subject, topic, difficulty, question, type, choices, answer, expected, accepted, explanation, active, audio_url, image_url, tags, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    question.id,
                    subject,
                    question.topic || '',
                    question.difficulty || 1,
                    question.question,
                    question.type,
                    question.choices ? JSON.stringify(question.choices) : null,
                    question.answer || null,
                    question.expected ? JSON.stringify(question.expected) : null,
                    question.accepted ? JSON.stringify(question.accepted) : null,
                    question.explanation || '',
                    question.active !== false ? 1 : 0,
                    question.assets?.audio || null,
                    question.assets?.image || null,
                    question.tags ? JSON.stringify(question.tags) : null
                ]);
                savedCount++;
            } catch (error) {
                console.error(`問題 ${question.id} 保存エラー:`, error);
            }
        }
        
        await db.run('COMMIT');
        
        console.log(`✅ ${savedCount}/${questions.length} 問題をD1に保存完了`);
        res.json({
            success: true,
            saved: savedCount,
            total: questions.length,
            subject
        });
    } catch (error) {
        await db.run('ROLLBACK');
        console.error('D1問題保存エラー:', error);
        res.status(500).json({ error: 'D1保存に失敗しました' });
    }
});

// インデックスファイル更新関数
async function updateQuestionIndex(subject, filename) {
    try {
        const indexKey = `questions/${subject}/index.json`;
        let index = { files: [], lastUpdated: Date.now() };
        
        // 既存のインデックス取得
        try {
            const getCommand = new GetObjectCommand({
                Bucket: R2_BUCKET,
                Key: indexKey
            });
            const result = await s3Client.send(getCommand);
            const body = await result.Body.transformToString();
            index = JSON.parse(body);
        } catch (e) {
            // インデックスファイルが存在しない場合は新規作成
        }
        
        // 新しいファイルをインデックスに追加
        index.files.unshift({
            filename,
            timestamp: Date.now(),
            url: `${R2_PUBLIC_URL}/${filename}`
        });
        
        // 古いファイルは10個まで保持
        if (index.files.length > 10) {
            const oldFiles = index.files.slice(10);
            for (const oldFile of oldFiles) {
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: R2_BUCKET,
                        Key: oldFile.filename
                    }));
                } catch (e) {
                    console.warn('古いファイル削除失敗:', e);
                }
            }
            index.files = index.files.slice(0, 10);
        }
        
        index.lastUpdated = Date.now();
        
        // インデックス更新
        const putIndexCommand = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: indexKey,
            Body: JSON.stringify(index, null, 2),
            ContentType: 'application/json'
        });
        
        await s3Client.send(putIndexCommand);
    } catch (error) {
        console.error('インデックス更新エラー:', error);
    }
}

// 問題データをD1から取得
app.get('/api/d1/questions', async (req, res) => {
    try {
        const { subject, topic, difficulty, active = '1', limit = '100', offset = '0' } = req.query;
        
        let query = 'SELECT * FROM questions WHERE 1=1';
        const params = [];
        
        if (subject) {
            query += ' AND subject = ?';
            params.push(subject);
        }
        
        if (topic) {
            query += ' AND topic = ?';
            params.push(topic);
        }
        
        if (difficulty) {
            query += ' AND difficulty = ?';
            params.push(parseInt(difficulty));
        }
        
        if (active) {
            query += ' AND active = ?';
            params.push(parseInt(active));
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const questions = await db.all(query, params);
        
        // JSONフィールドをパース
        const processedQuestions = questions.map(q => ({
            ...q,
            choices: q.choices ? JSON.parse(q.choices) : null,
            expected: q.expected ? JSON.parse(q.expected) : null,
            accepted: q.accepted ? JSON.parse(q.accepted) : null,
            tags: q.tags ? JSON.parse(q.tags) : null,
            assets: {
                audio: q.audio_url,
                image: q.image_url
            }
        }));
        
        res.json({
            questions: processedQuestions,
            count: processedQuestions.length,
            filters: { subject, topic, difficulty, active }
        });
    } catch (error) {
        console.error('D1問題取得エラー:', error);
        res.status(500).json({ error: 'D1問題取得に失敗しました' });
    }
});

// 音声ファイルアップロード
app.post('/api/upload/audio', authenticateAdmin, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'ファイルが選択されていません' });
        }

        const timestamp = Date.now();
        const randomId = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(req.file.originalname);
        const filename = `assets/audio/${timestamp}_${randomId}${extension}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: filename,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            Metadata: {
                'original-name': req.file.originalname,
                'uploaded-by': 'admin'
            }
        });

        await s3Client.send(command);

        res.json({
            success: true,
            filename,
            url: `${R2_PUBLIC_URL}/${filename}`,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('音声アップロードエラー:', error);
        res.status(500).json({ error: 'アップロードに失敗しました' });
    }
});

// ファイル一覧取得
app.get('/api/files/:type', authenticateAdmin, async (req, res) => {
    try {
        const { type } = req.params; // 'questions' or 'assets'
        
        const listCommand = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: `${type}/`,
            MaxKeys: 100
        });
        
        const result = await s3Client.send(listCommand);
        
        const files = result.Contents?.map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            url: `${R2_PUBLIC_URL}/${obj.Key}`
        })) || [];
        
        res.json({ files });
    } catch (error) {
        console.error('ファイル一覧取得エラー:', error);
        res.status(500).json({ error: 'ファイル一覧の取得に失敗しました' });
    }
});

// D1統計情報取得
app.get('/api/d1/stats', async (req, res) => {
    try {
        const totalQuestions = await db.get('SELECT COUNT(*) as count FROM questions WHERE active = 1');
        const bySubject = await db.all('SELECT subject, COUNT(*) as count FROM questions WHERE active = 1 GROUP BY subject');
        const byDifficulty = await db.all('SELECT difficulty, COUNT(*) as count FROM questions WHERE active = 1 GROUP BY difficulty ORDER BY difficulty');
        
        res.json({
            total: totalQuestions.count,
            bySubject: bySubject.reduce((acc, item) => {
                acc[item.subject] = item.count;
                return acc;
            }, {}),
            byDifficulty: byDifficulty.reduce((acc, item) => {
                acc[`Level ${item.difficulty}`] = item.count;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('D1統計取得エラー:', error);
        res.status(500).json({ error: 'D1統計取得に失敗しました' });
    }
});

// D1ヘルスチェック
app.get('/api/d1/health', async (req, res) => {
    try {
        await db.get('SELECT 1');
        res.json({ status: 'ok', service: 'questa-d1-manager', db: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', service: 'questa-d1-manager', db: 'disconnected', error: error.message });
    }
});

// サーバー起動
app.listen(port, async () => {
    console.log(`🚀 Questa Hybrid Manager running on port ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
    console.log(`📊 D1 Questions API: http://localhost:${port}/api/d1/questions`);
    console.log(`🎵 R2 Audio API: http://localhost:${port}/api/upload/audio`);
    
    // データベース初期化
    await initDatabase();
});

// ファイル名生成関数
function generateFileName(originalName, questionId) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `audio/${questionId}_${timestamp}_${random}${ext}`;
}

// 音声ファイルアップロードエンドポイント
app.post('/api/upload-audio', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'ファイルが選択されていません' });
        }

        const { questionId, category, type } = req.body;
        
        // ファイル名を生成
        const fileName = generateFileName(req.file.originalname, questionId);
        
        // R2にアップロード
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            Metadata: {
                'question-id': questionId,
                'category': category || 'english',
                'type': type || 'listening',
                'original-name': req.file.originalname,
                'upload-time': new Date().toISOString()
            }
        });

        await s3Client.send(command);

        // 署名付きURLを生成（有効期限1年）
        const getObjectCommand = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: fileName
        });
        
        const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 365 * 24 * 60 * 60 });

        res.json({
            success: true,
            r2Path: fileName,
            r2Url: signedUrl,
            publicUrl: `${R2_PUBLIC_URL}/${fileName}`,
            size: req.file.size,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            uploadedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('R2 upload error:', error);
        res.status(500).json({ error: 'ファイルのアップロードに失敗しました' });
    }
});

// 音声ファイル情報取得エンドポイント
app.get('/api/audio/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: `audio/${fileName}`
        });
        
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 365 * 24 * 60 * 60 });
        
        res.json({
            success: true,
            url: signedUrl,
            fileName: fileName
        });
        
    } catch (error) {
        console.error('Get audio error:', error);
        res.status(404).json({ error: 'ファイルが見つかりません' });
    }
});

// アップロードされたファイル一覧取得
app.get('/api/audio-list', async (req, res) => {
    try {
        // 注: 実際にはListObjectsV2を使用しますが、ここでは簡略化
        // 実際の実装ではバックエンドでファイルリストを管理する必要があります
        res.json({
            success: true,
            files: [],
            message: 'ファイルリスト機能は追加実装が必要です'
        });
        
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'ファイルリストの取得に失敗しました' });
    }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// エラーハンドリングミドルウェア
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

module.exports = app;