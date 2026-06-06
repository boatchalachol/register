// html/view-login.js — Login view
export const loginHTML = /* html */`

<!-- ══ LOGIN VIEW ══════════════════════════════════════════ -->
<div class="view active" id="view-login">
  <div class="login-wrap">
    <div class="login-logo"><i class="ti ti-map-pin"></i></div>
    <div class="login-title">ระบบลงทะเบียน</div>
    <div class="login-sub">ลงทะเบียนเข้างาน · CHALACHOL GROUP</div>
    <div class="card">
      <div id="loginAlert"></div>
      <div class="lockout-bar" id="lockoutBar"></div>
      <div class="field">
        <label for="loginEmpId">รหัสพนักงาน</label>
        <input type="text" id="loginEmpId" placeholder="เช่น 1234" maxlength="10"
               autocomplete="off" inputmode="numeric" autocapitalize="none" autocorrect="off"
               aria-label="รหัสพนักงาน">
      </div>
      <div class="field">
        <label for="loginPin">รหัสผ่าน (PIN)</label>
        <input type="password" id="loginPin" placeholder="••••" maxlength="8" inputmode="numeric"
               aria-label="PIN" autocomplete="current-password">
      </div>
      <button class="btn" id="btnLogin" aria-label="เข้าสู่ระบบ">
        <i class="ti ti-login"></i> <span>เข้าสู่ระบบ</span>
      </button>
    </div>
  </div>
</div>
`;
