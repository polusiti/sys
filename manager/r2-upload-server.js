const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');

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

// 簡単な認証トークン (あなた専用)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

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

// 問題データをR2に保存
app.post('/api/questions/:subject', authenticateAdmin, async (req, res) => {
    try {
        const { subject } = req.params;
        const { questions } = req.body;
        
        const timestamp = Date.now();
        const filename = `questions/${subject}/${timestamp}.json`;
        
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: filename,
            Body: JSON.stringify(questions, null, 2),
            ContentType: 'application/json',
            Metadata: {
                'uploaded-by': 'admin',
                'timestamp': timestamp.toString()
            }
        });

        await s3Client.send(command);
        
        // インデックスファイル更新
        await updateQuestionIndex(subject, filename);
        
        res.json({
            success: true,
            url: `${R2_PUBLIC_URL}/${filename}`,
            filename
        });
    } catch (error) {
        console.error('問題保存エラー:', error);
        res.status(500).json({ error: '保存に失敗しました' });
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

// 問題データ取得
app.get('/api/questions/:subject', async (req, res) => {
    try {
        const { subject } = req.params;
        const indexKey = `questions/${subject}/index.json`;
        
        const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: indexKey
        });
        
        const result = await s3Client.send(getCommand);
        const body = await result.Body.transformToString();
        const index = JSON.parse(body);
        
        if (index.files.length > 0) {
            // 最新のファイルを取得
            const latestFile = index.files[0];
            const questionCommand = new GetObjectCommand({
                Bucket: R2_BUCKET,
                Key: latestFile.filename
            });
            
            const questionResult = await s3Client.send(questionCommand);
            const questions = await questionResult.Body.transformToString();
            
            res.json({
                questions: JSON.parse(questions),
                metadata: latestFile
            });
        } else {
            res.json({ questions: [], metadata: null });
        }
    } catch (error) {
        console.error('問題取得エラー:', error);
        res.status(404).json({ error: '問題データが見つかりません' });
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

// サーバー起動
app.listen(port, () => {
    console.log(`🚀 Questa R2 Manager running on port ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
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