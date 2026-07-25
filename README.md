# AfyaScope Digital Platform

![AfyaScope Banner](public/uploads/logo.png)

> **Bridging the Gap Between Medicine and Code.**
>
> The official digital agency platform for AfyaScope, built to demonstrate high-performance web development tailored for the African healthcare sector.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Strapi](https://img.shields.io/badge/Strapi-v5-purple)](https://strapi.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)](https://tailwindcss.com/)

## 🏥 About The Project

AfyaScope is a clinician-led digital health agency. This repository contains the source for a high-performance Next.js frontend designed to showcase digital health services, portfolio work, and clinical insights.

This project prioritizes Clinical UX, high-contrast accessibility, bilingual support (English/Swahili), and a Strapi-powered headless CMS for content management.

### Key Features
- Dynamic Internationalization (i18n) with English (`en`) and Swahili (`sw`).
- Headless CMS integration (Strapi v5) for pages, SEO, and site settings.
- Draft Mode preview (token-gated) so editors can preview unpublished content.
- Clinical design system with primary colors and accessible typography.
- Performance-first animations (Framer Motion) and GPU-accelerated effects.

---

## 🛠️ Tech Stack

### Frontend
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + CSS Modules
- Animations: Framer Motion

### Backend (CMS)
- CMS: Strapi v5 (headless)
- Database: PostgreSQL (production) / SQLite (dev)

---

## 🚀 Getting Started

These steps help you run the frontend locally. The repository contains both the frontend (`next/`) and a Strapi backend (`strapi/`) in a monorepo layout.

### Prerequisites
- Node.js 18.17 or later
- npm or yarn
- (Optional) A running instance of Strapi if you want to fetch real CMS content

### 1) Clone the repository

```bash
git clone https://github.com/afyascope/afyascope-web.git
cd afyascope-web
```

### 2) Install dependencies

From the monorepo root (or inside `next/` if you only need the frontend):

```bash
# install with npm
npm install

# or with yarn
yarn install
```

### 3) Environment variables

Create a `.env.local` file in the project root (or `next/` if running the frontend only) with the following keys:

```bash
# Strapi API URL (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:1337

# Secure token for fetching Drafts (create via Strapi Admin -> Settings -> API Tokens)
STRAPI_API_TOKEN=your_full_access_token_here

# Secret used for Draft Mode URL generation
DRAFT_SECRET=your_random_secret_string
```

> Note: If you don't have a Strapi instance, the frontend contains mock/fallback data for local development.

### 4) Run the development server

From the project root (or `next/`):

```bash
cd next
npm run dev
# or
yarn dev
```

Open http://localhost:3000 in your browser to view the site.

---

## 📂 Project Structure

```
├── app/                    # Next.js App Router pages & layouts
├── components/             # React components (shared, dynamic zones, UI)
├── lib/                    # Helpers, Strapi fetch utilities
├── next/                   # Next.js frontend (app code) — run from here
├── strapi/                 # Strapi backend (admin, API) — optional
└── public/                 # Static assets
```

## 🧠 Content modeling (Strapi)

The frontend expects the following single and collection types in Strapi:

- Global (single type): navbar, footer, favicon, default SEO
- Pages (collection): title, slug, content (dynamic zone), seo (component). Localization enabled.
- Projects, Team, etc. (collection types used for portfolio and team sections)

## 🎨 Theming & Design system

Primary brand tokens used in the Tailwind config:

- AfyaScope Navy (Base): `#001f3f` — main backgrounds, footer
- Cyan (Accent): `#00c2cb` — buttons, hovers, beam effects
- Clinical White: `#F0F3FA` — primary text and icons
- Slate: `#64748b` — subheadings, borders

---

## �� Contributing

Contributions are welcome. Suggested workflow:

```bash
git checkout -b feature/YourFeature
git commit -m "Add your feature"
git push origin feature/YourFeature
# Open a pull request on GitHub
```

Please follow the repo's code style and add tests where appropriate.

---

## 📞 Contact

Eric Musanyi — Lead Clinician & Developer

- Website: https://www.afyascope.co.ke
- Twitter: @afyascope
- Email: hello@afyascope.co.ke

If you'd like, I can also:

- Add a short troubleshooting/development section (how to run Strapi + seed data).
- Add badges that show build/test status for CI if you have a CI provider configured.
