# 🌐 PENS Room Booking - Frontend

Repositori ini berisi kode sumber antarmuka (Frontend) untuk aplikasi **Peminjaman Ruangan PENS**. Proyek ini merupakan bagian dari tugas Semester 4 untuk membangun sistem booking real-time yang modern dan user-friendly.

## 🎨 Fitur Visual & UI
* **Tema Terang (Light Mode)**: Desain bersih dengan palet warna Biru PENS (#2563eb) dan Putih Bersih.
* **Dashboard Real-time**: Monitoring status peminjaman langsung yang terhubung ke API.
* **Modal Form yang Rapi**: Input data menggunakan toggle modal dengan efek *backdrop blur*.
* **Responsive Design**: Nyaman diakses baik dari desktop maupun perangkat mobile.

## 🛠️ Tech Stack
* **Vite**: Alat build frontend generasi terbaru yang super cepat.
* **React + TypeScript**: Library UI dengan sistem tipe data yang kuat untuk meminimalisir error.
* **Tailwind CSS v4**: Framework CSS utility-first untuk styling cepat dan modern.

## ⚙️ Cara Menjalankan di Lokal

1.  **Clone Repositori**:
    ```bash
    git clone [https://github.com/koalaruu/2026-peminjaman-ruangan-frontend.git](https://github.com/koalaruu/2026-peminjaman-ruangan-frontend.git)
    cd room-booking-frontend
    ```

2.  **Instalasi Dependencies**:
    ```bash
    npm install
    ```

3.  **Konfigurasi API Backend**:
    Aplikasi ini memerlukan Backend ASP.NET Core berjalan. Pastikan API kamu aktif di:
    `http://localhost:5023/api/Bookings`.

4.  **Jalankan Server Development**:
    ```bash
    npm run dev
    ```
    Buka browser di [http://localhost:5173](http://localhost:5173).

## 🔐 Panduan Hak Akses (Role)
Gunakan kredensial berikut untuk mencoba berbagai fitur:
* **User**: Tanpa password. Bisa menambah data peminjaman baru.
* **Manager**: Password `password123`. Bisa mengupdate status (Approved/Rejected).
* **Admin**: Password `password123`. Akses penuh untuk Edit dan Hapus data.

---
**Dibuat oleh:** **Adryan Fahmi Ramadhan** NRP: 312460082  
ITDS - Politeknik Elektronika Negeri Surabaya