# UUID / ULID Generator Pro

[![CI](https://github.com/kasapdev/uuid-generator-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/kasapdev/uuid-generator-pro/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) ![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-F7DF1E?logo=javascript&logoColor=black)

Generate UUID v4 and ULID identifiers, in bulk, with real cryptographic randomness — fast, private, and fully offline.

> A premium, zero-dependency ID workbench. Switch between RFC 4122 UUID v4 (native `crypto.randomUUID()`, or an included manual implementation) and a from-scratch, spec-correct ULID generator. Generate up to 1000 at once, reformat instantly, and export — all in your browser, with nothing ever leaving your machine.

## Overview

UUID / ULID Generator Pro is part of the **Web Utility Suite**. It runs entirely in the browser with no build step, no frameworks, and no network calls — open `index.html` from disk and it works. Pick an ID type, set a count, and generate. Every ID in the results list gets its own copy button, and the whole batch can be copied or downloaded as a `.txt` file in one click.

## Features

- **UUID v4** — uses the browser's native `crypto.randomUUID()` by default. Also ships a real, from-scratch **manual RFC 4122 v4 implementation** (`crypto.getRandomValues` + correct version/variant bit masking) that's used automatically when `crypto.randomUUID` isn't available, and can be forced on for educational inspection.
- **ULID** — a genuine, from-scratch pure-JS implementation of the [ULID spec](https://github.com/ulid/spec): a 48-bit millisecond timestamp encoded as the first 10 characters plus 80 bits of `crypto.getRandomValues` entropy encoded as the last 16 characters, both in Crockford's Base32 (excludes `I`, `L`, `O`, `U`) — 26 characters total, lexicographically sortable by creation time.
- **Bulk generation** — generate 1 to 1000 IDs in a single click; count is validated and clamped.
- **Live format toggles** (UUID only) — with/without hyphens, uppercase/lowercase, wrapped in `{braces}`. Toggling reformats the current batch instantly, no regeneration needed.
- **Per-ID copy buttons** plus **Copy all** and **Download as `.txt`** for the whole batch.
- **Cryptographically strong throughout** — every ID's randomness comes from `crypto.getRandomValues()` / `crypto.randomUUID()`; `Math.random()` is never used for ID generation.
- **Auto-persisted settings** — your last mode and toggle choices are saved to `localStorage` and restored on return.
- **Dark & light themes**, fully responsive down to 360px, accessible, and keyboard-driven.

## Installation

No dependencies, no build step.

```bash
git clone https://github.com/kasapdev/uuid-generator-pro.git
cd uuid-generator-pro
```

Then simply open `index.html` in any modern browser (double-click it, or `file://` it). That's it.

## Usage

1. Choose **UUID v4** or **ULID** from the segmented control.
2. Set **Count** (1–1000) and click **Generate** (or press <kbd>Ctrl/⌘</kbd>+<kbd>Enter</kbd>).
3. For UUID v4, optionally enable **Manual RFC4122 v4** to use the hand-rolled implementation instead of `crypto.randomUUID()`, and flip **Hyphens**, **Uppercase**, or **Braces** to reformat the batch live.
4. Copy an individual ID with its row button, or use **Copy all** / **Download .txt** for the whole batch.

## Keyboard Shortcuts

| Action               | Shortcut                       |
| -------------------- | ------------------------------ |
| Generate              | <kbd>Ctrl/⌘</kbd> + <kbd>Enter</kbd> |
| Download as `.txt`   | <kbd>Ctrl/⌘</kbd> + <kbd>S</kbd> |
| Show shortcuts help  | <kbd>?</kbd>                    |
| Close dialog         | <kbd>Esc</kbd>                  |

## Screenshots

> _Screenshots coming soon._

![screenshot](docs/screenshot-1.png)
![screenshot](docs/screenshot-2.png)

## Roadmap

- [ ] UUID v1 / v5 (namespace-based) generation
- [ ] NIL and Max UUID constants as quick-insert options
- [ ] Batch validation / parsing of pasted IDs (detect type, check structure)
- [ ] QR code export for a single generated ID

## License

MIT Licensed. Part of the [Web Utility Suite](../index.html).
