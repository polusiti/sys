class AuthenticationSystem {
  constructor() {
    this.users = {
      sys: { password: "izumiya", role: "admin", displayName: "管理者", email: "admin@example.com" }
    };
    this.currentUser = null;
    document.addEventListener("DOMContentLoaded", () => this.bootstrap());
  }

  bootstrap() {
    // ログイン/インデックス両方で動作する軽量ガード
    const isLogin = location.pathname.endsWith("/login.html") || location.pathname.endsWith("login.html");
    const session = AuthenticationSystem.getCurrentUser();

    if (isLogin && session) {
      location.replace("index.html");
      return;
    }
    if (!isLogin && !session) {
      location.replace("login.html");
      return;
    }

    if (!isLogin && session) {
      this.currentUser = session;
      const nameEl = document.getElementById("userName");
      const roleEl = document.getElementById("userRole");
      const avatarEl = document.getElementById("userAvatar");
      if (nameEl) nameEl.textContent = session.displayName || "管理者";
      if (roleEl) roleEl.textContent = "管理者";
      if (avatarEl) avatarEl.textContent = (session.displayName || "管").charAt(0);
      const logoutBtn = document.getElementById("logoutBtn");
      logoutBtn?.addEventListener("click", () => AuthenticationSystem.logout());
    }

    // ログインページのイベントは login.html 側で設定
  }

  validateField(fieldName, value) {
    const field = document.getElementById(fieldName);
    const errorEl = document.getElementById(fieldName + "Error");
    let ok = true;
    if (!value || value.trim().length < 3) ok = false;
    if (field) field.classList.toggle("error", !ok);
    if (errorEl) {
      errorEl.style.display = ok ? "none" : "block";
      if (!ok) errorEl.textContent = fieldName === "username" ? "ユーザー名は3文字以上" : "パスワードは3文字以上";
    }
    return ok;
  }

  handleLogin() {
    const username = document.getElementById("username")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const remember = document.getElementById("remember")?.checked || false;
    const okU = this.validateField("username", username);
    const okP = this.validateField("password", password);
    if (!okU || !okP) {
      this.showAlert("入力内容に誤りがあります");
      return;
    }
    const user = this.users[username];
    if (!user || user.password !== password) {
      this.showAlert("ユーザー名またはパスワードが違います");
      return;
    }
    // 単一管理者のみ
    if (user.role !== "admin") {
      this.showAlert("管理者権限が必要です");
      return;
    }
    const expiresIn = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const session = {
      user: { username, displayName: user.displayName, role: "admin", email: user.email, loginTime: new Date().toISOString() },
      expires: Date.now() + expiresIn,
      remember
    };
    localStorage.setItem("qm_session", JSON.stringify(session));
    AuthenticationSystem._logAccess(username);
    location.replace("index.html");
  }

  showAlert(msg) {
    const el = document.getElementById("alertMessage");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(() => (el.style.display = "none"), 4000);
  }

  static getCurrentUser() {
    const s = localStorage.getItem("qm_session");
    if (!s) return null;
    try {
      const session = JSON.parse(s);
      if (session?.expires > Date.now()) return session.user || null;
    } catch {}
    return null;
  }

  static hasPermission(_permission) {
    // ログイン済み = 許可（アクセス拒否UIは廃止）
    return !!AuthenticationSystem.getCurrentUser();
  }

  static logout() {
    localStorage.removeItem("qm_session");
    location.replace("login.html");
  }

  static _logAccess(username) {
    try {
      const logs = JSON.parse(localStorage.getItem("qm_access_log") || "[]");
      logs.push({ user: username, time: new Date().toISOString(), ua: navigator.userAgent });
      if (logs.length > 100) logs.splice(0, logs.length - 100);
      localStorage.setItem("qm_access_log", JSON.stringify(logs));
    } catch {}
  }
}
window.auth = new AuthenticationSystem();
