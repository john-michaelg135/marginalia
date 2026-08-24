# Marginalia

A personal reading tracker that logs pages, calculates pace, estimates finish dates, and includes a themed PDF reader. Built with React and Tailwind.

## Features

### Book Management
- Add books with title, author, genre, page count, and reading status
- Three shelves: Nightstand (reading), Queue (up next), and Finished
- Visual spine-based bookshelf with genre-colored spines
- Drag-to-adjust progress bar for quick page updates
- Log reading sessions with custom page counts

### Pace & Analytics
- Calculates pages-per-reading-day from your actual sessions
- Estimates finish date based on rolling pace
- 30-day activity chart with 7-day rolling average
- Reading streak tracking (current and longest)
- Genre distribution breakdown (pages and book count)

### PDF Reader
- Attach a PDF file to any book
- Page count auto-detected from the uploaded PDF
- Full-screen themed reader matching the app's dark aesthetic
- Page navigation with keyboard shortcuts (arrows, space, escape)
- Zoom controls and progress indicator
- Remembers last-read page per book
- PDFs stored in IndexedDB (no size limits from localStorage)

### Ledger
- Finished books table with ratings (1-5 stars), read duration, and pace
- Queue view with one-click "Start reading" action
- Book detail modal with session history visualization

## Tech Stack

- **React 18** with TypeScript
- **Vite** for dev server and builds
- **Tailwind CSS v4** with custom theme tokens
- **react-pdf** (pdfjs-dist) for PDF rendering
- **IndexedDB** for PDF file storage
- **localStorage** for book data persistence
- **Framer Motion** for animations
- **Recharts** for data visualization
- **dnd-kit** for drag interactions

## Getting Started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | TypeScript type checking |

## Project Structure

```
src/
├── App.tsx                 # Main app component, state, handlers
├── main.tsx                # Entry point
├── index.css               # Tailwind config, custom theme, animations
├── components/
│   ├── SpineShelf.tsx      # Visual bookshelf with spine buttons
│   ├── Nightstand.tsx      # Reading-in-progress cards
│   ├── PacePanel.tsx       # Pace stats and activity chart
│   ├── Taste.tsx           # Genre distribution donut + breakdown
│   ├── Ledger.tsx          # Finished/queue table
│   ├── Modals.tsx          # Book detail + add book modals
│   ├── PdfReader.tsx       # Full-screen PDF reader
│   ├── ProgressBar.tsx     # Draggable progress slider
│   ├── icons.tsx           # SVG icon components
│   └── ui.tsx              # Shared primitives (Reveal, Toast, Modal)
└── lib/
    ├── data.ts             # Book type, persistence, analytics math
    ├── hooks.ts            # useReveal, useCountUp, useEscape
    ├── pdfStore.ts         # IndexedDB wrapper for PDF files
    └── pdfWorker.ts        # pdfjs worker initialization
```

## Design

Dark theme with a library/study aesthetic. Custom color palette: ink, pine, moss, brass, sage, ember, fog. Typography uses Fraunces (display), Archivo (body), and Spline Sans Mono (monospace). Animated grain texture and glow orbs in the background. All data stays in the browser.
