// js/app.js — Entry point
// Imports all HTML partials, assembles the DOM, then initialises the app.
// Load order: overlays → views → admin pages → wire event listeners → boot.

import { overlaysHTML }       from '../html/overlays.js';
import { loginHTML }          from '../html/view-login.js';
import { employeeHTML }       from '../html/view-employee.js';
import { pageQrHTML }         from '../html/page-qr.js';
import { pageManualregHTML }  from '../html/page-manualreg.js';
import { pageWheelHTML }      from '../html/page-wheel.js';
import { pageDashboardHTML }  from '../html/page-dashboard.js';
import { pageSettingsHTML }   from '../html/page-settings.js';
import { pageEmployeesHTML }  from '../html/page-employees.js';

// ── 1. Build full HTML and inject into #app ────────────────
const adminViewHTML = /* html */`
<div class="view" id="view-admin">
  <div class="admin-main">
    ${pageQrHTML}
    ${pageManualregHTML}
    ${pageWheelHTML}
    ${pageDashboardHTML}
    ${pageSettingsHTML}
    ${pageEmployeesHTML}
  </div>
</div>
`;

document.getElementById('app').innerHTML =
  overlaysHTML +
  loginHTML    +
  employeeHTML +
  adminViewHTML;

// ── 2. Guard: check Supabase config ───────────────────────
if (!CONFIG_READY) {
  document.getElementById('view-login').innerHTML = `
    <div style="padding:40px 20px;max-width:460px;width:100%">
      <div style="background:var(--red-bg);border:2px solid var(--red-bd);
                  border-radius:var(--r2);padding:24px;text-align:center">
        <i class="ti ti-alert-triangle"
           style="font-size:36px;color:var(--red);display:block;margin-bottom:12px"></i>
        <h2 style="color:var(--red);margin-bottom:10px;font-size:16px">
          ยังไม่ได้ตั้งค่า Supabase
        </h2>
        <p style="font-size:13px;color:var(--text2);line-height:1.7">
          กรุณาแก้ไขค่าใน
          <code style="background:var(--bg3);padding:2px 6px;border-radius:4px;
                       font-family:var(--mono);font-size:12px;color:var(--amber)">
            js/utils.js
          </code>:<br><br>
          <code style="background:var(--bg3);padding:2px 6px;border-radius:4px;
                       font-family:var(--mono);font-size:12px;color:var(--amber)">
            SUPABASE_URL
          </code> — URL ของ Project<br>
          <code style="background:var(--bg3);padding:2px 6px;border-radius:4px;
                       font-family:var(--mono);font-size:12px;color:var(--amber)">
            SUPABASE_ANON
          </code> — anon/public key
        </p>
      </div>
    </div>`;
} else {
  // ── 3. Boot: init Supabase then wire all event listeners ──
  initSupabase();
  wireEventListeners();
}

// ── 4. Event listeners ────────────────────────────────────
function wireEventListeners() {

  // Login
  document.getElementById('loginPin')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } });
  document.getElementById('btnLogin')
    ?.addEventListener('click', doLogin);

  // Employee flow
  document.getElementById('btnSelectCp')
    ?.addEventListener('click', doSelectCheckpoint);
  document.getElementById('btnBackToCheckpoint')
    ?.addEventListener('click', goBackToCheckpoint);
  document.getElementById('btnConfirmReg')
    ?.addEventListener('click', doRegister);
  document.getElementById('btnResetEmpFlow')
    ?.addEventListener('click', resetEmpFlow);
  document.getElementById('btnGps')
    ?.addEventListener('click', requestGPS);

  // QR scan tabs
  document.getElementById('tabCamera')
    ?.addEventListener('click', () => switchScanTab('camera'));
  document.getElementById('tabPhoto')
    ?.addEventListener('click', () => switchScanTab('photo'));
  document.getElementById('tabManual')
    ?.addEventListener('click', () => switchScanTab('manual'));

  // Photo capture
  document.getElementById('btnOpenCamera')
    ?.addEventListener('click', () => document.getElementById('photoFileInput').click());
  document.getElementById('photoFileInput')
    ?.addEventListener('change', onPhotoSelected);

  // Manual token
  document.getElementById('btnApplyManualToken')
    ?.addEventListener('click', applyManualToken);
  document.getElementById('manualToken')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyManualToken(); } });
  document.getElementById('btnResetScan')
    ?.addEventListener('click', resetScan);

  // Admin: QR page
  document.getElementById('btnGenerateAllQR')
    ?.addEventListener('click', generateAllQR);
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', e => setExpiryPreset(parseFloat(btn.dataset.days || '0'), e));
  });

  // Admin: Settings page
  document.getElementById('btnAddCheckpoint')
    ?.addEventListener('click', addCheckpointRow);
  document.getElementById('btnSaveSettings')
    ?.addEventListener('click', saveSettings);
  document.getElementById('togQR')
    ?.addEventListener('change', syncSettingsUI);
  document.getElementById('togLocation')
    ?.addEventListener('change', syncSettingsUI);

  // Admin: Dashboard page
  document.getElementById('btnDashRefresh')
    ?.addEventListener('click', loadDashboard);
  document.getElementById('btnExportCSV')
    ?.addEventListener('click', exportCSV);

  // Admin: Employees page
  document.getElementById('btnShowAddEmp')
    ?.addEventListener('click', showAddEmpForm);
  document.getElementById('btnSaveNewEmployee')
    ?.addEventListener('click', saveNewEmployee);
  document.getElementById('btnCancelAddEmp')
    ?.addEventListener('click', () => document.getElementById('addEmpForm').style.display = 'none');

  // Admin: Manual reg page
  document.getElementById('mregSearch')
    ?.addEventListener('input', filterMRegEmployees);
  document.getElementById('btnMregStep2')
    ?.addEventListener('click', mregGoStep2);
  document.getElementById('btnMregBack')
    ?.addEventListener('click', mregGoStep1);
  document.getElementById('btnMregConfirm')
    ?.addEventListener('click', mregDoRegister);
  document.getElementById('btnMregReset')
    ?.addEventListener('click', mregReset);
  document.getElementById('btnMregGoDash')
    ?.addEventListener('click', () => showAdminPage('dashboard', null));
  document.getElementById('mregNote')
    ?.addEventListener('input', () => {
      const nc = document.getElementById('mregNoteCount');
      if (nc) nc.textContent = document.getElementById('mregNote').value.length;
    });

  // Admin: Wheel page
  document.getElementById('btnSpin')
    ?.addEventListener('click', spinWheel);
  document.getElementById('btnExcludeWinners')
    ?.addEventListener('click', () => {
      excludeWinners = !excludeWinners;
      document.getElementById('btnExcludeWinners').classList.toggle('active', excludeWinners);
      wheelAngle = 0;
      loadWheelData();
    });
  document.getElementById('btnWheelRefresh')
    ?.addEventListener('click', loadWheelData);
  document.getElementById('btnClearWinners')
    ?.addEventListener('click', clearWinners);
  document.getElementById('wfAll')
    ?.addEventListener('click', () => setWheelFilter('all', document.getElementById('wfAll')));

  // Wheel result modal
  document.getElementById('btnCloseWheelResult')
    ?.addEventListener('click', closeWheelResult);
  document.getElementById('btnSpinAgain')
    ?.addEventListener('click', spinAgain);

  // Resize: confetti canvas + wheel redraw
  window.addEventListener('resize', () => {
    const c = document.getElementById('confettiCanvas');
    if (c && c.style.display !== 'none') {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    if (document.getElementById('apage-wheel')?.classList.contains('active')) drawWheel();
  });
}
