const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

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

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'questa';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-xxxx.r2.dev';

// Multer設定（メモリストレージ）
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB制限
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('MP3またはWAVファイルのみアップロード可能です'), false);
        }
    }
});

// ミドルウェア
app.use(express.json());
app.use(express.static('public'));

// CORS設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
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

app.listen(port, () => {
    console.log(`R2 Audio Upload Server running on port ${port}`);
    console.log(`R2 Bucket: ${R2_BUCKET}`);
    console.log(`R2 Endpoint: ${process.env.R2_ENDPOINT || 'Not set'}`);
});

module.exports = app;