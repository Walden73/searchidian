# Searchidian

Menubar search across **all** your Obsidian vaults on macOS.

![Searchidian screenshot](assets/Searchidian%20Screenshot.png)

## Features

- Lives in the menubar (Obsidian logo, no Dock entry).
- Searches every vault registered in Obsidian's config.
- Ranks results: title matches first, then by number of occurrences in body.
- Hover a result → live full-file preview on the left (click to pin it).
- Click a result → loads preview; right-click for context menu (preview / open).
- **Preview lock** — pin the preview on a file so hover no longer updates it.
- **Open file button** — open the previewed file in your default Markdown app directly from the preview pane.
- **Resizable split** — drag the divider between results and preview; width is remembered.
- **Fixed preview header** — note title stays pinned at the top while you scroll.
- **Match stepper** — jump between highlighted matches with ▲ / ▼ (or Shift+↑ / Shift+↓).
- **Eye toggle** — hide or show match highlights while keeping navigation working.
- **Font-size slider** (80%–200%) for the preview, persisted across launches.
- **Compact mode** toggle (titles only) for dense result lists.
- **Settings panel (⚙)**:
  - Enable/disable individual vaults from the search scope.
  - **Markdown apps** — auto-detects installed editors (Obsidian, Typora, iA Writer, VS Code, and 27 more). Pick your default, add custom apps, or remove any entry. Your choice is persisted.
  - **Launch at startup** toggle.
  - **FR / EN language toggle** — auto-detected from system language, switchable at any time.
  - **View logs** — opens the log file so you can diagnose issues yourself.
  - **Report a bug** — opens a pre-filled GitHub issue (version + OS included).
  - **Auto-update** — silent download in background; you choose when to install with full release notes shown.
- Quoted queries (`"foo"`) match whole words; unquoted multi-word queries are AND across words.
- Global shortcut: **⌘⇧Space** to open.
- Dark mode aware.

## Download (macOS)

Grab the latest DMG from the [Releases page](https://github.com/Walden73/searchidian/releases/latest).

The DMG is a **universal build** (works on Apple Silicon and Intel Macs).

### First launch on macOS

Searchidian is **not signed with an Apple Developer certificate** (it's a free community app). On first launch, macOS will block it with:

> "Searchidian" cannot be opened because the developer cannot be verified.

To bypass this once:

1. **Right-click** (or Ctrl-click) on `Searchidian.app` in Applications → **Open** → confirm **Open** in the dialog.

Or via Terminal:

```bash
xattr -cr /Applications/Searchidian.app
```

After that, it launches normally like any other app.

## Build from source

```bash
git clone https://github.com/Walden73/searchidian.git
cd searchidian
npm install
npm start
```

Look at the top of your screen for the Obsidian logo in the menubar. Click it (or press ⌘⇧Space) to open the search.

To produce your own DMG:

```bash
npm run dist
```

Output lands in `dist/`.

## Platform support

| Platform | Status |
|---|---|
| macOS — Apple Silicon (M1/M2/M3/M4) | ✅ Tested |
| macOS — Intel | ⚠️ Universal DMG built — not tested by the author |
| Windows | ⚠️ Built via CI — not tested by the author |
| Linux | ⚠️ AppImage built via CI — not tested by the author |

Platform builds are automated via GitHub Actions on every `v*` tag. If you hit issues on Intel / Windows / Linux, please [open an issue](https://github.com/Walden73/searchidian/issues) — feedback very welcome.

## How it finds your vaults

Reads `~/Library/Application Support/obsidian/obsidian.json`, which Obsidian maintains automatically. Any vault you've opened at least once will be searched (unless you disable it in ⚙ Settings).

## How search works

Uses **ripgrep** (bundled via `@vscode/ripgrep`) to scan `.md` files across all enabled vault paths. Smart-case, JSON output, results aggregated per file:
- `titleMatch` (filename contains query) → ranks first.
- Body matches counted → ties broken by count desc, then alphabetical.
- Multi-word query: one ripgrep per word in parallel, intersection of files.
- Quoted query: word-boundary regex (`\b…\b`).

Settings persist to `~/Library/Application Support/Searchidian/settings.json` and UI state to `localStorage`.

## Logs

Logs are written to `~/Library/Logs/Searchidian/main.log`.  
You can open them directly from **Settings → View logs**, or paste relevant lines when [reporting a bug](https://github.com/Walden73/searchidian/issues).

## Roadmap

See [PRD.md](PRD.md) for the full roadmap. Highlights:

- **v0.3** — stabilisation, cross-platform validation, configurable global shortcut
- **v0.4** — rendered Markdown preview, search history, filters (vault / date / tag), grouped results
- **v1.0** — feature-complete, full changelog, multilingual README
- **Long-term** — local semantic search (RAG) with `transformers.js` + `/ask` LLM mode

## Support the project

Searchidian is free and open-source. If it's useful to you, you can [buy me a coffee on Ko-fi](https://ko-fi.com/franckwalden) ☕ — no obligation, much appreciated.
