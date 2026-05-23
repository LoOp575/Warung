// ========================================
// WarungOS - App Logic
// ========================================

// === DATA DEFAULTS ===
const DEFAULT_STOK = [
  { id: 1, nama: 'Pandemas', kategori: 'rokok', satuan: 'slop', stok: 5, stokNormal: 10, minimum: 3 },
  { id: 2, nama: 'Tebu', kategori: 'rokok', satuan: 'slop', stok: 4, stokNormal: 10, minimum: 3 },
  { id: 3, nama: 'Armor', kategori: 'rokok', satuan: 'slop', stok: 6, stokNormal: 10, minimum: 3 },
  { id: 4, nama: '76 Apel', kategori: 'rokok', satuan: 'slop', stok: 3, stokNormal: 8, minimum: 2 },
  { id: 5, nama: 'Kopi Sachet', kategori: 'kopi', satuan: 'renceng', stok: 6, stokNormal: 15, minimum: 4 },
  { id: 6, nama: 'Beng-beng', kategori: 'snack', satuan: 'pcs', stok: 20, stokNormal: 50, minimum: 15 },
  { id: 7, nama: 'Coklatos', kategori: 'snack', satuan: 'pcs', stok: 25, stokNormal: 50, minimum: 15 },
  { id: 8, nama: 'Snack Lain', kategori: 'snack', satuan: 'pcs', stok: 40, stokNormal: 60, minimum: 18 },
  { id: 9, nama: 'Terigu', kategori: 'sembako', satuan: 'karung', stok: 2, stokNormal: 5, minimum: 1 },
  { id: 10, nama: 'Minyak Goreng', kategori: 'sembako', satuan: 'liter', stok: 10, stokNormal: 20, minimum: 10 },
  { id: 11, nama: 'Gula', kategori: 'sembako', satuan: 'sak', stok: 2, stokNormal: 5, minimum: 1 },
  { id: 12, nama: 'Masako', kategori: 'sembako', satuan: 'renceng', stok: 8, stokNormal: 20, minimum: 5 },
  { id: 13, nama: 'Gas LPG 3kg', kategori: 'gas', satuan: 'tabung kosong', stok: 3, stokNormal: 10, minimum: 5 },
  { id: 14, nama: 'Deposit Pulsa', kategori: 'pulsa', satuan: '% saldo', stok: 40, stokNormal: 100, minimum: 30 },
];

// === HELPERS ===
function formatRupiah(num) {
  if (num === null || num === undefined) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getTanggalIndo() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// === LOCAL STORAGE ===
function getData(key, defaultVal) {
  try {
    const data = localStorage.getItem('warungos_' + key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setData(key, val) {
  localStorage.setItem('warungos_' + key, JSON.stringify(val));
}

// === STATE ===
let stokBarang = getData('stok', DEFAULT_STOK);
let omzetHariIni = getData('omzet_today', { tanggal: getToday(), jumlah: 0 });
let omzetHistory = getData('omzet_history', []);
let modalData = getData('modal', { awal: 10000000, target: 20000000, berjalan: 10000000, history: [] });
let editingBarangId = null;

// Reset if different day
if (omzetHariIni.tanggal !== getToday()) {
  // Save yesterday's omzet to history
  if (omzetHariIni.jumlah > 0) {
    omzetHistory.push({ tanggal: omzetHariIni.tanggal, jumlah: omzetHariIni.jumlah });
    // Keep only last 30 days
    if (omzetHistory.length > 30) omzetHistory = omzetHistory.slice(-30);
    setData('omzet_history', omzetHistory);
  }
  omzetHariIni = { tanggal: getToday(), jumlah: 0 };
  setData('omzet_today', omzetHariIni);
}

// === NAVIGATION ===
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  
  // Update nav active states
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('bg-navy-800', btn.dataset.page === page);
    btn.classList.toggle('text-primary-300', btn.dataset.page === page);
  });
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('nav-active', btn.dataset.page === page);
  });

  // Refresh page content
  if (page === 'dashboard') renderDashboard();
  if (page === 'stok') renderStok();
  if (page === 'grafik') renderGrafik();
  if (page === 'target') renderTarget();
}

// === OMZET ===
function simpanOmzet() {
  const input = document.getElementById('omzetInput');
  const val = parseInt(input.value);
  if (!val || val <= 0) {
    alert('Masukkan omzet yang valid!');
    return;
  }
  omzetHariIni = { tanggal: getToday(), jumlah: val };
  setData('omzet_today', omzetHariIni);
  input.value = '';
  renderDashboard();
}

function hitungPembagian(omzet) {
  return {
    restock: Math.round(omzet * 0.70),
    tabungan: Math.round(omzet * 0.15),
    growth: Math.round(omzet * 0.10),
    kas: Math.round(omzet * 0.05),
  };
}

// === STOK STATUS ===
function getStatus(barang) {
  const persen = (barang.stok / barang.stokNormal) * 100;
  
  if (barang.stok <= barang.minimum) {
    return { status: 'BELI', class: 'status-beli', color: 'red', persen };
  } else if (persen <= 50) {
    return { status: 'WASPADA', class: 'status-waspada', color: 'orange', persen };
  } else {
    return { status: 'AMAN', class: 'status-aman', color: 'green', persen };
  }
}

function getRekomendasi(barang, statusInfo) {
  if (statusInfo.status === 'BELI') {
    if (barang.kategori === 'gas') return `ISI! Sudah ${barang.stok} tabung kosong`;
    if (barang.kategori === 'pulsa') return `ISI DEPOSIT! Saldo tinggal ${barang.stok}%`;
    return `BELI! Stok tinggal ${barang.stok} ${barang.satuan}`;
  }
  if (statusInfo.status === 'WASPADA') {
    return `Perhatikan. Stok ${barang.stok}/${barang.stokNormal} ${barang.satuan}`;
  }
  return `Stok cukup (${barang.stok}/${barang.stokNormal} ${barang.satuan})`;
}

// === RENDER DASHBOARD ===
function renderDashboard() {
  const omzet = omzetHariIni.jumlah;
  const pembagian = hitungPembagian(omzet);
  
  document.getElementById('summaryOmzet').textContent = formatRupiah(omzet);
  document.getElementById('summaryRestock').textContent = formatRupiah(pembagian.restock);
  document.getElementById('summaryTabungan').textContent = formatRupiah(pembagian.tabungan);
  document.getElementById('summaryGrowth').textContent = formatRupiah(pembagian.growth);
  document.getElementById('summaryKas').textContent = formatRupiah(pembagian.kas);

  // Count status
  let beli = 0, aman = 0, waspada = 0;
  const alerts = [];
  
  stokBarang.forEach(b => {
    const s = getStatus(b);
    if (s.status === 'BELI') { beli++; alerts.push(b); }
    else if (s.status === 'WASPADA') { waspada++; }
    else { aman++; }
  });

  document.getElementById('summaryBeli').textContent = `${beli} barang`;
  document.getElementById('summaryAman').textContent = `${aman} barang`;

  // Render alerts
  const alertContainer = document.getElementById('alertList');
  if (alerts.length === 0) {
    alertContainer.innerHTML = '<div class="flex items-center gap-3 p-3 bg-green-50 rounded-xl"><div class="w-3 h-3 bg-green-500 rounded-full"></div><p class="text-sm text-green-700">Semua stok aman! Tidak ada yang perlu dibeli.</p></div>';
  } else {
    alertContainer.innerHTML = alerts.map(b => {
      const s = getStatus(b);
      const isGas = b.kategori === 'gas';
      const isPulsa = b.kategori === 'pulsa';
      const actionText = (isGas || isPulsa) ? 'ISI' : 'BELI';
      return `
        <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div>
              <p class="text-sm font-medium text-gray-800">${b.nama}</p>
              <p class="text-xs text-gray-500">${b.stok} ${b.satuan} tersisa</p>
            </div>
          </div>
          <span class="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">${actionText}</span>
        </div>
      `;
    }).join('');
  }
}

// === RENDER STOK ===
function renderStok() {
  const filter = document.getElementById('filterKategori').value;
  const filtered = filter === 'semua' ? stokBarang : stokBarang.filter(b => b.kategori === filter);
  
  const grid = document.getElementById('stokGrid');
  
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="text-gray-400 text-sm col-span-full text-center py-8">Tidak ada barang di kategori ini</p>';
    return;
  }

  grid.innerHTML = filtered.map(b => {
    const s = getStatus(b);
    const rek = getRekomendasi(b, s);
    const persen = Math.min(100, Math.round(s.persen));
    const kategoriLabel = {
      rokok: 'Rokok', kopi: 'Kopi', snack: 'Snack', 
      sembako: 'Sembako', gas: 'Gas LPG', pulsa: 'Pulsa/PPOB'
    };
    const barColor = s.color === 'red' ? 'bg-red-500' : s.color === 'orange' ? 'bg-orange-400' : 'bg-green-500';
    
    return `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover cursor-pointer" onclick="editStok(${b.id})">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h4 class="font-semibold text-navy-900">${b.nama}</h4>
            <p class="text-xs text-gray-400">${kategoriLabel[b.kategori] || b.kategori}</p>
          </div>
          <span class="text-xs font-bold px-2 py-1 rounded-lg ${s.class}">${s.status}</span>
        </div>
        <div class="mb-3">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-500">Stok: ${b.stok} ${b.satuan}</span>
            <span class="font-medium">${persen}%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div class="${barColor} h-2 rounded-full progress-bar" style="width: ${persen}%"></div>
          </div>
        </div>
        <p class="text-xs text-gray-500">${rek}</p>
      </div>
    `;
  }).join('');
}

// === STOK MANAGEMENT ===
function showTambahBarang() {
  document.getElementById('modalTambahBarang').classList.remove('hidden');
  document.getElementById('modalTambahBarang').classList.add('flex');
}

function closeTambahBarang() {
  document.getElementById('modalTambahBarang').classList.add('hidden');
  document.getElementById('modalTambahBarang').classList.remove('flex');
  // Clear form
  document.getElementById('addNama').value = '';
  document.getElementById('addStok').value = '';
  document.getElementById('addStokNormal').value = '';
  document.getElementById('addMinimum').value = '';
  document.getElementById('addSatuan').value = '';
}

function simpanBarang() {
  const nama = document.getElementById('addNama').value.trim();
  const kategori = document.getElementById('addKategori').value;
  const satuan = document.getElementById('addSatuan').value.trim() || 'pcs';
  const stok = parseInt(document.getElementById('addStok').value) || 0;
  const stokNormal = parseInt(document.getElementById('addStokNormal').value) || 10;
  const minimum = parseInt(document.getElementById('addMinimum').value) || 3;

  if (!nama) {
    alert('Nama barang harus diisi!');
    return;
  }

  const newId = stokBarang.length > 0 ? Math.max(...stokBarang.map(b => b.id)) + 1 : 1;
  stokBarang.push({ id: newId, nama, kategori, satuan, stok, stokNormal, minimum });
  setData('stok', stokBarang);
  closeTambahBarang();
  renderStok();
  renderDashboard();
}

function editStok(id) {
  const barang = stokBarang.find(b => b.id === id);
  if (!barang) return;
  editingBarangId = id;
  document.getElementById('editBarangNama').textContent = `${barang.nama} (${barang.stok} ${barang.satuan})`;
  document.getElementById('editStokInput').value = barang.stok;
  document.getElementById('modalEditStok').classList.remove('hidden');
  document.getElementById('modalEditStok').classList.add('flex');
}

function closeEditStok() {
  document.getElementById('modalEditStok').classList.add('hidden');
  document.getElementById('modalEditStok').classList.remove('flex');
  editingBarangId = null;
}

function updateStok() {
  if (editingBarangId === null) return;
  const newStok = parseInt(document.getElementById('editStokInput').value);
  if (isNaN(newStok) || newStok < 0) {
    alert('Masukkan stok yang valid!');
    return;
  }
  const barang = stokBarang.find(b => b.id === editingBarangId);
  if (barang) {
    barang.stok = newStok;
    setData('stok', stokBarang);
  }
  closeEditStok();
  renderStok();
  renderDashboard();
}

function hapusBarang() {
  if (editingBarangId === null) return;
  if (!confirm('Yakin hapus barang ini?')) return;
  stokBarang = stokBarang.filter(b => b.id !== editingBarangId);
  setData('stok', stokBarang);
  closeEditStok();
  renderStok();
  renderDashboard();
}

// === GRAFIK ===
function renderGrafik() {
  // Get last 7 days data
  const last7 = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    let omzet = 0;
    if (dateStr === getToday()) {
      omzet = omzetHariIni.jumlah;
    } else {
      const found = omzetHistory.find(h => h.tanggal === dateStr);
      if (found) omzet = found.jumlah;
    }
    
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    last7.push({ tanggal: dateStr, omzet, day: dayNames[d.getDay()] });
  }

  const maxOmzet = Math.max(...last7.map(d => d.omzet), 1);
  const total = last7.reduce((sum, d) => sum + d.omzet, 0);
  const daysWithData = last7.filter(d => d.omzet > 0).length;
  const rata = daysWithData > 0 ? Math.round(total / daysWithData) : 0;

  // Render chart bars
  const container = document.getElementById('chartContainer');
  container.innerHTML = last7.map(d => {
    const height = maxOmzet > 0 ? Math.max(4, (d.omzet / maxOmzet) * 100) : 4;
    const isToday = d.tanggal === getToday();
    const bgClass = isToday ? 'bg-primary-500' : 'bg-primary-300';
    return `
      <div class="flex-1 flex flex-col items-center justify-end h-full">
        <p class="text-xs text-gray-500 mb-1 text-center">${d.omzet > 0 ? formatRupiah(d.omzet).replace('Rp ', '') : '-'}</p>
        <div class="${bgClass} rounded-t-lg w-full transition-all duration-500" style="height: ${height}%"></div>
      </div>
    `;
  }).join('');

  // Render labels
  const labels = document.getElementById('chartLabels');
  labels.innerHTML = last7.map(d => `<span class="flex-1 text-center">${d.day}</span>`).join('');

  // Stats
  document.getElementById('totalMingguan').textContent = formatRupiah(total);
  document.getElementById('rataHarian').textContent = formatRupiah(rata);
}

// === TARGET MODAL ===
function renderTarget() {
  const persen = Math.min(100, Math.round((modalData.berjalan / modalData.target) * 100));
  const sisa = Math.max(0, modalData.target - modalData.berjalan);

  document.getElementById('modalAwal').textContent = formatRupiah(modalData.awal);
  document.getElementById('modalTarget').textContent = formatRupiah(modalData.target);
  document.getElementById('modalBerjalan').textContent = formatRupiah(modalData.berjalan);
  document.getElementById('progressPersen').textContent = persen + '%';
  document.getElementById('progressBar').style.width = persen + '%';
  document.getElementById('sisaTarget').textContent = formatRupiah(sisa);

  // Change progress bar color based on progress
  const bar = document.getElementById('progressBar');
  if (persen >= 100) {
    bar.className = 'progress-bar bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full';
  } else if (persen >= 70) {
    bar.className = 'progress-bar bg-gradient-to-r from-primary-400 to-primary-600 h-4 rounded-full';
  } else if (persen >= 40) {
    bar.className = 'progress-bar bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full';
  } else {
    bar.className = 'progress-bar bg-gradient-to-r from-red-400 to-red-600 h-4 rounded-full';
  }

  // History
  const histContainer = document.getElementById('modalHistory');
  if (modalData.history.length === 0) {
    histContainer.innerHTML = '<p class="text-gray-400 text-sm">Belum ada riwayat penambahan modal</p>';
  } else {
    histContainer.innerHTML = modalData.history.slice().reverse().slice(0, 10).map(h => `
      <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
        <div>
          <p class="text-sm font-medium text-gray-800">+${formatRupiah(h.jumlah)}</p>
          <p class="text-xs text-gray-400">${h.tanggal}</p>
        </div>
        <span class="text-xs text-green-600 font-medium">&#x2713;</span>
      </div>
    `).join('');
  }
}

function tambahModal() {
  const input = document.getElementById('inputModal');
  const val = parseInt(input.value);
  if (!val || val <= 0) {
    alert('Masukkan jumlah modal yang valid!');
    return;
  }
  modalData.berjalan += val;
  modalData.history.push({ tanggal: getTanggalIndo(), jumlah: val });
  setData('modal', modalData);
  input.value = '';
  renderTarget();
}

// === RESET HARIAN ===
function resetHarian() {
  if (!confirm('Reset data harian? Omzet hari ini akan disimpan ke history dan direset ke 0.')) return;
  
  // Save current omzet to history
  if (omzetHariIni.jumlah > 0) {
    omzetHistory.push({ tanggal: omzetHariIni.tanggal, jumlah: omzetHariIni.jumlah });
    if (omzetHistory.length > 30) omzetHistory = omzetHistory.slice(-30);
    setData('omzet_history', omzetHistory);
  }
  
  omzetHariIni = { tanggal: getToday(), jumlah: 0 };
  setData('omzet_today', omzetHariIni);
  renderDashboard();
  renderGrafik();
}

// === INIT ===
function init() {
  document.getElementById('headerDate').textContent = getTanggalIndo();
  showPage('dashboard');
}

// Run
init();
