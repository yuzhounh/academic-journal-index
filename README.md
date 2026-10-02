<p align="center">
  <img src="public/favicon.svg" width="112" alt="Academic Journal Index logo">
</p>

<h1 align="center">Academic Journal Index</h1>

<p align="center"><strong>Discover, compare, and organize academic journals.</strong></p>

<p align="center">
  <a href="https://academic-journal-index.pages.dev/"><img src="https://img.shields.io/badge/Website-Cloudflare%20Pages-f38020?style=flat&amp;logo=cloudflare&amp;logoColor=white" alt="Website: Cloudflare Pages"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-f59e0b?style=flat" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Next.js-React-222222?style=flat&amp;logo=nextdotjs&amp;logoColor=white" alt="Next.js: React">
</p>

<p align="center">
  <a href="https://academic-journal-index.pages.dev/">Live site</a> · <a href="https://github.com/yuzhounh/academic-journal-index/releases/latest">Latest release</a> · <a href="#local-development">Get started</a> · <a href="LICENSE">License</a>
</p>

Academic Journal Index (AJI) is a comprehensive platform designed to help researchers and academics discover, evaluate, and manage academic journals. It provides detailed metrics including Impact Factor, CAS Partitions, and Authority Levels, enhanced by AI-driven analysis.

## About

The current dataset pairs **IF(2024)** from ShowJCR's `JCR2024-UTF8.csv` with the **CAS Journal Partition Table 2025**. The filename records the impact-factor data year; it is distinct from the Clarivate JCR release-year label used by [AJI Editions](https://github.com/yuzhounh/aji-editions).

| Data source | Tracked file | Meaning |
|-------------|--------------|---------|
| JCR impact factor | `JCR2024-UTF8.csv` | IF(2024), released with Clarivate JCR 2025 |
| CAS partition table | `FQBJCR2025-UTF8.csv` | CAS 2025 enhanced edition, released March 20, 2025 |

Raw data is sourced from [ShowJCR](https://github.com/hitfyd/ShowJCR), merged offline by ISSN/eISSN, and loaded at build time from `src/data/journals.json.gz`.

## 📊 Journal Data Pipeline

Journal data is built offline from [ShowJCR](https://github.com/hitfyd/ShowJCR) raw CSV files and stored as `src/data/journals.json.gz` for the website to load at build time.

### Update data (when ShowJCR releases new tables)

```bash
npm run build:journals -- --download
```

This will:

1. Download `FQBJCR2025-UTF8.csv` (CAS partition 2025) and `JCR2024-UTF8.csv` (IF(2024) data) into `data/raw/`
2. Merge impact factors by ISSN/eISSN
3. Compute authority journal levels (Level 1/2/3)
4. Write `src/data/journals.json.gz` (committed) and `src/data/journals.json` (local only, gitignored)

Raw CSV files stay in `data/raw/` and are not committed. After regenerating, commit the updated `journals.json.gz` and redeploy.

## 🚀 Key Features

### 1. Advanced Search & Browse
- **Smart Search:** Quickly find journals by title (requires minimum 3 characters). Results are intelligently sorted by impact factor.
- **Categorized Browsing:** Explore journals across 20+ major CAS (Chinese Academy of Sciences) categories, sorted by their partition rankings.

### 2. Rich Journal Metrics
- **Impact Factor:** Stay updated with the latest performance metrics.
- **CAS Partition Display:** Clear visualization of Q1-Q4 rankings.
- **Authority Levels:** View authoritative status (Level 1, 2, or 3) based on rigorous academic criteria.
- **Open Access Info:** Identify OA journals and quickly access Article Processing Charge (APC) information via integrated Google Search.

### 3. AI-Powered Analysis
- **Intelligent Summaries:** Generate detailed reports covering journal introduction, main publication areas, and its status in the field.
- **Smart Recommendations:** Get AI-suggested related journals based on field and influence.
- **AI-Powered:** Powered by DeepSeek V4 Flash for fast and accurate insights.

### 4. Personalized Management (Favorites)
- **Custom Lists:** Create multiple lists to organize your research interests.
- **Batch Operations:** Favorite or move journals across lists in bulk.
- **CSV Import/Export:** Import existing lists from CSV or export your favorites for offline use.
- **Global Statistics:** Visual breakdown of your favorite journals by partition and authority level.

### 5. Seamless User Experience
- **Multilingual:** Full support for both **English** and **Chinese** (Simplified).
- **Responsive Design:** Optimized for desktop, tablet, and mobile devices.
- **Dark Mode:** Built-in theme support for comfortable viewing in any environment.
- **Secure Auth:** Easy sign-in with Google or Email.

## Local Development

```bash
git clone https://github.com/yuzhounh/academic-journal-index.git
cd academic-journal-index
npm ci
npm run dev
```

The development server uses the repository's existing Firebase and AI configuration. Do not commit secrets; use local environment variables and Firebase project settings.

### Build and validation

```bash
npm run check  # TypeScript, ESLint, and shared-rule tests
npm run build
npm start
```

Production builds enforce TypeScript and ESLint checks. GitHub Actions runs the same checks and build on pushes and pull requests using Node.js 22.

ISSN parsing and the legacy favorites-ID rule come from the versioned local `@aji/core` package in `vendor/aji-core/`, shared with AJI Editions. Standalone clones do not require another checkout. See [the core maintenance instructions](vendor/aji-core/README.md) when updating those rules. Existing favorites IDs retain their original first-ISSN-part format.

### Production deployment

Vercel builds the complete Next.js application from `main`. Netlify uses `netlify.toml` and its automatically managed Next.js adapter; deploy with `netlify deploy --prod --context production --site academic-journal-index`.

Cloudflare Pages retains its existing domain as a gateway to the Vercel runtime, including Server Actions. Run `npm run pack:pages`, then `wrangler pages deploy .pages --project-name academic-journal-index --branch main`. The gateway forwards cache headers and does not contain secrets. Deploy Vercel first.

Firebase Hosting is an entry-point redirect to Vercel because its existing project has no billing enabled. Run `firebase deploy --only hosting --project academic-journal-index`; this command does not deploy Firestore rules or functions.

## Related Projects

- [aji-editions](https://github.com/yuzhounh/aji-editions): multi-year AJI comparison interface.
- [Authoritative-Journal-Classification](https://github.com/yuzhounh/Authoritative-Journal-Classification): standalone implementation of the authority-level rules used by the data pipeline.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Components:** Shadcn UI & Tailwind CSS
- **Backend/Auth:** Firebase (Firestore & Authentication)
- **AI Integration:** DeepSeek V4 Flash (OpenAI-compatible API)
- **Language:** TypeScript

## Hosting

Vercel and Netlify run the complete Next.js application, including server summaries. Vercel uses `npm run build`; Netlify uses the same command with its Next.js adapter and `.next/` output.

```bash
npm run build:landing
```

This prepares `dist_pages/` as the GitHub Pages entry, redirecting to `https://academic-journal-index.vercel.app` while preserving paths, query parameters, and fragments. The Pages workflow publishes this generated package. Cloudflare uses the gateway described above; Firebase uses HTTP redirects. These entry points depend on Vercel's complete runtime.

## License

This project is released under the [MIT License](LICENSE). Journal data is based on publicly available information and is intended for reference purposes.
