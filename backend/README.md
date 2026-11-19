# SEMAR Web Service API (Express.js)

Backend RESTful Web Service API untuk sistem **SEMAR** (Sistem Pengelolaan Sampah, Biokonversi Maggot, dan Keuangan Kas), dirancang menggunakan Express.js dengan arsitektur modular yang siap dihubungkan ke aplikasi mobile (React Native) dan web client.

---

## 📁 Struktur Direktori

```text
backend/
├── .env                  # Environment variable lokal
├── .env.example          # Contoh template konfigurasi
├── .gitignore            # Pengabaian file git (node_modules, .env)
├── package.json          # Dependency & npm scripts
├── README.md             # Dokumentasi API
└── src/
    ├── app.js            # Inisialisasi Express & middleware
    ├── server.js         # Entrypoint server listener
    ├── config/
    │   └── env.js        # Konfigurasi environment (PORT, dll)
    ├── controllers/      # Logika bisnis per modul
    │   ├── binController.js     # Modul status tong sampah pintar
    │   ├── catatController.js   # Modul catat setoran & timbangan sensor
    │   ├── olahController.js    # Modul drum komposter & maggot
    │   ├── kasController.js     # Modul keuangan kas & penjualan
    │   └── dampakController.js  # Modul statistik dampak lingkungan
    ├── data/
    │   └── initialData.js       # Data store awal (in-memory)
    ├── docs/
    │   └── openapi.js           # Spesifikasi OpenAPI 3.1.0 lengkap
    ├── middlewares/
    │   ├── errorHandler.js      # Global error handling
    │   └── notFound.js          # 404 handler
    └── routes/                  # Definisi rute RESTful API
        ├── binRoutes.js
        ├── catatRoutes.js
        ├── olahRoutes.js
        ├── kasRoutes.js
        ├── dampakRoutes.js
        ├── docRoutes.js         # Rute dokumentasi Scalar (/docs/api)
        └── index.js             # Rute agregasi (/api)
```

---

## 🚀 Cara Menjalankan

### 1. Masuk ke direktori backend
```bash
cd backend
```

### 2. Instalasi Dependensi (jika belum)
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Default PORT adalah `5000`.

### 4. Menjalankan Server

**Mode Development (auto-reload saat file berubah):**
```bash
npm run dev
```

**Mode Production:**
```bash
npm start
```

Server akan aktif di: `http://localhost:5000`
Dokumentasi interaktif Scalar: `http://localhost:5000/docs/api`

---

## 📖 Dokumentasi API Interaktif (Scalar)

Buka browser ke alamat:
```
http://localhost:5000/docs/api
```
Fitur dokumentasi Scalar:
- Tampilan UI modern, responsif, dan interaktif
- Pengujian endpoint langsung (*integrated API test client / try it out*)
- Contoh kode otomatis (*cURL, JavaScript/Fetch, Python, Node, dll.*)
- Endpoint raw JSON spec: `http://localhost:5000/docs/api/openapi.json`

---

## 📡 Daftar Endpoint API

Prefix root API: `/api`

### 1. Health Check
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Pesan selamat datang & ringkasan rute |
| `GET` | `/api/health` | Status kesehatan server |

### 2. Status Tong Sampah Pintar (`/api/bins`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/bins` | Mengambil seluruh data status tong sampah per lantai |
| `GET` | `/api/bins/:id` | Mengambil detail tong sampah berdasarkan ID |
| `PUT` | `/api/bins/:id` | Memperbarui data tong (berat, status, suhu, persentase) |
| `PATCH` | `/api/bins/:id/toggle-sensor` | Mengaktifkan / menonaktifkan sensor IoT |

### 3. Catat Setoran & Sensor Lantai (`/api/catat`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/catat/sensor-weights` | Data berat real-time sensor IoT per lantai |
| `GET` | `/api/catat/history` | Riwayat seluruh setoran sampah tersimpan |
| `POST` | `/api/catat` | Mencatat setoran baru (otomatis mereset berat tong di lantai terkait) |
| `DELETE` | `/api/catat/:id` | Menghapus riwayat setoran berdasarkan ID |

### 4. Pengolahan Kompos & Maggot (`/api/olah`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/olah/drums` | Daftar drum komposter (suhu, kelembapan, fase kematangan) |
| `PUT` | `/api/olah/drums/:id` | Memperbarui parameter drum komposter |
| `GET` | `/api/olah/maggot` | Status siklus biokonversi maggot & estimasi panen |
| `PUT` | `/api/olah/maggot` | Memperbarui parameter siklus maggot |
| `GET` | `/api/olah/harvests` | Riwayat log panen prepupa / maggot / kasgot |
| `POST` | `/api/olah/harvests` | Menambahkan catatan panen baru |

### 5. Kas & Keuangan (`/api/kas`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/kas` | Ringkasan saldo total (income, expense, balance) & daftar transaksi |
| `POST` | `/api/kas` | Menambahkan transaksi baru (`income` / `expense`) |
| `DELETE` | `/api/kas/:id` | Menghapus transaksi kas berdasarkan ID |

### 6. Dampak Lingkungan (`/api/dampak`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/dampak` | Data akumulasi sampah terolah, reduksi emisi, grafik mingguan & lantai |
| `PUT` | `/api/dampak` | Memperbarui data statistik dampak lingkungan |

---

## 🛠️ Integrasi dengan React Native (`prot-react-native`)

Untuk menghubungkan dari emulator atau device fisik, atur baseURL API di aplikasi React Native:
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator / Web**: `http://localhost:5000/api`
- **Device Fisik (Expo Go)**: `http://<IP-Laptop-Anda>:5000/api` (misal: `http://192.168.1.10:5000/api`)
