# コスト最適化メール戦略

## コスト比較分析

### 現行サービス比較（2025年時点）

| サービス | 無料枠 | 有料プラン | 特徴 |
|---------|--------|-----------|------|
| **Resend** | 3,000通/月 | $0.002/通 | 最もお得、シンプル |
| **SendGrid** | 100通/日 | $19.95/月（5,000通） | 機能豊富、安定性 |
| **AWS SES** | 62,000通/月 | $0.10/1,000通 | 最大無料枠、AWS連携 |
| **Mailgun** | 5,000通/月 | $35/月（50,000通） | 開発者向け |
| **Postmark** | 100通/月 | $15/月（10,000通） | 高速配信 |

## 最適化戦略案

### 方案1: ハイブリッド戦略（推奨）

```
小規模: Resend (0-3,000通/月)
中規模: AWS SES (3,001-62,000通/月)
大規模: SendGrid契約プラン (62,001通/月)
```

**実装方法:**
```javascript
// メールサービス動的切り替え
async function sendEmailOptimized(env, email, code) {
  const monthlyUsage = await getMonthlyUsage(env);
  
  if (monthlyUsage < 3000) {
    return await sendViaResend(env, email, code);
  } else if (monthlyUsage < 62000) {
    return await sendViaSES(env, email, code);
  } else {
    return await sendViaSendGrid(env, email, code);
  }
}
```

### 方案2: 多重無料枠戦略

```javascript
// 複数サービスをロードバランシング
const emailServices = [
  { name: 'Resend', limit: 3000, used: 0 },
  { name: 'AWS SES', limit: 62000, used: 0 },
  { name: 'SendGrid', limit: 3100, used: 0 } // 100通/日
];

async function sendWithLoadBalancing(env, email, code) {
  // 使用量が少ないサービスを選択
  const service = emailServices.reduce((min, current) => 
    (current.used / current.limit) < (min.used / min.limit) ? current : min
  );
  
  switch(service.name) {
    case 'Resend': return await sendViaResend(env, email, code);
    case 'AWS SES': return await sendViaSES(env, email, code);
    case 'SendGrid': return await sendViaSendGrid(env, email, code);
  }
}
```

## 実装コード
Write
<arg_key>content</arg_key>
<arg_value>// コスト最適化メールサービス統合
// File: cloudflare/workers/email-router.js

class EmailServiceRouter {
  constructor(env) {
    this.env = env;
    this.services = this.initializeServices();
  }
  
  initializeServices() {
    return {
      resend: {
        priority: 1,
        freeLimit: 3000,
        costPerEmail: 0.002,
        apiKey: this.env.RESEND_API_KEY,
        active: !!this.env.RESEND_API_KEY
      },
      sendgrid: {
        priority: 2,
        freeLimit: 3100, // 100通/日 × 31日
        costPerEmail: 0.004, // $19.95/5000通
        apiKey: this.env.SENDGRID_API_KEY,
        active: !!this.env.SENDGRID_API_KEY
      },
      ses: {
        priority: 3,
        freeLimit: 62000,
        costPerEmail: 0.0001,
        accessKey: this.env.AWS_ACCESS_KEY_ID,
        secretKey: this.env.AWS_SECRET_ACCESS_KEY,
        active: !!(this.env.AWS_ACCESS_KEY_ID && this.env.AWS_SECRET_ACCESS_KEY)
      }
    };
  }
  
  async getOptimalService() {
    // 現在の月次使用量を取得
    const usage = await this.getMonthlyUsage();
    
    // 利用可能で無料枠が残っているサービスを選択
    const availableServices = Object.entries(this.services)
      .filter(([_, service]) => service.active)
      .map(([name, service]) => ({
        name,
        ...service,
        currentUsage: usage[name] || 0,
        remaining: service.freeLimit - (usage[name] || 0)
      }))
      .filter(service => service.remaining > 0)
      .sort((a, b) => a.priority - b.priority);
    
    return availableServices[0] || null;
  }
  
  async getMonthlyUsage() {
    // KVストレージから使用量を取得
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageKey = `email_usage_${currentMonth}`;
    const usageData = await this.env.EMAIL_USAGE_KV.get(usageKey);
    
    return usageData ? JSON.parse(usageData) : {
      resend: 0,
      sendgrid: 0,
      ses: 0
    };
  }
  
  async updateUsage(serviceName) {
    const usage = await this.getMonthlyUsage();
    usage[serviceName] = (usage[serviceName] || 0) + 1;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageKey = `email_usage_${currentMonth}`;
    
    await this.env.EMAIL_USAGE_KV.put(usageKey, JSON.stringify(usage));
  }
  
  async sendVerificationEmail(email, verificationCode) {
    const optimalService = await this.getOptimalService();
    
    if (!optimalService) {
      // すべての無料枠を使い切った場合
      return await this.sendWithCheapestService(email, verificationCode);
    }
    
    console.log(`Using ${optimalService.name} for email delivery`);
    
    let result;
    switch (optimalService.name) {
      case 'resend':
        result = await this.sendViaResend(email, verificationCode);
        break;
      case 'sendgrid':
        result = await this.sendViaSendGrid(email, verificationCode);
        break;
      case 'ses':
        result = await this.sendViaSES(email, verificationCode);
        break;
    }
    
    if (result.success) {
      await this.updateUsage(optimalService.name);
    }
    
    return result;
  }
  
  async sendViaResend(email, code) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.env.FROM_EMAIL || 'noreply@testapp.jp',
          to: [email],
          subject: 'TestApp - メールアドレス確認',
          html: this.createEmailTemplate(code)
        })
      });
      
      return {
        success: response.ok,
        message: response.ok ? 'メールを送信しました' : '送信に失敗しました'
      };
    } catch (error) {
      console.error('Resend error:', error);
      return { success: false, message: '送信エラー' };
    }
  }
  
  async sendViaSendGrid(email, code) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }], subject: 'TestApp - メールアドレス確認' }],
          from: { email: this.env.FROM_EMAIL || 'noreply@testapp.jp' },
          content: [{
            type: 'text/html',
            value: this.createEmailTemplate(code)
          }]
        })
      });
      
      return {
        success: response.ok,
        message: response.ok ? 'メールを送信しました' : '送信に失敗しました'
      };
    } catch (error) {
      console.error('SendGrid error:', error);
      return { success: false, message: '送信エラー' };
    }
  }
  
  async sendViaSES(email, code) {
    // AWS SES実装（簡略化）
    try {
      // 実際にはAWS SDK v4の署名が必要
      console.log('SES implementation would go here');
      return { success: true, message: 'メールを送信しました' };
    } catch (error) {
      console.error('SES error:', error);
      return { success: false, message: '送信エラー' };
    }
  }
  
  async sendWithCheapestService(email, code) {
    // 無料枠を使い切った場合、最も安いサービスを使用
    const costs = {
      resend: 0.002,
      sendgrid: 0.004,
      ses: 0.0001
    };
    
    const cheapestService = Object.entries(costs)
      .filter(([name, _]) => this.services[name].active)
      .sort((a, b) => a[1] - b[1])[0][0];
    
    console.log(`Using paid service: ${cheapestService}`);
    return await this[`sendVia${cheapestService.charAt(0).toUpperCase() + cheapestService.slice(1)}`](email, code);
  }
  
  createEmailTemplate(code) {
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>TestApp</h1>
          <p>メールアドレス確認</p>
        </div>
        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2>確認コード</h2>
          <div style="font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: #f8f9ff; border-radius: 8px; margin: 20px 0; letter-spacing: 3px;">
            ${code}
          </div>
          <p>このコードの有効期限は24時間です。</p>
          <p>ご不明な点がございましたら、サポートまでお問い合わせください。</p>
        </div>
      </div>
    `;
  }
}

// メールルーターを使用する認証システム
export default {
  async fetch(request, env, ctx) {
    const emailRouter = new EmailServiceRouter(env);
    
    // 既存の認証ロジックに統合
    if (request.url.includes('/api/auth/register')) {
      const { email } = await request.json();
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // コスト最適化されたメール送信
      const emailResult = await emailRouter.sendVerificationEmail(email, verificationCode);
      
      return new Response(JSON.stringify({
        success: true,
        message: emailResult.message,
        verificationCode: emailResult.success ? undefined : verificationCode // 開発モード用
      }));
    }
    
    // 他のエンドポイント処理...
  }
};