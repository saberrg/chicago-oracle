# Chicago Oracle

Chicago Oracle is a Next.js application for browsing and managing geotagged photographs.

## Getting Started

Install dependencies and run the development server.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The application requires the Firebase environment variables referenced by `src/lib/firebase.ts`.

## Validation

Run the project checks before deployment.

```bash
npm run type-check
npm run lint
npm run build
```

## Cloudflare Pages

Connect Cloudflare Pages to this repository with `master` as the production branch.

Use the following build settings.

```text
Build command       npm run build
Build output        out
Node version        24.19.0
```

Configure the Firebase environment variables for both production and preview builds before deployment.
