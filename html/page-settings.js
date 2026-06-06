// html/page-settings.js — Admin: System settings page
export const pageSettingsHTML = /* html */`

<!-- ── Settings Page ────────────────────────────────────── -->
<div class="apage" id="apage-settings">
  <div class="card">
    <div class="card-title">
      <i class="ti ti-settings" style="color:var(--amber)"></i> ตั้งค่าระบบ
    </div>
    <div class="card-sub">เปิด/ปิด QR Token และ GPS Location — แก้ไข Checkpoints</div>

    <!-- Registration flow preview -->
    <div class="flow-map">
      <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <i class="ti ti-route"></i> ขั้นตอนการลงทะเบียน (ปัจจุบัน)
      </div>
      <div class="flow-steps" id="flowPreview"></div>
    </div>

    <div id="settingsAlert"></div>

    <!-- QR Token toggle -->
    <p class="section-head"><i class="ti ti-qrcode"></i> QR Token</p>
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-label">
          <i class="ti ti-qrcode" style="color:var(--amber)"></i> เปิดใช้งาน QR Token
        </div>
        <div class="toggle-sub">พนักงานต้องสแกน QR ที่จุดลงทะเบียน</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="togQR" checked aria-label="เปิด/ปิด QR Token">
        <div class="toggle-track"></div><div class="toggle-thumb"></div>
      </label>
    </div>

    <!-- GPS Location toggle -->
    <p class="section-head"><i class="ti ti-satellite"></i> GPS Location</p>
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-label">
          <i class="ti ti-map-pin" style="color:var(--teal)"></i> เปิดใช้งาน GPS Location
        </div>
        <div class="toggle-sub">ระบบจะขอพิกัดจากมือถือพนักงาน</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="togLocation" aria-label="เปิด/ปิด GPS Location">
        <div class="toggle-track"></div><div class="toggle-thumb"></div>
      </label>
    </div>

    <!-- Radius Lock sub-option -->
    <div id="gpsSubOptions"
         style="padding-left:16px;border-left:2px solid var(--teal-bd);margin-bottom:16px">
      <div class="toggle-row" style="background:transparent;border-color:transparent;padding-left:0">
        <div class="toggle-info">
          <div class="toggle-label" style="font-size:13px">
            <i class="ti ti-current-location" style="color:var(--amber)"></i>
            บังคับรัศมี (Radius Lock)
          </div>
          <div class="toggle-sub">ปฏิเสธถ้าอยู่ไกลเกิน MaxRadius ที่กำหนด</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="togRadius" aria-label="เปิด/ปิด Radius Lock">
          <div class="toggle-track"></div><div class="toggle-thumb"></div>
        </label>
      </div>
    </div>

    <!-- Checkpoints list -->
    <p class="section-head"><i class="ti ti-map-pin"></i> Checkpoints</p>
    <div id="cpSettingsList"></div>
    <button class="btn btn-outline mt8" id="btnAddCheckpoint" style="margin-bottom:10px">
      <i class="ti ti-plus"></i> เพิ่ม Checkpoint ใหม่
    </button>

    <div class="divider"></div>

    <!-- Vote Score Settings -->
    <p class="section-head"><i class="ti ti-trophy"></i> ตั้งค่าคะแนนโหวต</p>
    <div class="toggle-row" style="display:block;padding:16px">
      <div style="font-size:13px;color:var(--text2);margin-bottom:14px">กำหนดคะแนนสูงสุดที่แต่ละ Role ให้ได้ต่อการโหวต 1 ครั้ง</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label for="voteScoreUserInput" style="font-size:12px;font-weight:600;color:var(--teal);display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <i class="ti ti-user"></i> User — คะแนนสูงสุด
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="voteScoreUserInput" min="1" max="100" value="10" step="1"
              style="flex:1;padding:8px 10px;background:var(--bg3);border:1.5px solid var(--border2);border-radius:8px;color:var(--text1);font-size:15px;font-weight:700;font-family:var(--mono)"
              aria-label="คะแนนสูงสุด User">
            <span style="font-size:12px;color:var(--text3)">คะแนน</span>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">ช่วง: 1 – ค่านี้ (ทีละ 1)</div>
        </div>
        <div>
          <label for="voteScoreSuperInput" style="font-size:12px;font-weight:600;color:var(--purple,#9b6dff);display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <i class="ti ti-star"></i> Super User — คะแนนสูงสุด
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="voteScoreSuperInput" min="10" max="1000" value="100" step="5"
              style="flex:1;padding:8px 10px;background:var(--bg3);border:1.5px solid var(--border2);border-radius:8px;color:var(--text1);font-size:15px;font-weight:700;font-family:var(--mono)"
              aria-label="คะแนนสูงสุด Super User">
            <span style="font-size:12px;color:var(--text3)">คะแนน</span>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">ช่วง: 10 – ค่านี้ (ทีละ 5 หรือ 10)</div>
        </div>
      </div>
      <div style="margin-top:10px;padding:10px 12px;background:var(--amber-bg);border:1px solid var(--amber-bd);border-radius:8px;font-size:12px;color:var(--amber)">
        <i class="ti ti-info-circle"></i> ตัวอย่าง: Super User = <strong>5</strong> → ให้ได้ 5, 10, 15 ... ไม่เกิน 5 คะแนน (บันทึกพร้อมกับ Checkpoints ด้านบน)
      </div>
    </div>

    <div class="divider"></div>
    <button class="btn btn-amber" id="btnSaveSettings">
      <i class="ti ti-device-floppy"></i> บันทึกการตั้งค่าทั้งหมด
    </button>
  </div>
</div>
`;
