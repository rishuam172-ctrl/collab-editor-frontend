# Collaborative Document Editor - Frontend

A modern **Next.js 16** application for a **Local-First Collaborative Document Editor** with offline synchronization, real-time collaboration, version history, role-based permissions, and AI-powered writing assistance.

---

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- TipTap Editor
- Socket.io Client
- Zustand
- IndexedDB (Offline Storage)
- React Query
- JWT Authentication

---

## Features

### Authentication

- Login / Register
- JWT Authentication
- Protected Routes

### Document Editor

- Rich Text Editing
- Auto Save
- Local First Editing
- Offline Support
- Real-time Collaboration
- Presence Indicators
- Cursor Synchronization

### Collaboration

- Owner
- Editor
- Viewer

Viewers have read-only access.

### Version History

- Snapshot Timeline
- Restore Previous Version
- Time Travel

### AI Assistant

Powered by Grok AI.

Available Actions

- Rewrite
- Summarize
- Grammar Fix
- Continue Writing
- Explain
- Translate
- Generate Table
- Generate Bullet Points

### Sync Engine

- Offline Queue
- Automatic Background Sync
- Conflict Resolution
- Version Tracking

---

## Folder Structure

```
src/
│
├── app/
├── components/
├── hooks/
├── services/
├── store/
├── lib/
├── utils/
├── types/
└── styles/
```

---

## Environment Variables

Create

```
.env.local
```

Example

```env
NEXT_PUBLIC_API_URL=http://localhost:3002

NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
```

---

## Installation

Clone repository

```bash
git clone https://github.com/rishuam172-ctrl/collab-editor-frontend

cd frontend
```

Install packages

```bash
npm install
```

Run development server

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

## Build

```bash
npm run build
```

Run production

```bash
npm start
```

---

## Available Scripts

```bash
npm run dev

npm run build

npm run start

npm run lint
```

---

## Performance Optimizations

- Lazy Loading
- Dynamic Imports
- Code Splitting
- Optimistic UI Updates
- Debounced Sync Requests
- IndexedDB Caching

---

## Accessibility

- Keyboard Navigation
- Responsive Design
- Accessible Forms
- Semantic HTML

---

## Deployment

Recommended

- Vercel

---

## Author

Rishu kumar

GitHub:https://github.com/rishuam172-ctrl/collab-editor-frontend
