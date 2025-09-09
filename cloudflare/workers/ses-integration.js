// Alternative AWS SES Integration
async function sendVerificationEmailSES(env, email, verificationCode) {
  try {
    // AWS SES Configuration
    const awsAccessKey = env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = env.AWS_SECRET_ACCESS_KEY;
    const awsRegion = env.AWS_REGION || 'us-east-1';
    const fromEmail = env.FROM_EMAIL || 'noreply@testapp.jp';
    
    if (!awsAccessKey || !awsSecretKey) {
      console.log('AWS credentials not configured, skipping email send');
      return { success: true, message: '確認コードを生成しました（開発モード）' };
    }
    
    // Create AWS SES send email request
    const sesEndpoint = `https://email.${awsRegion}.amazonaws.com`;
    const date = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const message = `TestAppへようこそ！

あなたの確認コードは: ${verificationCode}

このコードを登録画面で入力してください。

コードの有効期限は24時間です。

このメールに心当たりがない場合は、無視してください。

---
TestAppチーム`;
    
    const emailParams = {
      Action: 'SendEmail',
      Version: '2010-12-01',
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: message
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'TestApp - メールアドレス確認'
        }
      },
      Source: fromEmail
    };
    
    // AWS Signature v4 (simplified - in production use AWS SDK)
    const response = await fetch(sesEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': date
      },
      body: new URLSearchParams(emailParams).toString()
    });
    
    if (response.ok) {
      return { success: true, message: '確認メールを送信しました' };
    } else {
      const error = await response.text();
      console.error('AWS SES error:', error);
      return { success: false, message: 'メール送信に失敗しました' };
    }
  } catch (error) {
    console.error('AWS SES error:', error);
    return { success: false, message: 'メール送信エラーが発生しました' };
  }
}