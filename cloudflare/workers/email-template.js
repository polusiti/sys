// Enhanced Email Template
function createVerificationEmailTemplate(email, verificationCode) {
  return {
    personalizations: [
      {
        to: [{ email: email }],
        subject: 'TestApp - メールアドレス確認'
      }
    ],
    from: { email: 'noreply@testapp.jp' },
    content: [
      {
        type: 'text/html',
        value: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>メールアドレス確認 - TestApp</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 40px 30px;
            background: white;
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 10px 10px;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            text-align: center;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 8px;
            margin: 20px 0;
            letter-spacing: 3px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TestApp</h1>
        <p>学習の可能性を広げる</p>
    </div>
    
    <div class="content">
        <h2>メールアドレス確認</h2>
        <p>TestAppへようこそ！</p>
        <p>アカウントを完成させるために、以下の確認コードを入力してください：</p>
        
        <div class="code">${verificationCode}</div>
        
        <p><strong>注意：</strong></p>
        <ul>
            <li>このコードの有効期限は24時間です</li>
            <li>他人と共有しないでください</li>
            <li>TestAppスタッフがコードを聞くことはありません</li>
        </ul>
        
        <p>このメールに心当たりがない場合や、アカウントを作成していない場合は、このメールを無視してください。</p>
        
        <p>ご質問がある場合は、サポートまでお問い合わせください。</p>
    </div>
    
    <div class="footer">
        <p>&copy; 2025 TestApp. All rights reserved.</p>
        <p>このメールはTestAppのアカウント登録リクエストに応じて自動送信されました。</p>
    </div>
</body>
</html>`
      }
    ]
  };
}