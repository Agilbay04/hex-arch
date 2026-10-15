# Backend NestJS

Backend latihan dengan NestJS dan Hexagonal Architecture. Aplikasi API berada di `apps/api` mengikuti struktur monorepo pada bagian 6.1 TSD.

## Menjalankan API

Pasang dependency dari root workspace:

```bash
npm install
```

Salin contoh konfigurasi ke file lokal:

```bash
cp .env.example .env
```

Isi `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `NODE_ENV`, `AUTH_ADAPTER`, serta dua token dan UUID user mock di `.env`. Username/password Redis boleh kosong jika Redis lokal tidak memakai autentikasi. Token mock admin menghasilkan role `ROLE_ADMIN_HRGA`; token karyawan menghasilkan `ROLE_KARYAWAN`. API hanya menerima admin untuk endpoint master data. Adapter mock menolak berjalan di production. File `.env` diabaikan Git.

Jalankan migrasi PostgreSQL setelah database tersedia:

```bash
npm run db:migrate
```

Masukkan data awal jenis olahraga (aman dijalankan ulang):

```bash
npm run db:seed
```

Jalankan API dalam mode development:

```bash
npm run start:dev
```

Build aplikasi:

```bash
npm run build
```

Jest unit test dan e2e dijalankan melalui script workspace:

```bash
npm test
npm run test:e2e
```

Swagger tersedia di `http://localhost:3000/api` saat API berjalan.

## Endpoint jenis olahraga

Semua endpoint memerlukan header `Authorization: Bearer <DEV_IAM_ADMIN_TOKEN>`.

```text
GET  /sport/master/sports
POST /sport/master/sports
PUT  /sport/master/sports/:id
PUT  /sport/master/sports/:id/status
```

Contoh body create/update:

```json
{
  "sportName": "Badminton",
  "sportIcon": "https://example.com/badminton.svg",
  "availabilityType": "BOTH"
}
```

Body ubah status: `{ "isActive": false }`. File `.env` tidak masuk Git.

## Arsitektur

- `apps/api/src/core/` berisi domain, use case, dan port yang tidak bergantung pada NestJS atau adapter infrastruktur.
- `apps/api/src/adapters/` berisi adapter input seperti REST controller, DTO, dan auth guard.
- `apps/api/src/infrastructure/` berisi adapter PostgreSQL, Redis, dan mock IAM lokal.
- `apps/api/src/modules/` menghubungkan port ke adapter melalui dependency injection NestJS.

Mock IAM hanya untuk development dan test. Jangan gunakan token mock di production.
