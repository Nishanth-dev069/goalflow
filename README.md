# GoalFlow — Setup Guide

## Prerequisites
- Node.js 18+
- A Supabase account (free tier works)

## Setup
1. Clone repo and cd into it
2. `npm install`
3. Create a Supabase project at supabase.com
4. Copy `.env.example` to `.env.local` and fill in your Supabase values
5. Run the migration: paste the SQL files from `supabase/migrations/` in order into the Supabase SQL Editor
6. Create the first admin in Supabase Auth → Users
7. Run: `UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';`
8. `npm run dev` → open `http://localhost:3000`

## Adding Team Members
1. Login as admin
2. Go to Admin → Team
3. Click "Add Member"
4. Set their name, email, password, role, and department
5. Share the login URL and credentials with them

## Deployment (Vercel)
1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy
5. In Supabase: update Auth Settings → Site URL to your Vercel domain

## Resetting a Password
Admin panel → Team → (user row) → Actions → Reset Password
