# 🌐 GriffTranslate

A beautiful **Neumorphic (Soft UI)** web translator powered by **DeepL API**. Translate text between 30+ languages instantly with a modern, responsive interface.

![GriffTranslate Preview](https://img.shields.io/badge/Design-Neumorphism-6C63FF?style=for-the-badge)
![Languages](https://img.shields.io/badge/Languages-30%2B-00B894?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## ✨ Features

- **Neumorphic Design** — Soft raised/inset shadows with a clean clay-surface aesthetic
- **Dark & Light Mode** — Toggle with persistence via `localStorage`
- **30+ Languages** — Loaded from DeepL API with local fallback
- **Auto-Translate** — Translates automatically 1 second after you stop typing
- **Searchable Dropdowns** — Filter languages by typing in the dropdown search
- **Auto Detect** — Source language auto-detection with display
- **Quick Language Chips** — One-click shortcuts for popular languages (JP, KR, ZH, FR, DE, ES, ID, AR)
- **Swap Languages** — Swap source ↔ target with text content
- **Copy to Clipboard** — One-click copy of translation result
- **Keyboard Shortcut** — `Ctrl + Enter` to translate
- **Responsive** — Mobile-first design adapting at 400px, 600px, and 900px breakpoints
- **Toast Notifications** — Success/error feedback
- **Character Counter** — Live count up to 5,000 characters

## 🚀 Live Demo

👉 [https://YosefTriadi17.github.io/grif_translate/](https://YosefTriadi17.github.io/griff_translate/)

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic structure |
| CSS3 | Neumorphism design system with CSS variables |
| Vanilla JavaScript | API calls, DOM manipulation, state management |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Typography |
| [DeepL API](https://www.deepl.com/docs-api) | Translation engine |
| [corsproxy.io](https://corsproxy.io/) | CORS proxy for browser-side API calls |

## 📁 Project Structure

```
grif_translate/
├── index.html          # Main HTML — header, language bar, translation panels, chips, info cards
├── styles.css          # Neumorphism design system (light/dark themes, responsive breakpoints)
├── app.js              # DeepL API integration, searchable dropdowns, auto-translate, theme toggle
├── languages.json      # Fallback language list (used when API is unreachable)
└── README.md           # Documentation
```

## 🎨 Design System

| Token | Value |
|-------|-------|
| **Font** | Plus Jakarta Sans |
| **Background** | `#E0E5EC` (light) / `#2D3436` (dark) |
| **Accent** | `#6C63FF` |
| **Border Radius** | 12–24px |
| **Shadows** | Dual-layer: light top-left + dark bottom-right |
| **Transitions** | 250ms cubic-bezier(0.4, 0, 0.2, 1) |

## 🏃 Run Locally

No build step required — just open the file or serve it:

```bash
# Option 1: Open directly
# Just double-click index.html in your file explorer

# Option 2: Local server (Python)
python -m http.server 8000
# Then open http://localhost:8000

# Option 3: Local server (Node)
npx serve .
```

## 🌍 Deploy to GitHub Pages

1. Push your code to a GitHub repository
2. Go to **Settings** → **Pages**
3. Set Source to **Deploy from a branch** → `main` / `/ (root)`
4. Click **Save** — your site will be live in ~1 minute

## 📡 API Configuration

The app uses the [DeepL Free API](https://www.deepl.com/docs-api). To use your own API key:

1. Sign up at [DeepL API Free](https://www.deepl.com/pro#developer)
2. Get your API key from the account dashboard
3. Update `API_KEY` in `app.js` (line 10):

```javascript
const API_KEY = 'your-api-key-here';
```

> **Note:** The API key is exposed client-side. For production, consider a serverless proxy (Cloudflare Workers, Vercel Edge Functions) to keep the key secure.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Translate immediately |
| `Escape` | Close language dropdown |

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `> 900px` | Side-by-side translation panels |
| `600–900px` | Stacked panels, 2-column info cards |
| `400–600px` | Full-width everything, horizontal chip scroll |
| `< 400px` | Single-column info cards |

## 📄 License

MIT License — feel free to use, modify, and distribute.
