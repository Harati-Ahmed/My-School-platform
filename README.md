# 🏫 Tilmeedhy - School Management Platform

A modern, bilingual (Arabic & English) school management platform designed for schools in Libya and similar regions. Built with Next.js 16, Supabase, and TypeScript.

## 🌟 Features

- **Multi-role Support**: Admin, Teacher, and Parent dashboards
- **Bilingual**: Full Arabic (RTL) and English (LTR) support
- **Parent-Centric**: Parents can track their children's homework, grades, attendance, and teacher notes
- **Real-time Updates**: Live notifications and data synchronization
- **Mobile-First**: Responsive design optimized for mobile devices
- **Dark Mode**: Automatic and manual theme switching
- **PWA Ready**: Progressive Web App capabilities
- **Secure**: Row-level security policies and role-based access control

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.0.1 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment**: Vercel (Frontend), Supabase Cloud (Backend)
- **Internationalization**: next-intl
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## 📋 Prerequisites

- Node.js 20.9.0 or higher
- npm 10.0.0 or higher
- Git
- Supabase account

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/My-School-platform.git
cd My-School-platform
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Utilities and services
├── messages/        # i18n translations
├── public/          # Static assets
└── supabase/        # Database migrations
```

## 🗄️ Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations from `frontend/supabase/migrations/`
3. Configure Row Level Security (RLS) policies
4. Set up Storage buckets for file uploads

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Set the **Root Directory** to `frontend`
4. Add environment variables in Vercel dashboard
5. Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Project Details](./project.md)
- [Setup Instructions](./docs/SETUP.md)

## 🔐 Security

- Row Level Security (RLS) policies on all tables
- Role-based access control (RBAC)
- Secure authentication via Supabase Auth
- Environment variables for sensitive data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@tilmeedhy.ly or open an issue in this repository.

---

**Built with ❤️ for schools in Libya and beyond.**
