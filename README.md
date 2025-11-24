# Mental Health Platform - Tâm Lý Học Đường

A secure, anonymous mental health counseling platform for students and counselors built with React, Supabase, and Tailwind CSS.

## Features

- 🔐 Secure authentication with email/password
- 💬 Real-time chat between students and counselors
- 👥 Anonymous community posts
- 🖼️ Image upload for posts
- 🎨 Beautiful, colorful UI with Tailwind CSS
- 📱 Fully responsive design
- 🔒 Row-Level Security (RLS) for data privacy

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Real-time + Auth + Storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel / Cloudflare Pages

## Quick Start

### 1. Clone & Install

\`\`\`bash
git clone https://github.com/yourusername/mental-health-platform.git
cd mental-health-platform
npm install
\`\`\`

### 2. Set up Supabase

1. Create account at https://supabase.com
2. Create new project
3. Run the SQL from `DEPLOYMENT.md` to create tables
4. Enable Authentication > Email Provider
5. Create Storage buckets: avatars, post-images

### 3. Configure Environment

\`\`\`bash
cp .env.example .env
\`\`\`

Add your Supabase credentials to `.env`:

\`\`\`
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000

### 5. Build for Production

\`\`\`bash
npm run build
\`\`\`

## Deployment

See `DEPLOYMENT.md` for complete deployment instructions to Vercel or Cloudflare Pages.

## Project Structure

\`\`\`
src/
├── components/     # Reusable React components
├── hooks/          # Custom React hooks (auth, chat, posts)
├── lib/            # Supabase client configuration
├── pages/          # Page components (Login, Home, Chat, etc.)
└── styles/         # Global CSS and Tailwind
\`\`\`

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
\`\`\`

### `DEPLOYMENT.md`
```markdown
# Deployment Guide

## Database Setup (Supabase)

Run this SQL in Supabase SQL Editor:

\`\`\`sql
-- Users table
create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('student', 'counselor', 'admin')),
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Chat rooms
create table chat_rooms (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references users(id),
  counselor_id uuid references users(id),
  created_at timestamp with time zone default now()
);

-- Messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references chat_rooms(id) on delete cascade,
  sender_id uuid references users(id),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Posts
create table posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references users(id),
  title text,
  content text not null,
  image_url text,
  created_at timestamp with time zone default now()
);

-- Enable real-time
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table posts;

-- Row Level Security
alter table users enable row level security;
alter table chat_rooms enable row level security;
alter table messages enable row level security;
alter table posts enable row level security;

-- Policies
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

create policy "Anyone can view posts" on posts
  for select using (true);

create policy "Authenticated users can create posts" on posts
  for insert with check (auth.uid() = author_id);

-- Function to create user profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
\`\`\`

## Deploy to Vercel

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click Deploy

## Deploy to Cloudflare Pages

1. Push code to GitHub
2. Go to https://dash.cloudflare.com
3. Pages > Create a project > Connect to Git
4. Select repository
5. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Add environment variables
7. Save and Deploy

## Post-Deployment

1. Add your deployment URL to Supabase:
   - Authentication > URL Configuration
   - Add to "Site URL" and "Redirect URLs"

2. Test features:
   - Registration
   - Login
   - Chat real-time updates
   - Post creation
   - Image upload

## Troubleshooting

- **Real-time not working**: Check Supabase replication settings
- **Auth errors**: Verify environment variables
- **Build fails**: Check Node version (use 18.x or higher)

Done! Your app is now live! 🚀
