// ══ ADMIN HEADER ════════════════════════════════════════════
function setupAdminHeader(){
  document.getElementById('mainHeader').style.display='flex';
  document.getElementById('headerLogo').className='h-logo admin-logo';
  document.getElementById('headerLogo').innerHTML='<i class="ti ti-shield-lock"></i>';
  document.getElementById('headerTitle').textContent='Admin Panel';
  document.getElementById('headerSub').textContent='Admin: '+(currentUser.name||'');
  document.getElementById('headerRight').innerHTML=`<div class="h-tabs">
    <button class="htab active" data-page="qr"><i class="ti ti-qrcode"></i><span> QR</span></button>
    <button class="htab" data-page="manualreg"><i class="ti ti-clipboard-check"></i><span> ลงทะเบียนแทน</span></button>
    <button class="htab" data-page="wheel"><i class="ti ti-wheel"></i><span> สุ่มรางวัล</span></button>
    <button class="htab" data-page="dashboard"><i class="ti ti-chart-bar"></i><span> Dashboard</span></button>
    <button class="htab" data-page="settings"><i class="ti ti-settings"></i><span> ตั้งค่า</span></button>
    <button class="htab" data-page="employees"><i class="ti ti-users"></i><span> พนักงาน</span></button>
    <button class="htab htab-danger" id="btnAdminLogout" title="ออกจากระบบ" aria-label="ออกจากระบบ"><i class="ti ti-logout"></i></button>
  </div>`;
  document.getElementById('headerRight').addEventListener('click',e=>{
    const btn=e.target.closest('[data-page]');
    if(btn)showAdminPage(btn.dataset.page,btn);
    const logoutBtn=e.target.closest('#btnAdminLogout');
    if(logoutBtn)doLogout();
  });
}
function showAdminPage(name,btnEl){
  if(wheelAnimFrame){cancelAnimationFrame(wheelAnimFrame);wheelAnimFrame=null;}
  if(dashRefreshTimer){clearInterval(dashRefreshTimer);dashRefreshTimer=null;}
  document.querySelectorAll('.apage').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.htab').forEach(t=>t.classList.remove('active'));
  const page=document.getElementById('apage-'+name);if(page)page.classList.add('active');
  if(btnEl instanceof Element)btnEl.classList.add('active');
  if(name==='dashboard'){loadDashboard();dashRefreshTimer=setInterval(loadDashboard,60000);}
  if(name==='employees')loadEmployees().then(renderEmployeeTable);
  if(name==='settings'){loadCheckpoints().then(()=>{renderCpSettings();});syncSettingsUI();}
  if(name==='qr')refreshQRPage();
  if(name==='manualreg')initMRegPage();
  if(name==='wheel')initWheelPage();
}

// ══ ADMIN INIT ══════════════════════════════════════════════
async function initAdmin(){
  await Promise.all([loadCheckpoints(),loadEmployees(),loadSettingsAdmin(),loadQRTokens()]);
  syncSettingsUI();renderQRGrid();loadDashboard();renderEmployeeTable();renderCpSettings();
}
async function loadCheckpoints(){try{adminCheckpoints=await sbGetCheckpoints(false);}catch(e){adminCheckpoints=[];}}
async function loadEmployees(){try{adminEmployees=await sbGetEmployees();}catch(e){adminEmployees=[];}}
async function loadSettingsAdmin(){
  try{
    const s=await sbGetSettings();
    const t=v=>v===true||v==='true';
    featureFlags.qrEnabled=s.QREnabled!=='false';
    featureFlags.locationEnabled=t(s.LocationEnabled);
    featureFlags.radiusEnabled=t(s.RadiusLockEnabled);
    const togQR=document.getElementById('togQR');
    const togLoc=document.getElementById('togLocation');
    const togRad=document.getElementById('togRadius');
    if(togQR)togQR.checked=featureFlags.qrEnabled;
    if(togLoc)togLoc.checked=featureFlags.locationEnabled;
    if(togRad)togRad.checked=featureFlags.radiusEnabled;
  }catch(e){console.error('loadSettingsAdmin error:',e);}
}
async function loadQRTokens(){try{adminQRTokens=await sbGetQRTokens(true);}catch(e){adminQRTokens=[];}}

// ══ QR ADMIN ════════════════════════════════════════════════
function setExpiryPreset(days,e){
  const el=document.getElementById('qrExpiryInput');if(!el)return;
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.remove('active-preset'));
  if(e&&e.target)e.target.classList.add('active-preset');
  if(days===0){el.value='';return;}
  const d=new Date(Date.now()+days*86400000);
  el.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
    +'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
async function generateAllQR(){
  const expiryLocal=document.getElementById('qrExpiryInput')?.value||'';
  const expiryISO=expiryLocal?localDtToISO(expiryLocal):null;
  showLoading('กำลังสร้าง QR Code ทั้งหมด...');
  try{
    const d=await sbGenerateQR(null,expiryISO,true);
    if(!d.ok)throw new Error('สร้างไม่สำเร็จ');
    await loadQRTokens();renderQRGrid();
    showAlert('qrAdminAlert',`✅ สร้าง QR ใหม่ ${d.created.length} จุดสำเร็จ`,'success');
    setTimeout(()=>showAlert('qrAdminAlert','',''),4000);
  }catch(e){showAlert('qrAdminAlert','สร้างไม่ได้: '+e.message,'error');}
  finally{hideLoading();}
}
async function regenerateOne(cpId){
  const expiryLocal=document.getElementById('qrExpiryInput')?.value||'';
  const expiryISO=expiryLocal?localDtToISO(expiryLocal):null;
  showLoading('กำลังสร้าง QR ใหม่...');
  try{
    await sbGenerateQR(cpId,expiryISO,true);await loadQRTokens();renderQRGrid();
    showAlert('qrAdminAlert','✅ สร้าง QR ใหม่สำเร็จ','success');
    setTimeout(()=>showAlert('qrAdminAlert','',''),3000);
  }catch(e){showAlert('qrAdminAlert','สร้างไม่ได้: '+e.message,'error');}
  finally{hideLoading();}
}
async function refreshQRPage(){await loadQRTokens();renderQRGrid();}
function renderQRGrid(){
  clearAllTimers();
  const grid=document.getElementById('qrGrid');if(!grid)return;
  if(!adminQRTokens.length){
    grid.innerHTML=`<div style="color:var(--text3);font-size:13px;padding:24px;text-align:center;grid-column:1/-1">
      <i class="ti ti-qrcode-off" style="font-size:32px;display:block;margin-bottom:10px;opacity:.4"></i>
      ยังไม่มี QR Token<br>กดปุ่ม <strong>สร้างใหม่ทั้งหมด</strong> เพื่อสร้าง
    </div>`;return;
  }
  grid.innerHTML='';
  adminQRTokens.forEach(t=>{
    const card=document.createElement('div');
    card.className='qr-card';card.id=`qrcard-${t.cp_id}`;
    let expHtml='';
    if(!t.expires_at){
      expHtml='<div class="qr-expires no-exp"><i class="ti ti-infinity" style="font-size:11px"></i> ไม่หมดอายุ</div>';
    }else{
      const expDate=new Date(t.expires_at);const expired=expDate<new Date();
      expHtml=`<div class="qr-expires ${expired?'expired':'has-exp'}" id="qrexp-${escHtml(t.cp_id)}">
        ${expired?'❌ หมดอายุแล้ว':'⏱ <span id="qrtimer-'+escHtml(t.cp_id)+'">...</span>'}
      </div>`;
    }
    card.innerHTML=`
      <div class="qr-card-name">${escHtml(t.cp_name)}</div>
      <div class="qr-card-id">${escHtml(t.cp_id)}</div>
      <div class="qr-canvas-wrap" id="qrwrap-${escHtml(t.cp_id)}"></div>
      ${expHtml}
      <div class="qr-token-label">${escHtml(t.token)}</div>
      <div class="qr-actions">
        <button class="btn btn-outline" data-regen-cp="${escHtml(t.cp_id)}"><i class="ti ti-refresh"></i> รีเจน</button>
        <button class="btn btn-amber" data-dl-cp="${escHtml(t.cp_id)}" data-dl-name="${escHtml(t.cp_name)}"><i class="ti ti-download"></i> บันทึก</button>
      </div>`;
    grid.appendChild(card);
    card.addEventListener('click',ev=>{
      const regenBtn=ev.target.closest('[data-regen-cp]');
      if(regenBtn){regenerateOne(regenBtn.dataset.regenCp);return;}
      const dlBtn=ev.target.closest('[data-dl-cp]');
      if(dlBtn){downloadQR(dlBtn.dataset.dlCp,dlBtn.dataset.dlName);return;}
    });
    const wrap=document.getElementById(`qrwrap-${t.cp_id}`);
    if(wrap){wrap.innerHTML='';try{new QRCode(wrap,{text:t.token,width:160,height:160,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.H});}catch(_){}}
    if(t.expires_at){const expDate=new Date(t.expires_at);if(expDate>new Date())startCountdown(t.cp_id,expDate);}
  });
}
function startCountdown(cpId,expiryDate){
  if(qrTimers[cpId])clearInterval(qrTimers[cpId]);
  const tick=()=>{
    const diff=expiryDate-Date.now();
    const expEl=document.getElementById(`qrexp-${cpId}`);if(!expEl)return;
    if(diff<=0){clearInterval(qrTimers[cpId]);delete qrTimers[cpId];expEl.className='qr-expires expired';expEl.innerHTML='❌ หมดอายุแล้ว!';return;}
    const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    const timerEl=document.getElementById(`qrtimer-${cpId}`);
    if(timerEl)timerEl.textContent=`${h>0?h+'ช. ':''}${m}:${String(s).padStart(2,'0')}`;
  };
  tick();qrTimers[cpId]=setInterval(tick,1000);
}
function downloadQR(cpId,cpName){
  const wrap=document.getElementById(`qrwrap-${cpId}`);if(!wrap)return;
  const canvas=wrap.querySelector('canvas');
  const img=wrap.querySelector('img');
  let src=null;
  if(canvas){try{src=canvas.toDataURL('image/png');}catch(_){}}
  if(!src&&img&&img.src)src=img.src;
  if(!src){showAlert('qrAdminAlert','ไม่สามารถดาวน์โหลด QR ได้','error');return;}
  const a=document.createElement('a');a.href=src;
  a.download=`QR-${(cpName||cpId).replace(/\s+/g,'_')}-${cpId}.png`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
}

// ══ SETTINGS ════════════════════════════════════════════════
function syncSettingsUI(){
  const qrOn=document.getElementById('togQR')?.checked??true;
  const locOn=document.getElementById('togLocation')?.checked??false;
  featureFlags.qrEnabled=qrOn;featureFlags.locationEnabled=locOn;
  const gs=document.getElementById('gpsSubOptions');
  if(gs){gs.style.opacity=locOn?'1':'0.35';gs.style.pointerEvents=locOn?'':'none';}
  if(!locOn){const r=document.getElementById('togRadius');if(r)r.checked=false;}
  const ts=document.getElementById('qrTokenSection'),to=document.getElementById('qrTokenOff');
  if(ts)ts.style.display=qrOn?'':'none';
  if(to)to.style.display=qrOn?'none':'';
  const pill=(icon,label,on)=>`<div class="fs-pill ${on?'on':'off'}"><div class="fs-dot"></div><i class="ti ${icon}" style="font-size:12px"></i> ${label}: <strong>${on?'เปิด':'ปิด'}</strong></div>`;
  const barHtml=pill('ti-qrcode','QR Token',qrOn)+pill('ti-map-pin','GPS Location',locOn);
  ['qrPageStatusBar','dashStatusBar'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=barHtml;});
  const fp=document.getElementById('flowPreview');
  if(fp){
    const step=(icon,label,active)=>`<div class="flow-step ${active?'active-step':'skip-step'}"><i class="ti ${icon}" style="font-size:12px"></i> ${label}</div>`;
    const arrow=`<span class="flow-arrow"><i class="ti ti-chevron-right"></i></span>`;
    fp.innerHTML=step('ti-login','เข้าสู่ระบบ',true)+arrow+step('ti-map-pin','เลือก CP',true)+arrow
      +step('ti-qrcode','สแกน QR',qrOn)+arrow+step('ti-satellite','GPS',locOn)+arrow
      +step('ti-check','ยืนยัน',true);
  }
  const td=document.getElementById('thDist');if(td)td.style.display=locOn?'':'none';
}
function syncCpFromDOM(){
  adminCheckpoints.forEach(cp=>{
    const n=document.getElementById('cpname-'+cp.id);
    const la=document.getElementById('cplat-'+cp.id);
    const lo=document.getElementById('cplng-'+cp.id);
    const r=document.getElementById('cprad-'+cp.id);
    if(n&&n.value.trim())cp.name=n.value.trim();
    if(la&&la.value&&isValidLat(la.value))cp.lat=parseFloat(la.value);
    if(lo&&lo.value&&isValidLng(lo.value))cp.lng=parseFloat(lo.value);
    if(r&&r.value){const rv=parseInt(r.value);if(!isNaN(rv)&&rv>=0)cp.max_radius=rv;}
  });
}
function renderCpSettings(){
  const list=document.getElementById('cpSettingsList');if(!list)return;
  if(!adminCheckpoints.length){list.innerHTML='<div style="color:var(--text3);font-size:13px;padding:12px;text-align:center">ยังไม่มี Checkpoint — กด เพิ่ม</div>';return;}
  list.innerHTML='';
  adminCheckpoints.forEach(cp=>{
    const row=document.createElement('div');row.className='cp-setting-row';
    row.innerHTML=`<div class="cp-setting-header">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <i class="ti ti-map-pin" style="color:var(--text3);font-size:14px;flex-shrink:0"></i>
          <input type="text" value="${escHtml(cp.name)}" id="cpname-${escHtml(cp.id)}"
            aria-label="ชื่อ Checkpoint"
            style="background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--text);font-size:14px;font-weight:600;font-family:var(--font);outline:none;padding-bottom:2px;transition:border .2s;flex:1;min-width:0">
          <span style="font-family:var(--mono);font-size:10px;color:var(--text3);flex-shrink:0">${escHtml(cp.id)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="badge ${cp.is_active?'b-teal':'b-gray'}">${cp.is_active?'เปิด':'ปิด'}</span>
          <label class="toggle" aria-label="เปิด/ปิด Checkpoint ${escHtml(cp.name)}">
            <input type="checkbox" ${cp.is_active?'checked':''} data-toggle-cp="${escHtml(cp.id)}">
            <div class="toggle-track"></div><div class="toggle-thumb"></div>
          </label>
          <button data-remove-cp="${escHtml(cp.id)}"
            style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px;padding:2px;line-height:1"
            aria-label="ลบ ${escHtml(cp.name)}">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>
      <div class="cp-setting-fields">
        <div class="cp-field-mini"><label>Latitude</label>
          <input type="number" value="${cp.lat}" id="cplat-${escHtml(cp.id)}" step="0.000001"
            min="-90" max="90" placeholder="เช่น 13.7563" aria-label="Latitude"></div>
        <div class="cp-field-mini"><label>Longitude</label>
          <input type="number" value="${cp.lng}" id="cplng-${escHtml(cp.id)}" step="0.000001"
            min="-180" max="180" placeholder="เช่น 100.5018" aria-label="Longitude"></div>
        <div class="cp-field-mini"><label>รัศมีสูงสุด (เมตร)</label>
          <input type="number" value="${cp.max_radius||300}" id="cprad-${escHtml(cp.id)}"
            min="10" max="10000" placeholder="300" aria-label="รัศมีสูงสุด"></div>
      </div>`;
    row.addEventListener('change',ev=>{
      const tog=ev.target.closest('[data-toggle-cp]');
      if(tog)toggleCpActive(tog.dataset.toggleCp,tog.checked);
    });
    row.addEventListener('click',ev=>{
      const rmBtn=ev.target.closest('[data-remove-cp]');
      if(rmBtn)removeCp(rmBtn.dataset.removeCp);
    });
    const nameIn=row.querySelector(`#cpname-${cp.id}`);
    if(nameIn){
      nameIn.addEventListener('focus',()=>nameIn.style.borderBottomColor='var(--teal)');
      nameIn.addEventListener('blur',()=>nameIn.style.borderBottomColor='var(--border2)');
    }
    list.appendChild(row);
  });
}
function toggleCpActive(cpId,checked){
  syncCpFromDOM();
  const cp=adminCheckpoints.find(c=>c.id===cpId);
  if(cp){cp.is_active=checked;renderCpSettings();}
}
function removeCp(cpId){
  syncCpFromDOM();
  const cp=adminCheckpoints.find(c=>c.id===cpId);
  if(!confirm(`ยืนยันลบ Checkpoint "${cp?.name||cpId}"?\nรายการลงทะเบียนเก่าจะยังคงอยู่`))return;
  adminCheckpoints=adminCheckpoints.filter(c=>c.id!==cpId);
  renderCpSettings();
}
function addCheckpointRow(){
  syncCpFromDOM();
  const newId=genCpId();
  adminCheckpoints.push({id:newId,name:'Checkpoint ใหม่',lat:13.7563,lng:100.5018,max_radius:300,is_active:true});
  renderCpSettings();
  setTimeout(()=>document.getElementById('cpname-'+newId)?.focus(),100);
}
async function saveSettings(){
  syncCpFromDOM();
  for(const cp of adminCheckpoints){
    if(!isValidLat(cp.lat)||!isValidLng(cp.lng)){
      showAlert('settingsAlert',`Checkpoint "${cp.name}" มีค่า Lat/Lng ไม่ถูกต้อง`,'error');return;
    }
  }
  const togQR=document.getElementById('togQR');
  const togLoc=document.getElementById('togLocation');
  const togRad=document.getElementById('togRadius');
  const settings={
    QREnabled:togQR?togQR.checked:featureFlags.qrEnabled,
    LocationEnabled:togLoc?togLoc.checked:featureFlags.locationEnabled,
    RadiusLockEnabled:togRad?togRad.checked:featureFlags.radiusEnabled
  };
  featureFlags.qrEnabled=settings.QREnabled;
  featureFlags.locationEnabled=settings.LocationEnabled;
  featureFlags.radiusEnabled=settings.RadiusLockEnabled;
  showLoading('กำลังบันทึกการตั้งค่า...');
  try{
    await sbSaveSettings(settings);
    await sbSaveCheckpoints(adminCheckpoints);
    hideLoading();
    showAlert('settingsAlert','✅ บันทึกการตั้งค่าทั้งหมดสำเร็จ','success');
    syncSettingsUI();
  }catch(e){hideLoading();showAlert('settingsAlert','บันทึกไม่ได้: '+e.message,'error');}
  setTimeout(()=>showAlert('settingsAlert','',''),4000);
}

// ══ MANUAL REG ══════════════════════════════════════════════
function initMRegPage(){
  mregSelEmp=null;mregSelCp=null;
  showAlert('mregAlert','','');
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep1').classList.add('active');
  updateMRegStepBar(1);
  const s=document.getElementById('mregSearch');if(s){s.value='';s.focus();}
  renderMRegEmpList('');
}
function updateMRegStepBar(step){
  for(let i=1;i<=3;i++){
    const d=document.getElementById('msdot'+i);if(!d)continue;
    if(i<step)d.className='mreg-sdot done';
    else if(i===step)d.className='mreg-sdot active';
    else d.className='mreg-sdot';
  }
}
function filterMRegEmployees(){
  const q=(document.getElementById('mregSearch')?.value||'').toLowerCase();
  renderMRegEmpList(q);
}
function renderMRegEmpList(query){
  const list=document.getElementById('mregEmpList');if(!list)return;
  if(adminEmployees===null||adminEmployees===undefined){
    list.innerHTML='<div class="mreg-no-results"><div class="spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto 6px"></div>กำลังโหลด...</div>';
    setBtn('btnMregStep2',true);return;
  }
  const filtered=adminEmployees.filter(e=>
    e.is_active&&(!query||
      e.name.toLowerCase().includes(query)||
      e.id.toLowerCase().includes(query)||
      (e.branch||'').toLowerCase().includes(query)||
      (e.position||'').toLowerCase().includes(query)
    )
  );
  if(!filtered.length){
    list.innerHTML=`<div class="mreg-no-results">
      <i class="ti ti-users-off" style="font-size:22px;display:block;margin-bottom:6px;opacity:.4"></i>
      ${adminEmployees.length?'ไม่พบพนักงานที่ค้นหา':'ยังไม่มีข้อมูลพนักงาน'}
    </div>`;
    setBtn('btnMregStep2',true);return;
  }
  list.innerHTML='';
  filtered.forEach(e=>{
    const item=document.createElement('div');
    item.className='mreg-emp-item'+(mregSelEmp?.id===e.id?' sel':'');
    item.setAttribute('role','button');
    item.setAttribute('tabindex','0');
    item.innerHTML=`<div class="mreg-emp-av"><i class="ti ti-user"></i></div>
      <div style="flex:1;min-width:0">
        <div class="mreg-emp-name">${escHtml(e.name)}</div>
        <div class="mreg-emp-meta">${escHtml(e.id)}${e.branch?' · '+escHtml(e.branch):''}${e.position?' · '+escHtml(e.position):''}</div>
      </div>
      ${mregSelEmp?.id===e.id?'<i class="ti ti-circle-check" style="color:var(--teal);font-size:18px;flex-shrink:0"></i>':''}`;
    item.addEventListener('click',()=>selectMRegEmp(e.id));
    item.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' ')selectMRegEmp(e.id);});
    list.appendChild(item);
  });
  setBtn('btnMregStep2',!mregSelEmp);
}
function selectMRegEmp(empId){
  mregSelEmp=adminEmployees.find(e=>e.id===empId)||null;
  filterMRegEmployees();
  setBtn('btnMregStep2',!mregSelEmp);
}
function mregGoStep1(){
  mregSelCp=null;
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep1').classList.add('active');
  updateMRegStepBar(1);showAlert('mregAlert','','');
}
function mregGoStep2(){
  if(!mregSelEmp){showAlert('mregAlert','กรุณาเลือกพนักงานก่อน','warn');return;}
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep2').classList.add('active');
  updateMRegStepBar(2);
  document.getElementById('mregSelEmpName').textContent=mregSelEmp.name;
  document.getElementById('mregSelEmpId').textContent=mregSelEmp.id;
  document.getElementById('mregSelEmpBranch').textContent=[mregSelEmp.branch,mregSelEmp.position].filter(Boolean).join(' · ')||'—';
  renderMRegCpList();
  setBtn('btnMregConfirm',true);
  const n=document.getElementById('mregNote');if(n)n.value='';
  const nc=document.getElementById('mregNoteCount');if(nc)nc.textContent='0';
  showAlert('mregAlert','','');
}
function renderMRegCpList(){
  const list=document.getElementById('mregCpList');if(!list)return;
  const cps=adminCheckpoints.filter(c=>c.is_active!==false);
  if(!cps.length){
    list.innerHTML='<div class="mreg-no-results">ไม่มี Checkpoint ที่เปิดใช้งาน</div>';return;
  }
  list.innerHTML='';
  cps.forEach(cp=>{
    const item=document.createElement('div');
    item.className='mreg-cp-item'+(mregSelCp?.id===cp.id?' sel':'');
    item.setAttribute('role','button');item.setAttribute('tabindex','0');
    item.innerHTML=`<div class="mreg-cp-ico"><i class="ti ti-map-pin"></i></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;margin-bottom:2px">${escHtml(cp.name)}</div>
        <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${escHtml(cp.id)} · รัศมี ${escHtml(String(cp.max_radius||300))} ม.</div>
      </div>
      ${mregSelCp?.id===cp.id?'<i class="ti ti-circle-check" style="color:var(--purple);font-size:18px;flex-shrink:0"></i>':''}`;
    item.addEventListener('click',()=>selectMRegCp(cp.id));
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')selectMRegCp(cp.id);});
    list.appendChild(item);
  });
}
function selectMRegCp(cpId){
  mregSelCp=adminCheckpoints.find(c=>c.id===cpId)||null;
  renderMRegCpList();
  setBtn('btnMregConfirm',!mregSelCp);
}
async function mregDoRegister(){
  if(!mregSelEmp){showAlert('mregAlert','กรุณาเลือกพนักงาน','warn');return;}
  if(!mregSelCp){showAlert('mregAlert','กรุณาเลือก Checkpoint','warn');return;}
  const note=(document.getElementById('mregNote')?.value||'').trim().slice(0,500);
  showLoading('กำลังลงทะเบียนแทน...');
  try{
    const res=await sbRegister({
      empId:mregSelEmp.id,empName:mregSelEmp.name,
      branch:mregSelEmp.branch||'',position:mregSelEmp.position||'',
      cpId:mregSelCp.id,cpName:mregSelCp.name,
      userLat:null,userLng:null,accuracy:null,distanceM:0,
      qrToken:null,isManual:true,adminId:currentUser.id,note
    });
    if(!res.ok){showAlert('mregAlert',res.msg,'error');return;}
    const ts=new Date(res.ts);
    document.getElementById('mregSuccessSub').textContent=`${mregSelEmp.name} → ${mregSelCp.name}`;
    const noteHtml=note?`<div class="info-cell ic-span"><div class="ic-lbl">หมายเหตุ</div><div class="ic-val" style="font-size:12px;font-weight:400;color:var(--text2)">${escHtml(note)}</div></div>`:'';
    document.getElementById('mregSuccessGrid').innerHTML=`
      <div class="info-cell"><div class="ic-lbl">พนักงาน</div><div class="ic-val">${escHtml(mregSelEmp.name)}</div></div>
      <div class="info-cell"><div class="ic-lbl">รหัส</div><div class="ic-val" style="font-family:var(--mono)">${escHtml(mregSelEmp.id)}</div></div>
      <div class="info-cell"><div class="ic-lbl">Checkpoint</div><div class="ic-val">${escHtml(mregSelCp.name)}</div></div>
      <div class="info-cell"><div class="ic-lbl">เวลา</div><div class="ic-val teal">${ts.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})}</div></div>
      <div class="info-cell"><div class="ic-lbl">Admin</div><div class="ic-val" style="font-family:var(--mono);font-size:12px">${escHtml(currentUser.id)}</div></div>
      <div class="info-cell"><div class="ic-lbl">Reg ID</div><div class="ic-val" style="font-family:var(--mono);font-size:11px">${escHtml(res.regId)}</div></div>
      ${noteHtml}`;
    document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
    document.getElementById('mstep3').classList.add('active');
    updateMRegStepBar(3);
  }catch(err){showAlert('mregAlert','เกิดข้อผิดพลาด: '+err.message,'error');}
  finally{hideLoading();}
}
function mregReset(){
  mregSelEmp=null;mregSelCp=null;
  document.querySelectorAll('.mreg-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('mstep1').classList.add('active');
  updateMRegStepBar(1);
  const s=document.getElementById('mregSearch');if(s){s.value='';s.focus();}
  renderMRegEmpList('');showAlert('mregAlert','','');
}

// ══ LUCKY WHEEL ══════════════════════════════════════════════
async function initWheelPage(){
  showAlert('wheelAlert','','');excludeWinners=false;
  const btn=document.getElementById('btnExcludeWinners');
  if(btn)btn.classList.remove('active');
  const cpBtns=document.getElementById('wfCpBtns');
  if(cpBtns){
    cpBtns.innerHTML='';
    adminCheckpoints.filter(c=>c.is_active!==false).forEach(cp=>{
      const b=document.createElement('button');
      b.className='wheel-filter-btn';
      b.id='wf-'+cp.id;
      b.dataset.cpFilter=cp.id;
      b.textContent=cp.name;
      b.addEventListener('click',()=>setWheelFilter(cp.id,b));
      cpBtns.appendChild(b);
    });
  }
  await loadWheelData();
}
async function loadWheelData(){
  try{
    const all=await sbGetTodayRegistrations(wheelFilterCp);
    wheelParticipants=excludeWinners?all.filter(p=>!wheelWinners.find(w=>w.emp_id===p.emp_id)):all;
    const total=all.length;
    const excluded=total-wheelParticipants.length;
    document.getElementById('wheelCount').textContent=
      `ผู้เข้าร่วม ${wheelParticipants.length} คน${excluded?' (ตัดออก '+excluded+' คน)':''}`;
    drawWheel();
    setBtn('btnSpin',wheelParticipants.length<1);
    if(wheelParticipants.length===0&&total>0){
      showAlert('wheelAlert','ผู้เข้าร่วมทั้งหมดได้รับรางวัลแล้ว! กด "ล้างรายการ" เพื่อเริ่มใหม่','info');
    }else{
      showAlert('wheelAlert','','');
    }
  }catch(e){showAlert('wheelAlert','โหลดข้อมูลไม่ได้: '+e.message,'error');}
}
function setWheelFilter(cpId,el){
  wheelFilterCp=cpId;
  document.querySelectorAll('.wheel-filter-btn').forEach(b=>b.classList.remove('wf-active'));
  if(el)el.classList.add('wf-active');
  wheelAngle=0;
  loadWheelData();
}
function getWheelSize(){
  const container=document.getElementById('wheelCanvas')?.parentElement;
  if(!container)return 320;
  return Math.min(container.clientWidth||320,340);
}
function drawWheel(){
  const canvas=document.getElementById('wheelCanvas');if(!canvas)return;
  const size=getWheelSize();
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');
  const cx=size/2,cy=size/2,r=size/2-4;
  const n=wheelParticipants.length;
  ctx.clearRect(0,0,size,size);
  if(n===0){
    ctx.save();
    ctx.fillStyle='#1c2335';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#4e576e';ctx.font=`${Math.max(12,size*0.042)}px 'Noto Sans Thai',sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('ยังไม่มีผู้เข้าร่วม',cx,cy);
    ctx.restore();return;
  }
  const arc=Math.PI*2/n;
  for(let i=0;i<n;i++){
    const startAngle=wheelAngle+arc*i-Math.PI/2;
    const endAngle=startAngle+arc;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,startAngle,endAngle);ctx.closePath();
    ctx.fillStyle=WHEEL_COLORS[i%WHEEL_COLORS.length];ctx.fill();
    ctx.strokeStyle='rgba(10,13,20,0.55)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.save();
    const midAngle=startAngle+arc/2;
    const labelR=r*(n>6?0.70:0.65);
    const lx=cx+Math.cos(midAngle)*labelR;
    const ly=cy+Math.sin(midAngle)*labelR;
    ctx.translate(lx,ly);ctx.rotate(midAngle+Math.PI/2);
    const name=wheelParticipants[i].emp_name||'';
    const maxLen=n>8?5:n>4?7:9;
    const shortName=name.length>maxLen?name.slice(0,maxLen-1)+'…':name;
    const fs=Math.max(10,Math.min(15,r*0.085,r*1.8/n));
    ctx.font=`700 ${fs}px 'Noto Sans Thai',sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillText(shortName,1,1);
    ctx.fillStyle='#fff';ctx.fillText(shortName,0,0);
    ctx.restore();
  }
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=3;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,r*0.20,0,Math.PI*2);
  ctx.fillStyle='#0a0d14';ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=2;ctx.stroke();
}
function spinWheel(){
  if(wheelSpinning||wheelParticipants.length<1)return;
  wheelSpinning=true;setBtn('btnSpin',true);
  showAlert('wheelAlert','','');
  const n=wheelParticipants.length;
  const winnerIdx=Math.floor(Math.random()*n);
  const arcPerSlice=Math.PI*2/n;
  const extraSpins=6+Math.floor(Math.random()*6);
  const sliceCenter=winnerIdx*arcPerSlice+arcPerSlice/2;
  const currentNorm=((wheelAngle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  const targetNorm=((Math.PI*2)-sliceCenter+Math.PI*2)%(Math.PI*2);
  let delta=(targetNorm-currentNorm+Math.PI*4)%(Math.PI*2);
  if(delta<0.1)delta+=Math.PI*2;
  const totalRotation=Math.PI*2*extraSpins+delta;
  const duration=5000+Math.random()*1500;
  const startAngle=wheelAngle,startTime=performance.now();
  function easeOut(t){return 1-Math.pow(1-t,4);}
  function animate(now){
    const t=Math.min((now-startTime)/duration,1);
    wheelAngle=startAngle+totalRotation*easeOut(t);
    drawWheel();
    if(t<1){wheelAnimFrame=requestAnimationFrame(animate);}
    else{
      wheelAnimFrame=null;
      wheelSpinning=false;
      setBtn('btnSpin',false);
      setTimeout(()=>showWheelResult(wheelParticipants[winnerIdx]),250);
    }
  }
  wheelAnimFrame=requestAnimationFrame(animate);
}
function showWheelResult(winner){
  document.getElementById('wrEmoji').textContent=WINNER_EMOJIS[wheelWinners.length%WINNER_EMOJIS.length];
  document.getElementById('wrRound').textContent=wheelWinners.length+1;
  document.getElementById('wrName').textContent=winner.emp_name||'—';
  document.getElementById('wrMeta').textContent=winner.emp_id||'—';
  document.getElementById('wrCp').textContent='📍 '+(winner.cp_name||'—');
  document.getElementById('wheelResultModal').classList.add('show');
  wheelWinners.unshift({...winner,_wonAt:new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'})});
  renderWinnerList();startConfetti();
  if(excludeWinners)setTimeout(loadWheelData,500);
}
function closeWheelResult(){document.getElementById('wheelResultModal').classList.remove('show');stopConfetti();}
async function spinAgain(){
  closeWheelResult();
  if(excludeWinners){
    await loadWheelData();
    if(wheelParticipants.length===0){
      showAlert('wheelAlert','ผู้เข้าร่วมทั้งหมดได้รับรางวัลแล้ว! กด "ล้างรายการ" เพื่อเริ่มใหม่','info');
      return;
    }
  }
  setTimeout(spinWheel,350);
}
function renderWinnerList(){
  const list=document.getElementById('winnerList');if(!list)return;
  const badge=document.getElementById('winnerCountBadge');
  if(badge)badge.textContent=wheelWinners.length;
  if(!wheelWinners.length){
    list.innerHTML=`<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r)">
      <i class="ti ti-trophy" style="font-size:24px;display:block;margin-bottom:6px;opacity:.3"></i>
      ยังไม่มีผู้โชคดี — กดปุ่ม <strong>หมุน!</strong> เพื่อสุ่ม
    </div>`;return;
  }
  list.innerHTML='';
  const wl=document.createElement('div');wl.className='wheel-winner-list';
  wheelWinners.slice(0,10).forEach((w,i)=>{
    const item=document.createElement('div');item.className='wheel-winner-item';
    const rankClass=i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n';
    item.innerHTML=`<div class="wheel-winner-rank ${rankClass}">${i+1}</div>
      <div>
        <div class="wheel-winner-name">${escHtml(w.emp_name||'—')}</div>
        <div class="wheel-winner-cp">${escHtml(w.emp_id||'')} · ${escHtml(w.cp_name||'—')}</div>
      </div>
      <div class="wheel-winner-time">${escHtml(w._wonAt||'')}</div>`;
    wl.appendChild(item);
  });
  list.appendChild(wl);
}
function clearWinners(){
  if(!wheelWinners.length)return;
  if(!confirm(`ล้างรายชื่อผู้โชคดี ${wheelWinners.length} คน?`))return;
  wheelWinners=[];renderWinnerList();
  if(excludeWinners)loadWheelData();
}
function startConfetti(){
  const canvas=document.getElementById('confettiCanvas');if(!canvas)return;
  canvas.style.display='block';
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const ctx=canvas.getContext('2d');
  const pieces=Array.from({length:140},()=>({
    x:Math.random()*canvas.width,y:Math.random()*-canvas.height*0.6,
    vx:(Math.random()-0.5)*5,vy:Math.random()*5+2,
    color:WHEEL_COLORS[Math.floor(Math.random()*WHEEL_COLORS.length)],
    size:Math.random()*10+4,rot:Math.random()*360,spin:Math.random()*8-4,
    shape:Math.random()<0.5?'rect':'circle'
  }));
  let frame=0;
  function drawC(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.spin;p.vy+=0.06;
      if(p.y>canvas.height+30){p.y=-20;p.x=Math.random()*canvas.width;p.vy=Math.random()*4+2;}
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle=p.color+'bb';
      if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}
      else{ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);}
      ctx.restore();
    });
    frame++;
    if(frame<480)confettiAnimId=requestAnimationFrame(drawC);
    else stopConfetti();
  }
  if(confettiAnimId)cancelAnimationFrame(confettiAnimId);
  confettiAnimId=requestAnimationFrame(drawC);
}
function stopConfetti(){
  if(confettiAnimId){cancelAnimationFrame(confettiAnimId);confettiAnimId=null;}
  const c=document.getElementById('confettiCanvas');if(c)c.style.display='none';
}

// ══ DASHBOARD ═══════════════════════════════════════════════
async function loadDashboard(){
  showAlert('dashAlert','','');
  try{
    const d=await sbGetDashboard();
    document.getElementById('statTotal').textContent=d.total??'—';
    document.getElementById('statToday').textContent=d.today??'—';
    document.getElementById('statTodayDate').textContent=new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'});
    document.getElementById('statCp').textContent=d.activeCp??'—';
    document.getElementById('statEmp').textContent=d.activeEmp??'—';
    const tbody=document.getElementById('recentTable');
    const locOn=featureFlags.locationEnabled;
    if(!d.recent.length){
      tbody.innerHTML=`<tr><td colspan="${locOn?5:4}" style="text-align:center;color:var(--text3);padding:24px">ยังไม่มีรายการลงทะเบียนวันนี้</td></tr>`;
    }else{
      tbody.innerHTML='';
      d.recent.forEach(r=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td class="name">${escHtml(r.empName||'—')}</td>
          <td>${escHtml(r.cpName||'—')}</td>
          <td style="font-family:var(--mono)">${escHtml(r.ts||'—')}</td>
          <td>${r.isManual
            ?'<span class="badge b-purple"><i class="ti ti-clipboard-check" style="font-size:10px"></i> Admin</span>'
            :'<span class="badge b-teal"><i class="ti ti-user" style="font-size:10px"></i> ปกติ</span>'}</td>
          ${locOn?`<td><span style="color:var(--teal);font-family:var(--mono)">${r.distanceM!=null?escHtml(String(r.distanceM))+'m':'—'}</span></td>`:''}`;
        tbody.appendChild(tr);
      });
    }
    syncSettingsUI();
  }catch(e){showAlert('dashAlert','โหลดข้อมูลไม่ได้: '+e.message,'error');}
}
async function exportCSV(){
  showLoading('กำลัง Export...');
  try{
    const rows=await sbGetTodayRegsForExport();
    if(!rows.length){hideLoading();showAlert('dashAlert','ไม่มีข้อมูลวันนี้','warn');return;}
    const headers=['reg_id','emp_id','emp_name','branch','position','cp_id','cp_name','registered_at','lat','lng','distance_m','accuracy','is_manual','admin_id','note'];
    const csv=[headers.join(','),...rows.map(r=>headers.map(h=>{const v=r[h]??'';return`"${String(v).replace(/"/g,'""')}"`;}).join(','))].join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    a.download=`registrations-${bkkDate()}.csv`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }catch(e){showAlert('dashAlert','Export ไม่ได้: '+e.message,'error');}
  finally{hideLoading();}
}

// ══ EMPLOYEES ═══════════════════════════════════════════════
function renderEmployeeTable(){
  const tbody=document.getElementById('empTableBody');if(!tbody)return;
  if(!adminEmployees.length){
    tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px">ยังไม่มีข้อมูลพนักงาน</td></tr>';return;
  }
  tbody.innerHTML='';
  adminEmployees.forEach(e=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td style="font-family:var(--mono)">${escHtml(e.id)}</td>
      <td class="name">${escHtml(e.name)}</td>
      <td>${escHtml(e.branch||'—')}</td>
      <td><span class="badge ${e.role==='admin'?'b-amber':'b-blue'}">${escHtml(e.role||'user')}</span></td>
      <td><span class="badge ${e.is_active?'b-teal':'b-gray'}">${e.is_active?'Active':'Inactive'}</span></td>
      <td>
        <button data-toggle-emp="${escHtml(e.id)}" data-emp-active="${!e.is_active}" class="btn btn-outline btn-xs">
          ${e.is_active?'<i class="ti ti-user-off"></i> ปิด':'<i class="ti ti-user-check"></i> เปิด'}
        </button>
      </td>`;
    tr.querySelector('[data-toggle-emp]').addEventListener('click',ev=>{
      const btn=ev.currentTarget;
      toggleEmpActive(btn.dataset.toggleEmp,btn.dataset.empActive==='true');
    });
    tbody.appendChild(tr);
  });
}
async function toggleEmpActive(empId,active){
  showLoading('กำลังอัพเดต...');
  try{
    await sbToggleEmployee(empId,active);hideLoading();
    await loadEmployees();renderEmployeeTable();
  }catch(e){hideLoading();showAlert('empAlert','อัพเดตไม่ได้: '+e.message,'error');}
}
function showAddEmpForm(){
  const f=document.getElementById('addEmpForm');
  f.style.display='block';
  f.scrollIntoView({behavior:'smooth'});
  setTimeout(()=>document.getElementById('newEmpId')?.focus(),300);
}
async function saveNewEmployee(){
  const empId=sanitize(document.getElementById('newEmpId').value.trim());
  const name=sanitize(document.getElementById('newEmpName').value.trim());
  const branch=sanitize(document.getElementById('newEmpBranch').value.trim());
  const position=sanitize(document.getElementById('newEmpPosition').value.trim());
  const pin=document.getElementById('newEmpPin').value.trim();
  const role=document.getElementById('newEmpRole').value;
  if(!empId||!name||!pin){showAlert('empAlert','กรุณากรอกข้อมูลที่จำเป็น (รหัส, ชื่อ, PIN)','warn');return;}
  if(!/^\d{4,8}$/.test(pin)){showAlert('empAlert','PIN ต้องเป็นตัวเลข 4-8 หลักเท่านั้น','warn');return;}
  showLoading('กำลังบันทึก...');
  try{
    const res=await sbAddEmployee({empId,name,branch,position,pin,role});
    hideLoading();
    if(!res.ok)throw new Error(res.msg);
    document.getElementById('addEmpForm').style.display='none';
    ['newEmpId','newEmpName','newEmpBranch','newEmpPosition','newEmpPin'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.value='';
    });
    showAlert('empAlert',`✅ เพิ่มพนักงาน "${name}" สำเร็จ`,'success');
    await loadEmployees();renderEmployeeTable();
  }catch(e){hideLoading();showAlert('empAlert','บันทึกไม่ได้: '+e.message,'error');}
}

// ══ EVENT BINDINGS (ADMIN) ══════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  // Admin QR
  document.getElementById('btnGenerateAllQR')?.addEventListener('click',generateAllQR);
  document.querySelectorAll('.preset-btn').forEach(btn=>{
    btn.addEventListener('click',e=>setExpiryPreset(parseFloat(btn.dataset.days||'0'),e));
  });
  // Admin settings
  document.getElementById('btnAddCheckpoint')?.addEventListener('click',addCheckpointRow);
  document.getElementById('btnSaveSettings')?.addEventListener('click',saveSettings);
  document.getElementById('togQR')?.addEventListener('change',syncSettingsUI);
  document.getElementById('togLocation')?.addEventListener('change',syncSettingsUI);
  // Dashboard
  document.getElementById('btnDashRefresh')?.addEventListener('click',loadDashboard);
  document.getElementById('btnExportCSV')?.addEventListener('click',exportCSV);
  // Employees
  document.getElementById('btnShowAddEmp')?.addEventListener('click',showAddEmpForm);
  document.getElementById('btnSaveNewEmployee')?.addEventListener('click',saveNewEmployee);
  document.getElementById('btnCancelAddEmp')?.addEventListener('click',()=>document.getElementById('addEmpForm').style.display='none');
  // Manual Reg
  document.getElementById('mregSearch')?.addEventListener('input',filterMRegEmployees);
  document.getElementById('btnMregStep2')?.addEventListener('click',mregGoStep2);
  document.getElementById('btnMregBack')?.addEventListener('click',mregGoStep1);
  document.getElementById('btnMregConfirm')?.addEventListener('click',mregDoRegister);
  document.getElementById('btnMregReset')?.addEventListener('click',mregReset);
  document.getElementById('btnMregGoDash')?.addEventListener('click',()=>showAdminPage('dashboard',null));
  const mregNote=document.getElementById('mregNote');
  if(mregNote)mregNote.addEventListener('input',()=>{
    const nc=document.getElementById('mregNoteCount');
    if(nc)nc.textContent=mregNote.value.length;
  });
  // Wheel
  document.getElementById('btnSpin')?.addEventListener('click',spinWheel);
  document.getElementById('btnExcludeWinners')?.addEventListener('click',()=>{
    excludeWinners=!excludeWinners;
    document.getElementById('btnExcludeWinners').classList.toggle('active',excludeWinners);
    wheelAngle=0;
    loadWheelData();
  });
  document.getElementById('btnWheelRefresh')?.addEventListener('click',loadWheelData);
  document.getElementById('btnClearWinners')?.addEventListener('click',clearWinners);
  document.getElementById('wfAll')?.addEventListener('click',()=>setWheelFilter('all',document.getElementById('wfAll')));
  document.getElementById('btnCloseWheelResult')?.addEventListener('click',closeWheelResult);
  document.getElementById('btnSpinAgain')?.addEventListener('click',spinAgain);
  // Confetti canvas resize
  window.addEventListener('resize',()=>{
    const c=document.getElementById('confettiCanvas');
    if(c&&c.style.display!=='none'){c.width=window.innerWidth;c.height=window.innerHeight;}
    if(document.getElementById('apage-wheel')?.classList.contains('active'))drawWheel();
  });
});
