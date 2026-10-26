# Panduan Instalasi — Absensi Pengajian

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → Proyek baru. Ganti nama `Code.gs` menjadi `Kode`, tempel isi **Kode.gs**.
2. Project Settings → centang "Show appsscript.json", tempel isi **appsscript.json**.
3. Pilih fungsi `setupAppEnvironment` → Run (HANYA SEKALI) → izinkan akses. Catat **ID & PIN pengurus** di Execution log.
4. Deploy → New deployment → Web app → Execute as **Me**, Access **Anyone** → salin URL `/exec`.
5. Di Google Sheets (folder Drive "Absensi Pengajian"), ubah koordinat sheet `Lokasi` ke titik pengajian Anda.
> Setiap Kode.gs diubah, deploy ulang: Deploy → Manage deployments → Edit → New version.

## B. Frontend (GitHub Pages)
**Folder kerja = folder hasil ekstrak ZIP `absensi-pengajian`** (yang langsung berisi `index.html`, `css`, `js`). Jangan masuk lebih dalam atau naik satu level.
1. Buka `js/config.js`, ganti `GANTI_DENGAN_URL_EXEC_ANDA` dengan URL `/exec`.
2. Instal Git (https://git-scm.com/download/win), lalu atur identitas:
   `git config --global user.name "Nama Anda"` dan `git config --global user.email "email@akun-github.com"`
3. Di github.com buat repository **Public** baru (tanpa README/.gitignore).
4. Buka PowerShell di folder kerja (File Explorer → klik address bar → ketik `powershell`). Cek `dir`: **harus terlihat `index.html`**.
5. Jalankan satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Saat diminta password, tempel **Personal Access Token** (github.com/settings/tokens → classic → centang `repo`). Layar tidak menampilkan apa pun saat paste — itu normal.
6. Repo → Settings → Pages → Deploy from branch → `main` / `(root)` → Save → centang **Enforce HTTPS** (wajib untuk kamera & GPS).
7. Buka `https://USERNAME.github.io/NAMA-REPO/` dan login dengan ID/PIN pengurus.

## C. Update
`git add .` → `git commit -m "perubahan"` → `git push`, lalu Ctrl+Shift+R.

## D. Pemakaian awal
Kelola → Lokasi (atur titik GPS) → Jamaah (tambah, catat PIN awal) → ikon 😊 daftarkan wajah → Jadwal (buat sesi) → Absen.

## Masalah umum
| Gejala | Solusi |
|---|---|
| 404 di GitHub Pages | `index.html` tidak di root repo → push ulang dari folder yang benar |
| Halaman tanpa gaya | folder `css/` `js/` rata di root → jangan upload via web GitHub |
| "Gagal terhubung ke server" | GAS_URL salah / belum deploy ulang / akses bukan "Anyone" |
| Kamera/GPS tidak jalan | Pastikan HTTPS & izin browser diberikan |
