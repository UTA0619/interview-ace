/**
 * わんこ健康ノート - 小型犬の健康管理アプリ
 * データは localStorage に保存
 */

const STORAGE_KEYS = {
  profile: 'dog-health-profile',
  weight: 'dog-health-weight',
  vaccine: 'dog-health-vaccine',
  vet: 'dog-health-vet',
  medicine: 'dog-health-medicine',
};

// 小型犬の犬種別標準体重（kg）参考値
const STANDARD_WEIGHT_BREEDS = {
  'トイプードル': { min: 3, max: 4 },
  'チワワ': { min: 1.5, max: 3 },
  'ミニチュアダックスフンド': { min: 4, max: 5 },
  'ミニチュア・ダックスフンド': { min: 4, max: 5 },
  'ヨークシャーテリア': { min: 2, max: 3 },
  'ポメラニアン': { min: 1.5, max: 3 },
  'マルチーズ': { min: 2, max: 4 },
  'シー・ズー': { min: 4, max: 7 },
  'キャバリア': { min: 5.5, max: 8 },
  'パピヨン': { min: 3.5, max: 5 },
  'ミニチュアピンシャー': { min: 3.5, max: 5 },
  'イタリアン・グレーハウンド': { min: 3, max: 5 },
  'パグ': { min: 6, max: 8 },
  '狆': { min: 3, max: 6 },
  'ボストン・テリア': { min: 5, max: 11 },
  'トイ・マンチェスター・テリア': { min: 2, max: 5 },
};
const WEIGHT_DEVIATION_RATIO = 0.2; // 標準から20%以上ズレでアナウンス

// ---------- タブ切り替え ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    const id = tab.getAttribute('data-tab');
    document.getElementById(id).classList.add('active');
  });
});

// ---------- 日付のデフォルトを今日に ----------
function setDefaultDate(inputId) {
  const el = document.getElementById(inputId);
  if (el && !el.value) el.value = new Date().toISOString().slice(0, 10);
}
['weight-date', 'vaccine-date', 'vet-date', 'vet-scheduled', 'medicine-start'].forEach(setDefaultDate);

// ---------- プロフィール取得（他モジュール用） ----------
function getProfile() {
  const raw = localStorage.getItem(STORAGE_KEYS.profile);
  return raw ? JSON.parse(raw) : {};
}

// ---------- 標準体重・お知らせ ----------
function getCurrentWeight() {
  const profile = getProfile();
  if (profile.weight != null && profile.weight !== '') return Number(profile.weight);
  const list = getWeightList();
  if (list.length) return list[0].weight;
  return null;
}

function findStandardWeight(breedName) {
  if (!breedName || typeof breedName !== 'string') return null;
  const normalized = breedName.trim();
  return STANDARD_WEIGHT_BREEDS[normalized] || null;
}

function updateStandardWeightBox() {
  const box = document.getElementById('standard-weight-content');
  const alertEl = document.getElementById('weight-alert');
  const profile = getProfile();
  const breed = profile.breed && profile.breed.trim();
  const currentKg = getCurrentWeight();
  const standard = breed ? findStandardWeight(breed) : null;

  if (!breed) {
    box.innerHTML = '<span class="current-breed">プロフィールで犬種を登録すると、標準体重を表示します。</span>';
    alertEl.classList.add('hidden');
    return;
  }

  if (!standard) {
    box.innerHTML = `<span class="current-breed">${escapeHtml(breed)}</span><span class="range">（標準体重の登録がありません）</span>`;
    if (currentKg != null) box.innerHTML += `<br>現在の体重: <strong>${formatNumber(currentKg)} kg</strong>`;
    alertEl.classList.add('hidden');
    return;
  }

  box.innerHTML = `<span class="current-breed">${escapeHtml(breed)}</span><br><span class="range">標準体重: ${formatNumber(standard.min)} ～ ${formatNumber(standard.max)} kg</span>`;
  if (currentKg != null) box.innerHTML += `<br>現在: <strong>${formatNumber(currentKg)} kg</strong>`;

  alertEl.classList.add('hidden');
  if (currentKg == null) return;

  const over = currentKg > standard.max * (1 + WEIGHT_DEVIATION_RATIO);
  const under = currentKg < standard.min * (1 - WEIGHT_DEVIATION_RATIO);
  if (over) {
    alertEl.textContent = `⚠️ 標準体重より大きく上回っています。かかりつけ医に相談することをおすすめします。`;
    alertEl.className = 'weight-alert over';
  } else if (under) {
    alertEl.textContent = `⚠️ 標準体重より大きく下回っています。かかりつけ医に相談することをおすすめします。`;
    alertEl.className = 'weight-alert under';
  }
}

function getVetReminders() {
  const list = getVetList();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const reminders = [];
  list.forEach((v) => {
    const scheduled = v.scheduledDate || v.scheduled;
    if (!scheduled) return;
    const d = new Date(scheduled);
    d.setHours(0, 0, 0, 0);
    if (d < today) return;
    const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3 && diffDays >= 0) {
      reminders.push({ date: scheduled, clinic: v.clinic, reason: v.reason, diffDays });
    }
  });
  return reminders;
}

function getVaccineReminders() {
  const list = getVaccineList();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inOneMonth = new Date(today);
  inOneMonth.setMonth(inOneMonth.getMonth() + 1);
  const reminders = [];
  list.forEach((v) => {
    const next = v.next;
    if (!next) return;
    const d = new Date(next);
    d.setHours(0, 0, 0, 0);
    if (d < today) return;
    const diffMs = d - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 25 && diffDays <= 35) {
      reminders.push({ name: v.name, date: next, diffDays });
    }
  });
  return reminders;
}

function renderAnnouncements() {
  const container = document.getElementById('announcements');
  const vetReminders = getVetReminders();
  const vaccineReminders = getVaccineReminders();
  let html = '';
  vetReminders.forEach((r) => {
    const msg = r.diffDays === 0 ? '今日' : r.diffDays === 1 ? '明日' : `${r.diffDays}日後`;
    html += `<div class="announcement vet" role="alert"><span class="announcement-icon">🏥</span><div>病院の予約が<strong>${msg}</strong>です。${r.clinic ? escapeHtml(r.clinic) : ''} ${r.reason ? '（' + escapeHtml(r.reason) + '）' : ''}</div></div>`;
  });
  vaccineReminders.forEach((r) => {
    const msg = r.diffDays <= 1 ? (r.diffDays === 0 ? '今日' : '明日') : `約${r.diffDays}日後`;
    html += `<div class="announcement vaccine" role="alert"><span class="announcement-icon">💉</span><div>予防接種（${escapeHtml(r.name)}）が<strong>${msg}</strong>です。1ヶ月前のリマインドです。</div></div>`;
  });
  container.innerHTML = html;
}

// ---------- プロフィール ----------
const profileForm = document.getElementById('profile-form');
function loadProfile() {
  const raw = localStorage.getItem(STORAGE_KEYS.profile);
  if (!raw) return;
  const p = JSON.parse(raw);
  document.getElementById('dog-name').value = p.name || '';
  document.getElementById('dog-breed').value = p.breed || '';
  document.getElementById('dog-birth').value = p.birth || '';
  document.getElementById('dog-weight').value = p.weight ?? '';
  document.getElementById('dog-notes').value = p.notes || '';
}
function saveProfile(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('dog-name').value.trim(),
    breed: document.getElementById('dog-breed').value.trim(),
    birth: document.getElementById('dog-birth').value,
    weight: document.getElementById('dog-weight').value ? parseFloat(document.getElementById('dog-weight').value) : null,
    notes: document.getElementById('dog-notes').value.trim(),
  };
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(data));
  updateStandardWeightBox();
  renderAnnouncements();
  alert('プロフィールを保存しました。');
}
profileForm.addEventListener('submit', saveProfile);
loadProfile();
updateStandardWeightBox();
renderAnnouncements();

// ---------- 体重記録 ----------
function getWeightList() {
  const raw = localStorage.getItem(STORAGE_KEYS.weight);
  return raw ? JSON.parse(raw) : [];
}
function saveWeightList(list) {
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  localStorage.setItem(STORAGE_KEYS.weight, JSON.stringify(list));
}
function renderWeightList() {
  const list = getWeightList();
  const ul = document.getElementById('weight-list');
  if (list.length === 0) {
    ul.innerHTML = '<li class="empty-state">まだ体重記録がありません。上のフォームから追加してください。</li>';
    return;
  }
  ul.innerHTML = list
    .map(
      (item, i) => `
    <li>
      <div class="record-main">
        <div class="record-title">${formatNumber(item.weight)} kg</div>
        <div class="record-meta">${formatDate(item.date)}</div>
      </div>
      <div class="record-actions">
        <button type="button" class="btn btn-danger" data-index="${i}">削除</button>
      </div>
    </li>`
    )
    .join('');
  ul.querySelectorAll('.btn-danger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const arr = getWeightList();
      arr.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
      saveWeightList(arr);
      renderWeightList();
    });
  });
}

document.getElementById('weight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const value = parseFloat(document.getElementById('weight-value').value);
  const date = document.getElementById('weight-date').value;
  if (!date || isNaN(value)) return;
  const list = getWeightList();
  list.push({ weight: value, date });
  saveWeightList(list);
  document.getElementById('weight-value').value = '';
  document.getElementById('weight-date').value = new Date().toISOString().slice(0, 10);
  renderWeightList();
  updateStandardWeightBox();
});
renderWeightList();

// ---------- 予防接種 ----------
function getVaccineList() {
  const raw = localStorage.getItem(STORAGE_KEYS.vaccine);
  return raw ? JSON.parse(raw) : [];
}
function saveVaccineList(list) {
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  localStorage.setItem(STORAGE_KEYS.vaccine, JSON.stringify(list));
}
function renderVaccineList() {
  const list = getVaccineList();
  const ul = document.getElementById('vaccine-list');
  if (list.length === 0) {
    ul.innerHTML = '<li class="empty-state">予防接種の記録がありません。</li>';
    return;
  }
  ul.innerHTML = list
    .map(
      (item, i) => `
    <li>
      <div class="record-main">
        <div class="record-title">${escapeHtml(item.name)}</div>
        <div class="record-meta">接種日: ${formatDate(item.date)}${item.next ? '　次回: ' + formatDate(item.next) : ''}</div>
        ${item.notes ? `<div class="record-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
      <div class="record-actions">
        <button type="button" class="btn btn-danger" data-index="${i}">削除</button>
      </div>
    </li>`
    )
    .join('');
  ul.querySelectorAll('.btn-danger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const arr = getVaccineList();
      arr.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
      saveVaccineList(arr);
      renderVaccineList();
      renderAnnouncements();
    });
  });
}

document.getElementById('vaccine-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('vaccine-name').value.trim();
  const date = document.getElementById('vaccine-date').value;
  const next = document.getElementById('vaccine-next').value || null;
  const notes = document.getElementById('vaccine-notes').value.trim();
  if (!name || !date) return;
  const list = getVaccineList();
  list.push({ name, date, next, notes });
  saveVaccineList(list);
  document.getElementById('vaccine-name').value = '';
  document.getElementById('vaccine-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('vaccine-next').value = '';
  document.getElementById('vaccine-notes').value = '';
  renderVaccineList();
  renderAnnouncements();
});
renderVaccineList();

// ---------- 病院記録 ----------
function getVetList() {
  const raw = localStorage.getItem(STORAGE_KEYS.vet);
  return raw ? JSON.parse(raw) : [];
}
function saveVetList(list) {
  list.sort((a, b) => {
    const da = a.scheduledDate || a.date;
    const db = b.scheduledDate || b.date;
    return new Date(db) - new Date(da);
  });
  localStorage.setItem(STORAGE_KEYS.vet, JSON.stringify(list));
}
function renderVetList() {
  const list = getVetList();
  const ul = document.getElementById('vet-list');
  if (list.length === 0) {
    ul.innerHTML = '<li class="empty-state">病院の記録がありません。</li>';
    return;
  }
  ul.innerHTML = list
    .map(
      (item, i) => {
        const displayDate = item.scheduledDate ? `予約: ${formatDate(item.scheduledDate)}` : formatDate(item.date);
        const sub = item.scheduledDate && item.date ? `（受診: ${formatDate(item.date)}）` : '';
        return `
    <li>
      <div class="record-main">
        <div class="record-title">${escapeHtml(item.clinic || '病院')} - ${escapeHtml(item.reason || '受診')}</div>
        <div class="record-meta">${displayDate}${sub}</div>
        ${item.memo ? `<div class="record-notes">${escapeHtml(item.memo)}</div>` : ''}
      </div>
      <div class="record-actions">
        <button type="button" class="btn btn-danger" data-index="${i}">削除</button>
      </div>
    </li>`;
      }
    )
    .join('');
  ul.querySelectorAll('.btn-danger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const arr = getVetList();
      arr.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
      saveVetList(arr);
      renderVetList();
      renderAnnouncements();
    });
  });
}

document.getElementById('vet-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = document.getElementById('vet-date').value || null;
  const scheduledDate = document.getElementById('vet-scheduled').value || null;
  const clinic = document.getElementById('vet-clinic').value.trim();
  const reason = document.getElementById('vet-reason').value.trim();
  const memo = document.getElementById('vet-memo').value.trim();
  if (!date && !scheduledDate) {
    alert('受診日か次回予約日のどちらかを入力してください。');
    return;
  }
  const list = getVetList();
  list.push({ date: date || scheduledDate, scheduledDate: scheduledDate || null, clinic, reason, memo });
  saveVetList(list);
  document.getElementById('vet-date').value = '';
  document.getElementById('vet-scheduled').value = new Date().toISOString().slice(0, 10);
  document.getElementById('vet-clinic').value = '';
  document.getElementById('vet-reason').value = '';
  document.getElementById('vet-memo').value = '';
  renderVetList();
  renderAnnouncements();
});
renderVetList();

// ---------- お薬 ----------
function getMedicineList() {
  const raw = localStorage.getItem(STORAGE_KEYS.medicine);
  return raw ? JSON.parse(raw) : [];
}
function saveMedicineList(list) {
  list.sort((a, b) => new Date(b.start) - new Date(a.start));
  localStorage.setItem(STORAGE_KEYS.medicine, JSON.stringify(list));
}
function renderMedicineList() {
  const list = getMedicineList();
  const ul = document.getElementById('medicine-list');
  if (list.length === 0) {
    ul.innerHTML = '<li class="empty-state">お薬の記録がありません。</li>';
    return;
  }
  ul.innerHTML = list
    .map(
      (item, i) => `
    <li>
      <div class="record-main">
        <div class="record-title">${escapeHtml(item.name)}</div>
        <div class="record-meta">${formatDate(item.start)} ～ ${item.end ? formatDate(item.end) : '継続中'}${item.dosage ? '　' + escapeHtml(item.dosage) : ''}</div>
        ${item.memo ? `<div class="record-notes">${escapeHtml(item.memo)}</div>` : ''}
      </div>
      <div class="record-actions">
        <button type="button" class="btn btn-danger" data-index="${i}">削除</button>
      </div>
    </li>`
    )
    .join('');
  ul.querySelectorAll('.btn-danger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const arr = getMedicineList();
      arr.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
      saveMedicineList(arr);
      renderMedicineList();
    });
  });
}

document.getElementById('medicine-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('medicine-name').value.trim();
  const start = document.getElementById('medicine-start').value;
  const end = document.getElementById('medicine-end').value || null;
  const dosage = document.getElementById('medicine-dosage').value.trim();
  const memo = document.getElementById('medicine-memo').value.trim();
  if (!name || !start) return;
  const list = getMedicineList();
  list.push({ name, start, end, dosage, memo });
  saveMedicineList(list);
  document.getElementById('medicine-name').value = '';
  document.getElementById('medicine-start').value = new Date().toISOString().slice(0, 10);
  document.getElementById('medicine-end').value = '';
  document.getElementById('medicine-dosage').value = '';
  document.getElementById('medicine-memo').value = '';
  renderMedicineList();
});
renderMedicineList();

// ---------- ユーティリティ ----------
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function formatNumber(n) {
  return Number(n) === n && n % 1 !== 0 ? n.toFixed(1) : n;
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
