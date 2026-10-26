// ============ UTIL ============
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const tgl = d => d ? new Date(d + 'T00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const loading = on => $('#loading').style.display = on ? 'flex' : 'none';
const toast = (m, t = 'ok') => { const e = $('#toast'); e.textContent = m; e.className = 'show ' + t; clearTimeout(toast.i); toast.i = setTimeout(() => e.className = '', 3800); };
function modal(html) { const m = $('#modal'); m.innerHTML = '<div class="sheet glass">' + html + '</div>'; m.classList.add('show'); m.onclick = e => { if (e.target === m) closeModal(); }; }
function closeModal() { stopCam(); $('#modal').classList.remove('show'); $('#modal').innerHTML = ''; }
let U = null;
const ADMIN = () => U && U.peran === 'Admin';

// ============ KAMERA, GPS, WAJAH ============
let stream = null, raf = 0, modelsOk = false;
async function startCam(v, facing) {
  stopCam();
  if (!navigator.mediaDevices) throw new Error('Browser tidak mendukung kamera (butuh HTTPS).');
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 } }, audio: false });
  v.srcObject = stream; await v.play();
}
function stopCam() { cancelAnimationFrame(raf); if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }
const posisi = () => new Promise((ok, no) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => ok(p.coords), no, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }) : no(new Error('GPS tidak didukung')));
async function loadModels() {
  if (modelsOk) return;
  const u = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
  await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(u), faceapi.nets.faceLandmark68Net.loadFromUri(u), faceapi.nets.faceRecognitionNet.loadFromUri(u)]);
  modelsOk = true;
}
async function ambilWajah(v) {
  const r = await faceapi.detectSingleFace(v, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
  return r ? Array.from(r.descriptor) : null;
}
function pesanGeo(e) { return e && e.code === 1 ? 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.' : 'Lokasi tidak terdeteksi. Aktifkan GPS lalu coba lagi.'; }

// ============ ROUTER & SHELL ============
async function route() {
  stopCam();
  const p = (location.hash || '#/beranda').slice(2).split('?')[0];
  if (!S.t) { if (p !== 'login') { location.hash = '#/login'; return; } return pageLogin(); }
  if (!U) { const r = await api('me'); if (!r.success) { S.t = null; location.hash = '#/login'; return; } U = r.user; }
  if (p === 'login') { location.hash = '#/beranda'; return; }
  const pages = { beranda: pageBeranda, jadwal: pageJadwal, absen: pageAbsen, kegiatan: pageKegiatan, profil: pageProfil, laporan: pageLaporan, kelola: pageKelola };
  const fn = pages[p] || pageBeranda;
  if ((p === 'laporan' || p === 'kelola') && !ADMIN()) { location.hash = '#/beranda'; return; }
  const judul = { beranda: 'Beranda', jadwal: 'Jadwal', absen: 'Absen', kegiatan: 'Kegiatan', profil: 'Profil', laporan: 'Laporan', kelola: 'Kelola' }[p] || '';
  const nav = ADMIN()
    ? [['beranda', '🏠', 'Beranda'], ['jadwal', '📖', 'Jadwal'], ['absen', '▣', 'Absen', 1], ['laporan', '📊', 'Laporan'], ['kelola', '⚙️', 'Kelola']]
    : [['beranda', '🏠', 'Beranda'], ['jadwal', '📖', 'Jadwal'], ['absen', '▣', 'Absen', 1], ['kegiatan', '🕌', 'Kegiatan'], ['profil', '👤', 'Profil']];
  $('#app').innerHTML = `<div class="top"><div class="brand"><div class="logo">☪</div><div><h3>Absensi Pengajian</h3><div class="sm cu">${judul}</div></div></div>
    <a class="btn sec sm" href="#/profil">👤 ${esc(U.nama.split(' ')[0])}</a></div>
    <div class="wrap" id="view"></div>
    <nav class="nav">${nav.map(n => `<a href="#/${n[0]}" class="${p === n[0] ? 'on' : ''} ${n[3] ? 'mid' : ''}"><i>${n[1]}</i>${n[2]}</a>`).join('')}</nav>`;
  fn($('#view'));
}
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  if (GAS_URL.indexOf('GANTI_') === 0) { $('#app').innerHTML = '<div class="login"><div class="err-box"><b>GAS_URL belum diisi.</b><br>Edit file js/config.js lalu isi URL /exec dari Apps Script.</div></div>'; return; }
  route();
});

// ============ LOGIN ============
function pageLogin() {
  $('#app').innerHTML = `<div class="login"><div class="ctr"><div class="logo" style="width:72px;height:72px;font-size:34px;margin:0 auto 14px">☪</div>
    <p style="font-family:var(--serif);font-style:italic" class="mut">Assalamu'alaikum Warahmatullahi Wabarakatuh</p><h1>Absensi Pengajian</h1><p class="mut">Sistem Presensi Kehadiran Jamaah</p></div>
    <form id="f" class="glass" style="margin-top:20px"><div id="e"></div>
    <label>ID Jamaah *</label><input id="id" placeholder="JMH-001" autocapitalize="characters" autocomplete="username" required>
    <label>PIN Masuk * <span class="mut" style="font-weight:400">(6 digit)</span></label><input id="pin" type="password" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="current-password" required>
    <button class="btn full" style="margin-top:18px">Masuk ke Aplikasi →</button></form>
    <p class="ctr sm mut">Kendala akses? Hubungi pengurus majelis.</p></div>`;
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const r = await api('login', { id: $('#id').value, pin: $('#pin').value });
    if (r.success) { S.t = r.token; U = r.user; location.hash = '#/beranda'; }
    else $('#e').innerHTML = `<div class="err-box"><b>Autentikasi Gagal</b><br>${esc(r.message)}</div>`;
  };
}

// ============ BERANDA ============
const ring = (p, t, s) => `<div class="ctr"><div class="ring" style="--p:${p}"><b>${t}</b></div><div class="sm"><b>${s[0]}</b><br><span class="mut">${s[1]}</span></div></div>`;
function kartuSesi(s, u) {
  if (!s) return `<div class="glass ctr"><h3>Belum ada sesi terjadwal</h3><p class="mut">Pantau menu Jadwal untuk agenda berikutnya.</p></div>`;
  const live = s.StatusSesi === 'Berlangsung';
  return `<div class="glass"><div class="row sp"><span class="chip tag">${esc(s.Jenis || 'Pengajian')}</span><span class="chip ${live ? 'live' : ''}">${live ? '● Berlangsung' : 'Terjadwal'}</span></div>
  <h2 style="margin:12px 0">${esc(s.Materi || s.Tempat)}</h2>
  <div class="mut">🕒 ${tgl(s.Tanggal)}, ${esc(s.Jam_Mulai)} – ${esc(s.Jam_Selesai)} WIB<br>📍 ${esc(s.Tempat)}<br>🎙️ ${esc(s.Pemateri)}</div>
  ${live ? (u && u.sudahAbsenSesiBerikut ? '<p class="ok" style="margin-top:14px;color:var(--ok);font-weight:700">✓ Anda sudah absen pada sesi ini</p>' : '<a class="btn full" style="margin-top:14px" href="#/absen">Absen Sekarang →</a>') : ''}</div>`;
}
async function pageBeranda(v) {
  const r = await api('dashboard'); if (!r.success) return v.innerHTML = `<div class="err-box">${esc(r.message)}</div>`;
  const jam = new Date().getHours(), salam = jam < 11 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam';
  let h = `<p class="mono cu">${salam.toUpperCase()}</p><h1>Halo, ${esc(U.nama)}</h1><p class="mut" style="margin-bottom:16px">${esc(U.wilayah || '')} ${ADMIN() ? '• Pengurus' : ''}</p>`;
  h += kartuSesi(r.sesiBerikut, r.saya);
  if (r.saya) {
    const b = r.saya.bulanIni, m = r.saya.pekanIni;
    h += `<div class="glass"><div class="row sp"><h3>Kehadiran Anda</h3><span class="chip mono">Target ${r.target}%</span></div><div class="g g2" style="grid-template-columns:repeat(3,1fr);margin-top:14px">
      ${ring(pct(b.hadir, b.total), pct(b.hadir, b.total) + '%', ['Bulan Ini', b.hadir + '/' + b.total + ' Sesi'])}
      ${ring(pct(m.hadir, m.total), m.hadir + '/' + m.total, ['Pekan Ini', 'Minggu ini'])}
      ${ring(100, r.saya.totalTahun, ['Total Hadir', 'Tahun ' + r.hari.slice(0, 4)])}</div></div>`;
  }
  if (r.admin) h += `<div class="g g2"><div class="glass"><div class="mut sm">TOTAL JAMAAH</div><h1>${r.admin.totalJamaah}</h1></div><div class="glass"><div class="mut sm">SESI HARI INI</div><h1>${r.admin.sesiHariIni}</h1></div><div class="glass"><div class="mut sm">HADIR HARI INI</div><h1>${r.admin.hadirHariIni}</h1></div></div>`;
  h += `<h2 style="margin:8px 0">Kegiatan Terbaru</h2>` + (r.kegiatan.length ? r.kegiatan.map(k => `<div class="glass"><span class="chip tag mono">${tgl(k.Tanggal)}</span><h3 style="margin:8px 0 4px">${esc(k.Judul)}</h3><p class="mut">${esc(k.Deskripsi)}</p><p class="sm cu">📍 ${esc(k.Tempat)}</p></div>`).join('') : '<p class="mut">Belum ada kegiatan.</p>');
  v.innerHTML = h;
}

// ============ JADWAL ============
async function pageJadwal(v) {
  const t = new Date(), dari = iso(new Date(t.getTime() - 7 * 864e5)), sampai = iso(new Date(t.getTime() + 45 * 864e5));
  const r = await api('jadwal', { dari, sampai }); if (!r.success) return v.innerHTML = `<div class="err-box">${esc(r.message)}</div>`;
  let f = '';
  const draw = () => {
    const list = r.data.filter(j => !f || j.ID_Jenis === f);
    $('#lst').innerHTML = list.length ? list.map(j => `<div class="glass"><div class="row sp"><span class="chip tag">${esc(j.Jenis)}</span><span class="chip ${j.StatusSesi === 'Berlangsung' ? 'live' : j.StatusSesi === 'Selesai' ? '' : j.StatusSesi === 'Dibatalkan' ? 'bad' : ''}">${j.StatusSesi}</span></div>
      <h3 style="margin:10px 0">${esc(j.Materi || j.Tempat)}</h3><div class="mut">🗓️ ${tgl(j.Tanggal)} • ${esc(j.Jam_Mulai)}–${esc(j.Jam_Selesai)} WIB<br>📍 ${esc(j.Tempat)}<br>🎙️ ${esc(j.Pemateri)}</div>
      <div class="row sp" style="margin-top:12px"><span class="sm mut">${j.JumlahHadir} jamaah hadir</span>${j.SudahAbsen ? `<span class="chip okc">✓ ${j.SudahAbsen}</span>` : j.StatusSesi === 'Berlangsung' ? '<a class="btn sm" href="#/absen">Absen Sekarang →</a>' : ''}</div></div>`).join('') : '<div class="glass ctr"><h3>Tidak ada jadwal</h3></div>';
  };
  v.innerHTML = `<p class="mono cu">MAJELIS TA'LIM & DAKWAH</p><h1>Jadwal Pengajian</h1><div class="row wr" style="margin:14px 0"><button class="chip on" data-j="">Semua</button>${r.jenis.map(j => `<button class="chip" data-j="${j.ID_Jenis}">${esc(j.Nama)}</button>`).join('')}</div><div id="lst"></div>`;
  v.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { f = b.dataset.j; v.querySelectorAll('[data-j]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
}

// ============ KEGIATAN ============
async function pageKegiatan(v) {
  const r = await api('kegiatan'); if (!r.success) return v.innerHTML = `<div class="err-box">${esc(r.message)}</div>`;
  v.innerHTML = `<h1>Kegiatan Majelis</h1><p class="mut" style="margin-bottom:14px">Rangkaian amaliyah & silaturahim jamaah</p>` +
    (r.data.map(k => `<div class="glass">${k.Foto_URL ? `<img src="${esc(k.Foto_URL)}" alt="" style="width:100%;border-radius:14px;margin-bottom:10px">` : ''}<span class="chip tag mono">${tgl(k.Tanggal)}</span><h3 style="margin:8px 0 4px">${esc(k.Judul)}</h3><p class="mut">${esc(k.Deskripsi)}</p><p class="sm cu" style="margin-top:6px">📍 ${esc(k.Tempat)}</p></div>`).join('') || '<div class="glass ctr">Belum ada kegiatan.</div>');
}

// ============ ABSEN ============
async function pageAbsen(v) {
  const t = iso(new Date()), r = await api('jadwal', { dari: iso(new Date(Date.now() - 864e5)), sampai: iso(new Date(Date.now() + 864e5)) });
  if (!r.success) return v.innerHTML = `<div class="err-box">${esc(r.message)}</div>`;
  const live = r.data.filter(j => j.StatusSesi === 'Berlangsung');
  if (!live.length) return v.innerHTML = `<div class="glass ctr"><h2>Tidak ada sesi yang sedang dibuka</h2><p class="mut">Absen hanya bisa dilakukan saat sesi berlangsung. Lihat menu Jadwal.</p></div>`;
  let sesi = live[0], mode = 'wajah', sibuk = false, geo = null;
  const sdh = () => sesi.SudahAbsen;
  const draw = () => {
    v.innerHTML = `<h1>Absen</h1>
    <div class="glass"><select id="ss">${live.map(j => `<option value="${j.ID_Jadwal}" ${j === sesi ? 'selected' : ''}>${esc(j.Materi || j.Tempat)} (${esc(j.Jam_Mulai)})</option>`).join('')}</select>
    <p class="mut" style="margin-top:8px">📍 ${esc(sesi.Tempat)} • ${esc(sesi.Lokasi)}</p><p id="gps" class="sm mut">Mengecek lokasi GPS…</p></div>
    ${sdh() ? `<div class="glass ctr"><h2>✓ Anda sudah absen</h2><p class="mut">Status: ${sdh()}</p></div>` : `
    <div class="row"><button class="chip ${mode === 'wajah' ? 'on' : ''}" id="mw">😊 Verifikasi Wajah</button><button class="chip ${mode === 'qr' ? 'on' : ''}" id="mq">▣ Scan QR</button></div>
    <div class="cam ${mode === 'qr' ? 'back' : ''}"><video id="vd" playsinline muted></video></div>
    <p id="inf" class="ctr sm mut">Posisikan ${mode === 'wajah' ? 'wajah di dalam bingkai' : 'QR di dalam bingkai'}</p>
    ${mode === 'wajah' ? '<button class="btn full" id="go">Verifikasi Wajah & Catat Kehadiran</button>' : ''}`}`;
    $('#ss').onchange = e => { sesi = live.find(j => j.ID_Jadwal === e.target.value); draw(); };
    cekGps();
    if (sdh()) return;
    $('#mw').onclick = () => { mode = 'wajah'; draw(); };
    $('#mq').onclick = () => { mode = 'qr'; draw(); };
    mulaiKamera();
  };
  async function cekGps() {
    try { geo = await posisi(); $('#gps').innerHTML = `<span style="color:var(--ok)">✓ GPS aktif (akurasi ±${Math.round(geo.accuracy)} m)</span>`; }
    catch (e) { geo = null; $('#gps') && ($('#gps').innerHTML = `<span style="color:var(--err)">${pesanGeo(e)}</span>`); }
  }
  async function kirim(payload) {
    if (sibuk) return; sibuk = true;
    try { geo = await posisi(); } catch (e) { sibuk = false; return toast(pesanGeo(e), 'err'); }
    const res = await api('absen', Object.assign({ idJadwal: sesi.ID_Jadwal, lat: geo.latitude, lng: geo.longitude }, payload));
    sibuk = false;
    if (res.success) { stopCam(); hasil(v, res.hasil); } else { toast(res.message, 'err'); if (mode === 'qr') mulaiKamera(); }
  }
  async function mulaiKamera() {
    const vd = $('#vd'); if (!vd) return;
    try {
      if (mode === 'wajah') {
        $('#inf').textContent = 'Memuat model pengenal wajah…'; await loadModels(); await startCam(vd, 'user'); $('#inf').textContent = 'Posisikan wajah Anda tepat di dalam bingkai';
        $('#go').onclick = async () => {
          $('#go').disabled = true; const d = await ambilWajah(vd); $('#go').disabled = false;
          if (!d) return toast('Wajah tidak terdeteksi. Perbaiki cahaya & posisi.', 'err');
          kirim({ metode: 'Wajah', descriptor: d });
        };
      } else {
        await startCam(vd, 'environment'); const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
        const loop = () => {
          if (vd.readyState === 4) { c.width = vd.videoWidth; c.height = vd.videoHeight; x.drawImage(vd, 0, 0); const q = jsQR(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height); if (q && q.data) { stopCam(); return kirim({ metode: 'Barcode', kode: q.data }); } }
          raf = requestAnimationFrame(loop);
        }; loop();
      }
    } catch (e) { $('#inf') && ($('#inf').innerHTML = `<span style="color:var(--err)">Kamera tidak dapat dipakai: izinkan akses kamera di browser. Atau minta pengurus menandai kehadiran manual.</span>`); }
  }
  draw();
}
function hasil(v, h) {
  v.innerHTML = `<div class="glass ctr"><div style="font-size:56px">✅</div><h1>Absen Berhasil Dicatat!</h1><p class="mut">Alhamdulillah, kehadiran Anda telah terverifikasi.</p><span class="chip ${h.status === 'Hadir' ? 'okc' : 'tag'}">Status: ${h.status === 'Hadir' ? 'Hadir Tepat Waktu' : 'Terlambat'}</span></div>
  <div class="glass"><div class="row sp"><h3>Rincian Kehadiran</h3><span class="chip tag mono">TERVERIFIKASI</span></div>
  ${[['ID Verifikasi', h.idAbsen], ['Nama', h.nama + ' (' + h.idJamaah + ')'], ['Sesi', h.sesi], ['Waktu Server', tgl(h.tanggal) + ' • ' + h.jam + ' WIB'], ['Metode', h.metode + (h.jarak !== '' ? ' • ' + h.jarak + ' m dari titik pusat' : '')]].map(x => `<div class="item row sp"><span class="mut">${x[0]}</span><b style="text-align:right">${esc(x[1])}</b></div>`).join('')}</div>
  <p class="ctr" style="font-family:var(--serif);font-style:italic;font-size:18px;margin:16px 0">"Menuntut ilmu adalah jalan lapang menuju surga."</p><a class="btn full" href="#/beranda">Kembali ke Beranda</a>`;
}

// ============ PROFIL ============
async function pageProfil(v) {
  v.innerHTML = `<div class="glass"><div class="row sp"><h1>${esc(U.nama)}</h1><span class="chip okc">Aktif</span></div><span class="chip mono" style="background:var(--navy);color:#fff">${esc(U.id)}</span>
  <p class="mut" style="margin-top:8px">${esc(U.wilayah || '')} • ${esc(U.jenis)}</p><p class="sm mut">WhatsApp: ${esc(U.hp || '-')} • Bergabung: ${tgl(U.bergabung)}</p></div>
  <div class="glass ctr"><h3 style="margin-bottom:12px">QR Kehadiran</h3><div id="qr" style="display:inline-block;background:#fff;padding:12px;border-radius:16px"></div><p class="mono" style="margin:10px 0">${esc(U.kodeBarcode)}</p>
  <p class="sm mut">Tunjukkan QR ini bila verifikasi wajah bermasalah. Wajah ${U.wajahTerdaftar ? 'sudah terdaftar ✓' : '<b style="color:var(--err)">belum terdaftar</b> — hubungi pengurus'}.</p></div>
  <div class="glass"><button class="btn sec full" id="pin">🔑 Ubah PIN Masuk</button><button class="btn sec full" id="rw" style="margin-top:10px">📋 Riwayat Kehadiran Saya</button><button class="btn red full" id="out" style="margin-top:10px">Keluar dari Akun</button></div>`;
  new QRCode($('#qr'), { text: U.kodeBarcode, width: 180, height: 180 });
  $('#out').onclick = () => { S.t = null; U = null; location.hash = '#/login'; };
  $('#pin').onclick = () => { modal(`<h3>Ubah PIN</h3><label>PIN lama</label><input id="a" type="password" inputmode="numeric" maxlength="6"><label>PIN baru (6 digit)</label><input id="b" type="password" inputmode="numeric" maxlength="6"><button class="btn full" id="s" style="margin-top:16px">Simpan</button>`);
    $('#s').onclick = async () => { const r = await api('ubahPin', { pinLama: $('#a').value, pinBaru: $('#b').value }); toast(r.message, r.success ? 'ok' : 'err'); if (r.success) closeModal(); }; };
  $('#rw').onclick = async () => { const r = await api('riwayat'); modal(`<div class="sheet-h"><h3>Riwayat Kehadiran</h3><button class="chip" onclick="closeModal()">Tutup</button></div>` + (r.data || []).map(a => `<div class="item row sp"><div><b>${esc(a.Materi || a.Jenis)}</b><br><span class="sm mut">${tgl(a.Tanggal)} • ${a.Jam_Absen}</span></div><span class="chip ${a.Status === 'Hadir' ? 'okc' : 'tag'}">${a.Status}</span></div>`).join('') || '<p class="mut">Belum ada riwayat.</p>'); };
}
