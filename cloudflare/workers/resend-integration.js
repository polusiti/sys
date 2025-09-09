// Resend Integration (simpler alternative)
async function sendVerificationEmailResend(env, email, verificationCode) {
  try {
    const resendApiKey = env.RESEND_API_KEY;
    const fromEmail = env.FROM_EMAIL || 'noreply@testapp.jp';
    
    if (!resendApiKey) {
      console.log('Resend API key not configured, skipping email send');
      return { success: true, message: '確認コードを生成しました（開発モード）' };
    }
    
    const emailData = {
      from: fromEmail,
      to: [email],
      subject: 'TestApp - メールアドレス確認',
      html: `
        <h2>TestAppへようこそ！</h2>
        <p>あなたの確認コードは: <strong>${verificationCode}</strong></p>
        <p>このコードを登録画面で入力してください。</p>
        <p>コードの有効期限は24時間です。</p>
        <br>
        <p>このメールに心当たりがない場合は、無視してください。</p>
        <hr>
        <p><small>TestAppチーム</small></p>
      `
    };
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (response.ok) {
      return { success: true, message: '確認メールを送信しました' };
    } else {
      const error = await response.text();
      console.error('Resend error:', error);
      return { success: false, message: 'メール送信に失敗しました' };
    }
  } catch (error) {
    console.error('Resend error:', error);
    return { success: false, message: 'メール送信エラーが発生しました' };
  }
}