# Academic Journal Index (AJI)

Academic Journal Index (AJI) is a comprehensive platform designed to help researchers and academics discover, evaluate, and manage academic journals. It provides detailed metrics including Impact Factor, CAS Partitions, and Authority Levels, enhanced by AI-driven analysis.

**Live Site / 在线访问:** [https://academic-journal-index.vercel.app/](https://academic-journal-index.vercel.app/)

## About / 关于

The current dataset pairs **JCR Impact Factor (2024 edition)** with the **CAS Journal Partition Table (2025 edition)**:

| Data source | Edition | Release date |
|-------------|---------|--------------|
| JCR Impact Factor | 2024 edition (`JCR2024`) | **June 20, 2024** (Clarivate) |
| CAS Partition Table (升级版) | 2025 edition (`FQBJCR2025`) | **March 20, 2025** (中国科学院文献情报中心) |

Raw data is sourced from [ShowJCR](https://github.com/hitfyd/ShowJCR), merged offline by ISSN/eISSN, and loaded at build time from `src/data/journals.json.gz`.

当前数据集采用 **JCR 影响因子 2024 年版** 与 **中科院期刊分区表 2025 年版**：

| 数据源 | 版本 | 发布时间 |
|--------|------|----------|
| JCR 影响因子 | 2024 年版（`JCR2024`） | **2024 年 6 月 20 日**（Clarivate 科睿唯安） |
| 中科院分区表（升级版） | 2025 年版（`FQBJCR2025`） | **2025 年 3 月 20 日**（中国科学院文献情报中心） |

原始数据来自 [ShowJCR](https://github.com/hitfyd/ShowJCR)，离线按 ISSN/eISSN 合并后，由 `src/data/journals.json.gz` 在构建时加载。

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

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Components:** Shadcn UI & Tailwind CSS
- **Backend/Auth:** Firebase (Firestore & Authentication)
- **AI Integration:** DeepSeek V4 Flash (OpenAI-compatible API)
- **Language:** TypeScript

## 📊 Journal Data Pipeline

Journal data is built offline from [ShowJCR](https://github.com/hitfyd/ShowJCR) raw CSV files and stored as `src/data/journals.json.gz` for the website to load at build time.

### Update data (when ShowJCR releases new tables)

```bash
npm run build:journals -- --download
```

This will:

1. Download `FQBJCR2025-UTF8.csv` (CAS partition 2025) and `JCR2024-UTF8.csv` (JCR 2024 impact factor) into `data/raw/`
2. Merge impact factors by ISSN/eISSN
3. Compute authority journal levels (Level 1/2/3)
4. Write `src/data/journals.json.gz` (committed) and `src/data/journals.json` (local only, gitignored)

Raw CSV files stay in `data/raw/` and are not committed. After regenerating, commit the updated `journals.json.gz` and redeploy.

## 📝 License

© 2025 Jing Wang. All Rights Reserved. All journal data is based on publicly available information and is intended for reference purposes.
