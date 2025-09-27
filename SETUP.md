# Supabase Next.js App Setup Guide

This project is based on the [Vercel Supabase template](https://vercel.com/templates/authentication/supabase) and configured according to your Cursor rules with PNPM as the package manager.

## 🚀 Quick Start

### 1. Create a Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be set up (usually takes 2-3 minutes)

### 2. Get Your Project Credentials
1. Go to your project's API settings: [Project Settings > API](https://supabase.com/dashboard/project/_?showConnect=true)
2. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **anon/public API key** (starts with `eyJ...`)

### 3. Configure Environment Variables
1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key-here
   ```

### 4. Install Dependencies & Run
```bash
# Install dependencies (using PNPM as per project rules)
pnpm install

# Start the development server
pnpm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📁 Project Structure

```
supabase-nextjs-app/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   │   ├── login/               # Login page
│   │   ├── sign-up/             # Sign up page
│   │   ├── forgot-password/     # Password reset
│   │   └── ...
│   ├── protected/               # Protected routes example
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── auth-button.tsx          # Authentication button
│   ├── login-form.tsx           # Login form
│   └── ...
├── lib/
│   ├── supabase/                # Supabase configuration
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Middleware client
│   └── utils.ts                 # Utility functions
└── .cursor/                     # Cursor AI rules
    └── rules.md                 # Project-specific AI guidelines
```

## 🔐 Authentication Features

This template includes:

- ✅ **Sign up** with email/password
- ✅ **Login** with email/password  
- ✅ **Password reset** functionality
- ✅ **Protected routes** example
- ✅ **Session management** with cookies
- ✅ **Server-side auth** support
- ✅ **Middleware** protection

## 🎨 Styling & Components

- **Tailwind CSS** for styling
- **shadcn/ui** components
- **next-themes** for dark/light mode
- **Lucide React** for icons
- **Responsive design** with mobile-first approach

## 📚 Key Technologies

- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Supabase** for authentication & database
- **PNPM** for package management
- **Tailwind CSS** for styling

## 🔧 Available Scripts

```bash
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run start    # Start production server
pnpm run lint     # Run ESLint
```

## 📖 Next Steps

1. **Set up your database schema** in Supabase
2. **Configure Row Level Security (RLS)** policies
3. **Add your own pages and components**
4. **Deploy to Vercel** with automatic Supabase integration

## 🚀 Deploy to Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new) with the [Supabase integration](https://vercel.com/integrations/supabase).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

## 🎯 Project follows these principles:

- Uses **PNPM** exclusively for package management
- Follows **TypeScript best practices**
- Implements **modern Next.js patterns**
- Uses **Server Components** by default
- Optimized for **performance and SEO**
- **Mobile-first responsive design**
