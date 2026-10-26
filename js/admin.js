// ============ KELOLA (CRUD Pengurus) ============
const TABEL = {
  Jamaah: { id: 'ID_Jamaah', kolom: ['ID_Jamaah', 'Nama_Lengkap', 'Kelompok_Wilayah', 'Status'], f: [['Nama_Lengkap', 'Nama lengkap'], ['No_HP', 'No. WhatsApp'], ['Kelompok_Wilayah', 'Kelompok / Wilayah'], ['Jenis_Pengajian', 'Jenis pengajian (pisahkan koma: Ibu-ibu,Caberawit,Kelompok)'], ['Peran', 'Peran', ['Jamaah', 'Admin']], ['Status', 'Status', ['Aktif', 'Nonaktif']]] },
  Jadwal: { id: 'ID_Jadwal', kolom: ['Tanggal', 'Jam_Mulai', 'Materi', 'Status'], f: [['ID_Jenis', 'Jenis pengajian', 'jenis'], ['Tanggal', 'Tanggal', 'date'], ['Jam_Mulai', 'Jam mulai', 'time'], ['Jam_Selesai', 'Jam selesai', 'time'], ['Tempat', 'Tempat'], ['Pemateri', 'Pemateri'], ['Materi', 'Materi / judul'], ['ID_Lokasi', 'Titik lokasi GPS', 'lokasi'], ['Status', 'Status', ['Terjadwal', 'Dibatalkan']]] },
  Kegiatan: { id: 'ID_Kegiatan', kolom: ['Tanggal', 'Judul', 'Dipublikasikan'], f: [['Judul', 'Judul'], ['Deskripsi', 'Deskripsi', 'area'], ['Tanggal', 'Tanggal', 'date'], ['Tempat', 'Tempat'], ['Foto_URL', 'URL foto (opsional)'], ['Dipublikasikan', 'Dipublikasikan', ['Ya', 'Tidak']]] },
  Lokasi: { id: 'ID_Lokasi', kolom: ['Nama_Lokasi', 'Latitude', 'Longitude', 'Radius_Meter'], f: [['Nama_Lokasi', 'Nama lokasi'], ['Latitude', 'Latitude'], ['Longitude', 'Longitude'], ['Radius_Meter', 'Radius (meter)']] }
};
let kTab = 'Jamaah';

async function pageKelola(v) {
  v.innerHTML = `<h1>Kelola Data</h1><div class="row wr" style="margin:12px 0">${Object.keys(TABEL).map(t => `<button class="chip ${t === kTab ? 'on' : ''}" data-t="${t}">${t}</button>`).join('')}</div><div id="kb"></div>`;
  v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { kTab = b.dataset.t; pageKelola(v); });
  const T = TABEL[kTab], r = await api('adminList', { tabel: kTab });
  if (!r.success) return $('#kb').innerHTML = `<div class="err-box">${esc(r.message)}</div>`;
  const rows = r.data;
  $('#kb').innerHTML = `<div class="glass"><div class="row sp wr" style="margin-bottom:10px"><input id="cari" placeholder="Cari…" style="max-width:240px"><button class="btn sm" id="tbh">+ Tambah</button></div><div class="tw"><table><thead><tr>${T.kolom.map(k => `<th>${k.replace('_', ' ')}</th>`).join('')}${kTab === 'Jamaah' ? '<th>Wajah</th>' : ''}<th>Aksi</th></tr></thead><tbody id="tb"></tbody></table></div><p class="sm mut">${rows.length} data</p></div>`;
  const draw = () => {
    const q = $('#cari').value.toLowerCase();
    $('#tb').innerHTML = rows.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q)).map(x => `<tr>${T.kolom.map(k => `<td>${esc(x[k])}</td>`).join('')}${kTab === 'Jamaah' ? `<td>${x.WajahTerdaftar ? '<span class="chip okc">✓</span>' : '<span class="chip bad">belum</span>'}</td>` : ''}
      <td style="white-space:nowrap"><button class="btn sm sec" data-e="${esc(x[T.id])}">✏️</button> ${kTab === 'Jamaah' ? `<button class="btn sm sec" data-w="${esc(x[T.id])}" title="Daftar wajah">😊</button><button class="btn sm sec" data-q="${esc(x[T.id])}" title="QR">▣</button><button class="btn sm sec" data-p="${esc(x[T.id])}" title="Reset PIN">🔑</button><button class="btn sm sec" data-m="${esc(x[T.id])}" title="Hadirkan manual">✔</button>` : ''} <button class="btn sm red" data-d="${esc(x[T.id])}">🗑</button></td></tr>`).join('');
    const find = id => rows.find(x => x[T.id] === id);
    $('#tb').querySelectorAll('[data-e]').forEach(b => b.onclick = () => formKelola(find(b.dataset.e)));
    $('#tb').querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { if (!confirm('Hapus data ' + b.dataset.d + '? Tindakan ini dicatat di log.')) return; const x = await api('adminHapus', { tabel: kTab, id: b.dataset.d }); toast(x.message, x.success ? 'ok' : 'err'); if (x.success) pageKelola(v); });
    $('#tb').querySelectorAll('[data-w]').forEach(b => b.onclick = () => daftarWajahModal(b.dataset.w, v));
    $('#tb').querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const j = find(b.dataset.q); modal(`<div class="ctr"><h3>${esc(j.Nama_Lengkap)}</h3><div id="qq" style="display:inline-block;background:#fff;padding:12px;margin:14px"></div><p class="mono">${esc(j.Kode_Barcode)}</p><button class="btn sec" onclick="window.print()">🖨️ Cetak</button></div>`); new QRCode($('#qq'), { text: j.Kode_Barcode, width: 200, height: 200 }); });
    $('#tb').querySelectorAll('[data-p]').forEach(b => b.onclick = async () => { if (!confirm('Reset PIN jamaah ini?')) return; const x = await api('resetPin', { idJamaah: b.dataset.p }); if (x.success) modal(`<div class="ctr"><h3>PIN Baru</h3><h1 class="mono" style="font-size:36px;margin:12px">${x.pinBaru}</h1><p class="mut">Sampaikan ke jamaah. PIN tidak akan ditampilkan lagi.</p></div>`); else toast(x.message, 'err'); });
    $('#tb').querySelectorAll('[data-m]').forEach(b => b.onclick = async () => { const s = await api('jadwal', { dari: iso(new Date(Date.now() - 864e5)), sampai: iso(new Date(Date.now() + 864e5)) }); const l = (s.data || []).find(j => j.StatusSesi === 'Berlangsung'); if (!l) return toast('Tidak ada sesi yang sedang berlangsung.', 'err'); if (!confirm('Tandai hadir manual pada sesi: ' + (l.Materi || l.Tempat) + '?')) return; const x = await api('absenManual', { idJadwal: l.ID_Jadwal, idJamaah: b.dataset.m }); toast(x.message, x.success ? 'ok' : 'err'); });
  };
  $('#cari').oninput = draw; draw();
  $('#tbh').onclick = () => formKelola({});
  async function formKelola(row) {
    const ref = {}; if (T.f.some(f => f[2] === 'jenis' || f[2] === 'lokasi')) { const [j, l] = await Promise.all([api('adminList', { tabel: 'Jenis_Pengajian' }, true), api('adminList', { tabel: 'Lokasi' }, true)]); ref.jenis = (j.data || []).map(x => [x.ID_Jenis, x.Nama]); ref.lokasi = (l.data || []).map(x => [x.ID_Lokasi, x.Nama_Lokasi]); }
    const fld = f => { const [k, lb, t] = f, val = esc(row[k] ?? '');
      let inp = Array.isArray(t) ? `<select id="f_${k}">${t.map(o => `<option ${o === (row[k] || t[0]) ? 'selected' : ''}>${o}</option>`).join('')}</select>`
        : (t === 'jenis' || t === 'lokasi') ? `<select id="f_${k}">${ref[t].map(o => `<option value="${o[0]}" ${o[0] === row[k] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`
        : t === 'area' ? `<textarea id="f_${k}" rows="3">${val}</textarea>` : `<input id="f_${k}" type="${t || 'text'}" value="${val}">`;
      return `<label>${lb}</label>${inp}`; };
    modal(`<div class="sheet-h"><h3>${row[T.id] ? 'Ubah' : 'Tambah'} ${kTab}</h3><button class="chip" onclick="closeModal()">Batal</button></div>${T.f.map(fld).join('')}
      ${kTab === 'Lokasi' ? '<button class="btn sec full" id="gpsb" style="margin-top:12px">📍 Pakai posisi saya sekarang</button>' : ''}<button class="btn full" id="sv" style="margin-top:16px">Simpan</button>`);
    if (kTab === 'Lokasi') $('#gpsb').onclick = async () => { try { const c = await posisi(); $('#f_Latitude').value = c.latitude; $('#f_Longitude').value = c.longitude; } catch (e) { toast(pesanGeo(e), 'err'); } };
    $('#sv').onclick = async () => {
      const o = { [T.id]: row[T.id] || '' }; T.f.forEach(f => o[f[0]] = $('#f_' + f[0]).value);
      const x = await api('adminSimpan', { tabel: kTab, row: o });
      if (x.success) { closeModal(); toast(x.message); if (x.pinAwal) modal(`<div class="ctr"><h3>Jamaah ${x.id} dibuat</h3><p class="mut">PIN awal (catat & sampaikan, tidak ditampilkan lagi):</p><h1 class="mono" style="font-size:36px;margin:12px">${x.pinAwal}</h1></div>`); pageKelola(v); } else toast(x.message, 'err');
    };
  }
}

async function daftarWajahModal(id, v) {
  modal(`<div class="sheet-h"><h3>Daftarkan Wajah ${esc(id)}</h3><button class="chip" onclick="closeModal()">Tutup</button></div><div class="cam"><video id="wv" playsinline muted></video></div><p id="wi" class="ctr sm mut">Memuat model…</p><button class="btn full" id="wb" disabled>Ambil & Simpan Wajah</button>`);
  try { await loadModels(); await startCam($('#wv'), 'user'); $('#wi').textContent = 'Minta jamaah menatap kamera dengan cahaya cukup.'; $('#wb').disabled = false; } catch (e) { return $('#wi').textContent = 'Kamera tidak dapat dipakai: ' + e.message; }
  $('#wb').onclick = async () => { const d = await ambilWajah($('#wv')); if (!d) return toast('Wajah tidak terdeteksi.', 'err'); const x = await api('daftarWajah', { idJamaah: id, descriptor: d }); toast(x.message, x.success ? 'ok' : 'err'); if (x.success) { closeModal(); pageKelola(v); } };
}

// ============ LAPORAN ============
async function pageLaporan(v) {
  const now = new Date(), awal = iso(new Date(now.getFullYear(), now.getMonth(), 1));
  const jn = await api('jadwal', { dari: '2000-01-01', sampai: '2000-01-02' }, true);
  v.innerHTML = `<h1>Laporan & Rekap Kehadiran</h1><div class="glass"><div class="g g2"><div><label>Dari</label><input type="date" id="d1" value="${awal}"></div><div><label>Sampai</label><input type="date" id="d2" value="${iso(now)}"></div>
  <div><label>Jenis</label><select id="jn"><option value="">Semua</option>${(jn.jenis || []).map(j => `<option value="${j.ID_Jenis}">${esc(j.Nama)}</option>`).join('')}</select></div>
  <div><label>Status</label><select id="st"><option value="">Semua</option><option>Hadir</option><option>Terlambat</option></select></div><div><label>Cari nama/ID</label><input id="q"></div></div>
  <div class="row wr" style="margin-top:14px"><button class="btn" id="ok">Terapkan Filter</button><button class="btn sec" id="xl">⬇ Unduh Excel</button><button class="btn sec" id="pf">⬇ Unduh PDF</button></div></div><div id="lb"></div>`;
  let data = [];
  const muat = async () => {
    const r = await api('laporan', { dari: $('#d1').value, sampai: $('#d2').value, idJenis: $('#jn').value, status: $('#st').value, q: $('#q').value });
    if (!r.success) return toast(r.message, 'err'); data = r.data;
    const tepat = data.filter(x => x.status === 'Hadir').length, tren = {}; data.forEach(x => tren[x.tanggal] = (tren[x.tanggal] || 0) + 1);
    const hari = Object.keys(tren).sort().slice(-10), mx = Math.max(1, ...hari.map(h => tren[h]));
    $('#lb').innerHTML = `<div class="g g2"><div class="glass"><div class="mut sm">TOTAL REKAP</div><h1>${data.length}</h1></div><div class="glass"><div class="mut sm">TEPAT WAKTU</div><h1>${tepat}</h1></div><div class="glass"><div class="mut sm">TERLAMBAT</div><h1>${data.length - tepat}</h1></div></div>
    <div class="glass"><h3>Tren Kehadiran Harian</h3>${hari.map(h => `<div class="row" style="margin:6px 0"><span class="mono" style="width:80px">${h.slice(5)}</span><div class="bar" style="width:${tren[h] / mx * 70}%"></div><b>${tren[h]}</b></div>`).join('') || '<p class="mut">Tidak ada data.</p>'}</div>
    <div class="glass"><h3>Log Presensi</h3><div class="tw"><table><thead><tr><th>Tanggal</th><th>Jam</th><th>Jenis</th><th>Nama</th><th>Wilayah</th><th>Metode</th><th>Status</th></tr></thead><tbody>${data.slice(0, 300).map(x => `<tr><td>${x.tanggal}</td><td class="mono">${x.jam}</td><td>${esc(x.jenis)}</td><td><b>${esc(x.nama)}</b><br><span class="mono mut">${x.idJamaah}</span></td><td>${esc(x.wilayah)}</td><td>${x.metode}${x.jarak !== '' ? ' ' + x.jarak + 'm' : ''}</td><td><span class="chip ${x.status === 'Hadir' ? 'okc' : 'tag'}">${x.status}</span></td></tr>`).join('')}</tbody></table></div><p class="sm mut">Menampilkan ${Math.min(300, data.length)} dari ${data.length}. Ekspor memuat semua data terfilter.</p></div>`;
  };
  $('#ok').onclick = muat;
  const H = ['Tanggal', 'Jam', 'Jenis Pengajian', 'ID Jamaah', 'Nama', 'Kelompok/Wilayah', 'Metode', 'Status'];
  const B = () => data.map(x => [x.tanggal, x.jam, x.jenis, x.idJamaah, x.nama, x.wilayah, x.metode, x.status]);
  $('#xl').onclick = () => { if (!data.length) return toast('Tidak ada data.', 'err'); const ws = XLSX.utils.aoa_to_sheet([H, ...B()]), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Rekap'); XLSX.writeFile(wb, `Rekap_Absensi_${$('#d1').value}_${$('#d2').value}.xlsx`); };
  $('#pf').onclick = () => { if (!data.length) return toast('Tidak ada data.', 'err'); const d = new window.jspdf.jsPDF('l'); d.setFontSize(14); d.text('Rekap Kehadiran Pengajian', 14, 14); d.setFontSize(9); d.text(`Periode ${$('#d1').value} s/d ${$('#d2').value} • ${data.length} data`, 14, 20); d.autoTable({ head: [H], body: B(), startY: 25, styles: { fontSize: 8 }, headStyles: { fillColor: [35, 43, 69] } }); d.save(`Rekap_Absensi_${$('#d1').value}_${$('#d2').value}.pdf`); };
  muat();
}
