# 👾 Mikroba Ninja - Pertempuran Sistem Imun Tubuh

**Mikroba Ninja** adalah game kasual 2D berbasis mobile untuk Android yang terinspirasi dari gameplay klasik *Fruit Ninja*, namun dikemas dengan tema sains mikroskopis di dalam aliran darah manusia. 

Game ini memadukan **sensasi aksi sabetan jari** dengan **unsur edukasi biologis**, di mana pemain harus memotong mikroba musuh pembawa penyakit sekaligus menjaga sel-sel imun pelindung tubuh tetap aman!

---

## 🎨 Fitur Game & Sisi Edukasi

### 👾 Karakter & Unit Mikroskopis

1. **Bakteri (Musuh - Potong! | +10 Poin)**
   * **Visual**: Kapsul hijau tua dengan rambut-rambut halus (pili) yang berputar perlahan.
   * **Bila Terpotong**: Terbelah menjadi dua bagian dan menyemprotkan cairan lendir hijau/ungu yang organik.
   * **Edukasi**: Bakteri patogen adalah agen infeksi yang harus dibasmi agar tidak menyebarkan racun di dalam darah.

2. **Virus (Musuh - Potong! | +15 Poin)**
   * **Visual**: Bola berduri merah muda dengan bintik-bintik oranye yang terbang cepat dan sesekali berkedip (menyamarkan diri).
   * **Bila Terpotong**: Meledak hancur menjadi partikel-partikel piksel merah muda dan oranye.
   * **Edukasi**: Virus menginfeksi sel tubuh sehat untuk bereproduksi. Mereka bergerak lincah dan harus segera dihancurkan.

3. **Makrofag (Kawan - JANGAN DIPOTONG! | -1 Nyawa)**
   * **Visual**: Awan berbulu putih besar dengan inti sel (nukleus) berwarna biru langit yang berdenyut pelan.
   * **Bila Terpotong**: Memotong makrofag akan memicu alarm peringatan, menggetarkan layar merah, dan mengurangi 1 hati nyawa.
   * **Edukasi**: Makrofag adalah sel darah putih raksasa pelindung tubuh yang bertugas menelan dan mencerna (fagositosis) bakteri jahat.

4. **Antibodi (Kawan - JANGAN DIPOTONG! | -1 Nyawa)**
   * **Visual**: Berbentuk huruf "Y" kuning emas mengkilap yang berputar cepat di udara.
   * **Bila Terpotong**: Memicu alarm dan getar layar merah, mengurangi 1 hati nyawa.
   * **Edukasi**: Antibodi adalah protein kekebalan yang diproduksi sel darah putih untuk mengikat antigen kuman secara spesifik agar musuh lumpuh.

---

## ⚙️ Mekanik Gameplay Lanjutan

* **Sistem Nyawa/HP (3 Lives)**: Pemain memiliki 3 hati. Nyawa berkurang jika memotong kawan (Makrofag/Antibodi) ATAU jika ada musuh (Bakteri/Virus) yang lolos jatuh ke bawah layar. Jika nyawa habis, Game Over!
* **Efek Visual Laser Antiseptik**: Sabetan jari menghasilkan jalur cahaya biru neon laser antiseptik dengan inti putih yang memukau.
* **Sistem Skor Kombo**: Jika memotong 3 atau lebih bakteri/virus dalam satu sabetan menahan jari, pemain mendapatkan **bonus skor kombo (+5 poin per mikroba)**!
* **Mekanik Leveling Otomatis (Setiap 15 Detik)**:
  * **Level 1 (0-15s)**: Kecepatan lambat. Muncul 1-2 unit sekali muncul. Hanya bakteri yang muncul.
  * **Level 2 (15-30s)**: Kecepatan meningkat 20%. Makrofag mulai berpatroli.
  * **Level 3 (30-45s)**: Kecepatan meningkat 40%. Antibodi mulai muncul. Mikroba muncul berkelompok (3-4 unit).
  * **Level 4+ (45s ke atas)**: Kecepatan meningkat 60%+. Frenzy Mode acak dan sangat cepat!
* **Codex Mikroskopis**: Menu edukasi interaktif di halaman utama untuk mempelajari peranan masing-masing sel dalam sistem kekebalan tubuh.
* **Informasi Medis Edukatif**: Menampilkan fakta trivia sains medis acak setiap kali layar Game Over untuk menambah wawasan medis pemain.

---

## 🚀 Cara Menjalankan Game Secara Lokal (Development)

Proyek ini menggunakan **Vite** sebagai server preview lokal berkinerja tinggi.

### Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).

### 1. Instalasi Dependensi
Jalankan perintah berikut di PowerShell atau Command Prompt Anda:
```bash
npm.cmd install
```
*(Catatan: Menggunakan `npm.cmd` alih-alih `npm` untuk menghindari pembatasan ExecutionPolicy PowerShell di Windows).*

### 2. Jalankan Server Dev Lokal
Jalankan perintah ini untuk memulai server preview lokal:
```bash
npm.cmd run dev
```
Setelah berjalan, buka browser di alamat yang tertera (biasanya `http://localhost:5173`) untuk memainkan game secara langsung. Anda dapat mengaktifkan **Mode Emulasi Perangkat Seluler (F12 -> Toggle Device Toolbar)** di browser untuk menguji sabetan touch screen.

---

## 📱 Cara Kompilasi Menjadi File APK Android (Siap Play Store)

Kami menggunakan **Capacitor** untuk membungkus kode game berbasis HTML5 Canvas ini menjadi aplikasi Android native yang sangat cepat.

### Langkah-langkah Pembuatan APK:

### 1. Build File Web Produksi
Kompilasi game menjadi aset produksi yang optimal di dalam folder `dist/`:
```bash
npm.cmd run build
```

### 2. Tambahkan Platform Android
Jalankan perintah Capacitor berikut untuk membuat folder proyek Android asli:
```bash
npx.cmd cap add android
```

### 3. Sinkronkan Aset Game ke Android
Setiap kali Anda melakukan perubahan kode di game dan melakukan `npm.cmd run build`, jalankan perintah ini untuk menyalin aset terbaru ke proyek Android:
```bash
npx.cmd cap sync android
```

### 4. Buka Proyek di Android Studio
Buka Android Studio secara otomatis dengan memanggil:
```bash
npx.cmd cap open android
```

### 5. Kompilasi APK di Android Studio:
Di dalam **Android Studio**:
1. Tunggu hingga proses indexing Gradle selesai sepenuhnya.
2. Untuk menguji di HP Anda secara langsung: 
   * Hubungkan HP Android menggunakan kabel USB (pastikan *USB Debugging* aktif di menu Opsi Pengembang HP Anda).
   * Klik tombol hijau **Run** (Ikon Play) di bagian atas Android Studio.
3. Untuk membuat file `.apk` siap pasang:
   * Pergi ke menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   * File `.apk` yang selesai dibuat akan tersimpan di subfolder: `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Untuk merilis ke **Google Play Store**:
   * Pergi ke menu **Build** > **Generate Signed Bundle / APK...**.
   * Pilih **Android App Bundle** (.aab), buat kunci tanda tangan (*Keystore*), lalu ikuti panduan build rilis.

---

## 🌟 Keunggulan Teknis Proyek Ini
* **Performa Maksimal**: Tanpa aset gambar gambar besar, rendering murni berbasis **HTML5 Canvas Vektor Prosedural** yang berjalan lancar di **60 FPS** pada semua perangkat Android.
* **Tanpa Loading / Lag**: Tidak memakan ruang memori besar dan langsung dimuat dalam sekejap.
* **Audio Sintetis Tanpa File**: BGM Upbeat Synth dan seluruh SFX disintesis secara real-time langsung lewat kode web browser menggunakan **Web Audio API** asli, membuat game beroperasi 100% offline dan berukuran sangat kecil (di bawah 1 MB sebelum dibungkus!).
* **Multi-Touch & Touch Action None**: Dioptimalkan secara penuh untuk interaksi multi-sentuh tanpa terganggu gerakan kembali/tarik-segarkan bawaan browser Android.
