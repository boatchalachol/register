// html/page-dashboard.js — Admin: Dashboard page
export const pageDashboardHTML = /* html */`

<!-- ── Dashboard Page ───────────────────────────────────── -->
<div class="apage" id="apage-dashboard">
  <div class="card">
    <div class="card-title">
      <i class="ti ti-chart-bar" style="color:var(--teal)"></i> Dashboard
    </div>
    <div class="card-sub">ภาพรวมการลงทะเบียนวันนี้และสะสม</div>
    <div class="feature-status-bar" id="dashStatusBar"></div>
    <div id="dashAlert"></div>

    <!-- Stats grid -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">ทั้งหมด (สะสม)</div>
        <div class="stat-num" id="statTotal">—</div>
        <div class="stat-sub">รายการทั้งหมด</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">วันนี้</div>
        <div class="stat-num" style="color:var(--teal)" id="statToday">—</div>
        <div class="stat-sub" id="statTodayDate">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Checkpoint เปิด</div>
        <div class="stat-num" id="statCp">—</div>
        <div class="stat-sub">จุดลงทะเบียน</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">พนักงาน Active</div>
        <div class="stat-num" id="statEmp">—</div>
        <div class="stat-sub">บัญชีที่เปิดใช้</div>
      </div>
    </div>

    <!-- Export row -->
    <div class="export-row">
      <button class="btn btn-outline btn-sm" id="btnDashRefresh">
        <i class="ti ti-refresh"></i> รีเฟรช
      </button>
      <button class="btn btn-outline btn-sm" id="btnExportCSV">
        <i class="ti ti-file-spreadsheet"></i> Export CSV วันนี้
      </button>
    </div>

    <!-- Recent registrations table -->
    <div class="card-title" style="font-size:15px;margin-bottom:14px">
      <i class="ti ti-list" style="color:var(--teal)"></i> รายการล่าสุด (10 รายการ)
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ชื่อพนักงาน</th>
            <th>Checkpoint</th>
            <th>เวลา</th>
            <th>ประเภท</th>
            <th id="thDist" style="display:none">ระยะ (ม.)</th>
          </tr>
        </thead>
        <tbody id="recentTable">
          <tr>
            <td colspan="5" style="text-align:center;color:var(--text3);padding:20px">
              ยังไม่มีข้อมูล
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`;
