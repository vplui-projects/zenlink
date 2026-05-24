# ZenLink

**AI-powered WhatsApp companion overlay for customer-facing massage therapy teams.**

ZenLink is a lightweight Tauri + React desktop app that lives in your system tray. Press `Alt+Q` to summon an overlay, capture any selected text, and get an AI-powered response in one of three modes:

| Mode | What it does |
|------|-------------|
| **Translate** | Bilingual translation (EN ↔ ZH) with professional formatting |
| **Explain** | One-sentence issue analysis + sentiment/intent bracket |
| **Reply** | Transforms bullet-point scratch notes into polished customer replies |

Built for low-spec Windows machines (ASUS VivoBook, 16GB RAM). Runs a local Ollama model (`qwen3:1.5b`) — no cloud AI, no internet required once installed.

---

## Prerequisites

- **Windows 10/11** (WebView2 runtime required — usually pre-installed on Win11)
- **Ollama** — [ollama.com](https://ollama.com) — pull the model before first use:
  ```bash
  ollama pull qwen3:1.5b
  ```
- **16GB RAM** minimum

---

## Development

```bash
# 1. Install dependencies
npm install

# 2. Start Ollama (separate terminal)
ollama serve

# 3. Run in dev mode
npm run tauri dev
```

`Alt+Q` toggles the overlay. Dev server runs with hot reload.

---

## Build (Local)

```bash
npm run tauri build
```

Output: `src-tauri/target/release/zenlink.exe`

---

## Build via GitHub Actions (Recommended for shared devices)

Push any change to `main` → GitHub Actions compiles the `.exe` automatically.

Download the artifact from the **Actions** tab → latest run → **Artifacts**.

---

## First-Time Setup on Vivobook

1. Download `zenlink.exe` from GitHub Actions
2. Install Ollama and run `ollama pull qwen3:1.5b`
3. Run `zenlink.exe`
4. Press `Alt+Q` to activate

---

## Architecture

```
┌─────────────────────────────────────┐
│           ZenLink App               │
│  ┌───────────────────────────────┐  │
│  │   Tauri Rust Backend          │  │
│  │  • Global shortcut (Alt+Q)    │  │
│  │  • Clipboard read/write       │  │
│  │  • Overlay window show/hide   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   React Overlay (WebView2)    │  │
│  │  • Capture selection via IPC  │  │
│  │  • Stream Ollama (/generate)  │  │
│  │  • Inject result → clipboard  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
          ↕ localhost:11434
┌─────────────────────┐
│   Ollama (qwen3)    │
│   Local inference   │
└─────────────────────┘
```

---

## Project Structure

```
zenlink/
├── src/                      # React frontend
│   ├── components/
│   │   └── CopilotOverlay.jsx
│   ├── App.jsx
│   └── main.jsx
├── src-tauri/                # Tauri + Rust backend
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .github/workflows/
│   └── build.yml             # GitHub Actions CI
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```