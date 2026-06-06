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
    <button class="btn btn-amber" id="btnSaveSettings">
      <i class="ti ti-device-floppy"></i> บันทึกการตั้งค่าทั้งหมด
    </button>
  </div>
</div>
`;
