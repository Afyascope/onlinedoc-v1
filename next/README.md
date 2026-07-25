# 🌟 AfyaScope Digital Platform (Frontend)

Welcome to the frontend repository for **AfyaScope** — a high-performance Next.js application that pairs with a Strapi v5 backend for content management. This folder contains the Next.js app and related frontend tooling.

---

## ✨ Features

- 🌐 **Bilingual Architecture:** Seamless switching between **English** and **Swahili** with dynamic slug handling.
- 🏥 **Medical-Grade UI:** High-contrast, trustworthy design system using AfyaScope Navy and Cyan.
- 🎨 **Advanced Animations:** GPU-accelerated effects (Meteors, Beams, Sticky Scroll) powered by Framer Motion.
- 🔐 **Draft Mode Preview:** Token-gated preview system to view unpublished content from Strapi.
- 🖼️ **Dynamic Content:** Pages are assembled from Strapi dynamic zones (hero, CTAs, features, etc.).
- 🔍 **SEO Engine:** Automated metadata, Open Graph images, and structured data helpers.

---

## 🚀 Getting Started (Frontend)

Use these steps to run just the frontend locally. For full end-to-end editing you should also run the Strapi backend.

### Prerequisites

- Node.js 18.17 or newer
- npm or yarn
- (Optional) Local Strapi v5 instance

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ericmusanyi/afyascope.git
cd afyascope-web
```

2. Install dependencies (from the repo root or inside `next/`):

```bash
npm install
# or
yarn install
```

3. Create environment variables

Create a `.env.local` file in `next/` (or at repo root) with at least:

```env
# API endpoint for Strapi (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:1337

# Strapi API token for private/draft endpoints
STRAPI_API_TOKEN=your_strapi_api_token

# Draft preview secret
DRAFT_SECRET=your_random_secret
```

4. Run the frontend dev server

```bash
cd next
npm run dev
# or
yarn dev
```

Open http://localhost:3000

---

## 🛠️ Customization

- Styling: modify `tailwind.config.ts` to tweak brand colors and typography.
- Content: edit Strapi content types and dynamic zones to change page content.
- Localization: see `i18n.config.ts` and the `[locale]/` routes.

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch (e.g., `feature/your-feature`)
3. Open a Pull Request

---

## 📄 License

This project is proprietary to AfyaScope.

---

## Contact

AfyaScope Digital Health — hello@afyascope.co.ke

Powered by Next.js • Strapi • Tailwind CSS
# 🌟 AfyaScope Digital Platform (Frontend)

Welcome to the frontend repository for **AfyaScope**—a cutting-edge digital health agency platform. This high-performance Next.js application bridges the gap between clinical needs and technical reality, serving as the face of our digital health services.

## ✨ Features

- 🌐 **Bilingual Architecture:** Seamless switching between **English** and **Swahili** with dynamic slug handling.
- 🏥 **Medical-Grade UI:** High-contrast, trustworthy design system using **AfyaScope Navy** and **Cyan** for clinical clarity.
- 🎨 **Advanced Animations:** GPU-accelerated effects (Meteors, Beams, Sticky Scroll) powered by **Framer Motion** and **Aceternity UI**.
- 🔐 **Draft Mode Preview:** Token-gated preview system allowing editors to view "Saved" content from Strapi before publishing.
- 🖼️ **Dynamic Content:** Fully integrated with Strapi v5 Headless CMS for managing pages, teams, and portfolio projects.
- 🔍 **SEO Engine:** Automated metadata generation, Open Graph images, and structured data for high visibility.

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+
- A running instance of the Strapi Backend

### Installation

1. **Clone this repository:**