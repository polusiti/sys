const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // ファイルパスを取得
    let filePath = path.join(__dirname, req.url === '/' ? 'passwordless-test.html' : req.url);
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('File not found');
        return;
    }
    
    // MIME types
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };
    
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'text/plain';
    
    // ファイル読み込み
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Error loading file');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, 'localhost', () => {
    console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
    console.log(`📱 WebAuthn対応でパスワードレス認証をテストできます`);
    console.log(`⏹️  停止する場合: Ctrl+C`);
});