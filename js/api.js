const S = {
  get t() { return localStorage.getItem('tk'); },
  set t(v) { v ? localStorage.setItem('tk', v) : localStorage.removeItem('tk'); }
};
// POST wajib text/plain agar tidak memicu CORS preflight yang diblok GAS
async function api(action, data = {}, diam = false) {
  if (!diam) loading(true);
  try {
    const r = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: S.t, data }) });
    const j = await r.json();
    if (j.code === 'SESI_HABIS') { S.t = null; U = null; location.hash = '#/login'; }
    return j;
  } catch (e) {
    return { success: false, message: 'Gagal terhubung ke server. Periksa koneksi internet & GAS_URL.' };
  } finally { if (!diam) loading(false); }
}
