# Flouwell

Anonymous mental wellness PWA. Built with Next.js 15 (App Router), TypeScript, Tailwind, and Supabase. Tempat melampiaskan
beban tanpa dihakimi, dengan dukungan komunitas yang anonim.

## Arsitektur (modular monolith)

Satu aplikasi, dipisah rapi per domain. Logic bisnis tidak menempel ke
framework atau Supabase, jadi kalau suatu saat perlu dipecah jadi service
terpisah, jahitannya sudah ada.

```
src/
  core/                     # Domain murni (entitas, error). Bebas framework.
    entities/
    errors.ts
  lib/supabase/             # Detail teknis Supabase (client, server, middleware).
  modules/
    auth/                   # Satu modul = satu domain.
      domain/               #   tipe & aturan domain
      data/                 #   repository: interface + implementasi Supabase
      services/             #   use-case / logic bisnis (validasi di sini)
      index.ts              #   composition root (rakit dependency)
  app/                      # Next.js App Router (UI + route).
  components/
```

Arah dependensi: `app -> service -> repository (interface) <- impl Supabase`.
UI dan logic bisnis tidak pernah memanggil Supabase langsung.

Modul berikutnya (posts, reactions, replies) mengikuti pola folder yang sama.

## Setup

1. Install dependency:
   ```
   npm install
   ```

2. Buat project di https://supabase.com, lalu jalankan migration
   `0001_soulpace_init.sql` di SQL Editor (skema + RLS + auto handle).

3. Aktifkan login tamu: Supabase Dashboard > Authentication > Sign In / Up >
   aktifkan "Anonymous sign-ins". (Dipakai untuk persona Lurker.)

4. Salin env:
   ```
   cp .env.local.example .env.local
   ```
   Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   dari Supabase Dashboard > Project > Connect (atau Settings > API).

5. Jalankan:
   ```
   npm run dev
   ```
   Buka http://localhost:3000

## Deploy (Vercel)

1. Push ke GitHub.
2. Import repo di Vercel.
3. Set environment variable yang sama seperti `.env.local`.
4. Deploy.

## Catatan

- Verifikasi user di server selalu pakai `supabase.auth.getUser()`, bukan
  sekadar baca cookie.
- Email confirmation: arahkan redirect URL Supabase ke `/auth/confirm`.
- Belum termasuk: ganti handle + filter kata kasar, crisis keyword detection,
  feed asli. Semua menyusul di step berikutnya.
