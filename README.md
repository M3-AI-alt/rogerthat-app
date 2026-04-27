This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Local Setup

This project is prepared for Supabase authentication, but real login is not built yet.

To set up your local Supabase environment:

1. Open your Supabase project dashboard.
2. Go to **Project Settings**.
3. Go to **API**.
4. Copy the **Project URL**. This is your `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the **anon public** API key. This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Create a file named `.env.local` in the project root.
7. Copy the values from `.env.local.example` into `.env.local`.
8. Paste your real Supabase values into `.env.local`.

Example:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Do not commit `.env.local` to GitHub. It contains real project keys. The committed `.env.local.example` file is only a safe template.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
