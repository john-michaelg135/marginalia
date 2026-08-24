# Marginalia

A personal reading tracker that logs pages, calculates pace, estimates finish dates, and includes a themed PDF reader. Built with React and Tailwind.

## Features

### Book Management
- Add books with title, author, genre, page count, and reading status
- Optional PDF attachment with automatic page count detection
- Three shelves: Nightstand (reading), Queue (up next), and Finished
- Visual spine-based bookshelf with genre-colored spines that scale realistically with page count
- Hover tooltips showing full book info (title, author, genre, pages, status)
- Drag-to-adjust progress bar for quick page updates
- Log reading sessions with +10/+25 bulk buttons or single-page ±1 controls
- Custom page input for exact logging

### Pace & Analytics
- Calculates pages-per-reading-day from your actual sessions
- Estimates finish date based on rolling pace
- 30-day activity chart with 7-day rolling average
- Reading streak tracking (current and longest)
- Genre distribution breakdown (pages and book count)

### PDF Reader
- Attach a PDF file to any book (reading or finished)
- Page count auto-detected from the uploaded PDF
- Full-screen themed reader matching the app's dark aesthetic
- "Reading zoom" preset button (205%) in book's genre color
- Page navigation with keyboard shortcuts (arrows, space, escape)
- Zoom controls and progress indicator
- Remembers last-read page per book
- Next page scrolls to top; previous page scrolls to bottom
- Reader page syncs with progress slider on close
- Progress slider syncs reader position when adjusted outside the reader
- PDFs stored in IndexedDB (no size limits from localStorage)

### Ledger
- Finished books table with ratings (1-5 stars), read duration, and pace
- Queue view with one-click "Start reading" action
- Book detail modal with session history visualization and 3D spine preview

### Empty States
- Animated ghost characters explore empty shelves with organic movement
- Cobweb decorations and floating dust particles
- Each shelf ghost has unique timing so they never sync

## Security

- **Input sanitization**: All user text inputs stripped of HTML tags, event handlers, and dangerous protocols
- **Data validation**: Every book loaded from localStorage is validated for shape, types, and value ranges
- **Content Security Policy**: Strict CSP meta tag restricts script sources, blocks inline scripts, and limits external connections
- **React XSS protection**: No `dangerouslySetInnerHTML` usage — all text rendered through React's auto-escaping JSX
- **Number clamping**: Page counts and progress values bounded to safe ranges

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

## Performance

- No `backdrop-blur` or `filter: blur()` — soft glows achieved with radial gradients
- No `background-attachment: fixed` — eliminates full-page repaint on scroll
- Ghost animations use `transform` only (GPU compositor thread)
- `contain` CSS property isolates layout recalculations
- `transition-all` replaced with specific property transitions on interactive elements
- `will-change` hints on animated elements, cleaned up after animation

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
├── main.tsx                # Entry point with error boundary
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
    ├── pdfWorker.ts        # pdfjs worker initialization
    └── sanitize.ts         # XSS prevention, input validation
```

## Design

Dark theme with a library/study aesthetic. Custom color palette: ink, pine, moss, brass, sage, ember, fog. Typography uses Fraunces (display), Archivo (body), and Spline Sans Mono (monospace). Animated grain texture and gradient glow orbs in the background. All data stays in the browser.
