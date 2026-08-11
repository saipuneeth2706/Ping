# Ping - Your Inbox, Reimagined as a Chat

[![Live Demo](https://img.shields.io/badge/Live_Demo-ping.saipuneeth.me-brightgreen?style=for-the-badge)](https://ping.saipuneeth.me)

Ping transforms your cluttered email inbox into a fast, intuitive, WhatsApp-style messaging experience. Turn cluttered email threads into clean, continuous chat bubbles.

> **Try the live demo:** [ping.saipuneeth.me](https://ping.saipuneeth.me)

## Current Project Status

The project is currently in **Beta**. The core landing page and functional inbox interface are fully implemented and integrated with Gmail via Google OAuth.

### Tech Stack
- **Framework:** [Next.js 15+](https://nextjs.org) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org) with Google OAuth
- **AI Integration:** Custom AI summarization engine
- **State Management:** React Hooks & SyncExternalStore

## Key Features

### Conversational View
- **Chat-like Interface:** Emails are grouped by sender into beautiful chat bubbles, stripping away messy signatures and headers.
- **Threaded Conversations:** View the entire history of a conversation in a single, continuous flow.

### AI-Powered Intelligence
- **Instant Summarization:** Get the gist of long email threads with one click using our AI summarization tool.
- **Smart Snippets:** Quick previews that highlight the most important parts of an email.

### Seamless Gmail Integration
- **Real-time Sync:** Connect your existing Gmail account. Everything stays in sync across all your devices.
- **Full Mail Support:** Support for Starred, Archived, Sent, and Drafts labels.

### Rich Compose & Reply
- **Familiar Shortcuts:** Swipe-to-archive and instant replies.
- **Advanced Composition:** Support for CC, BCC, and file attachments (up to 25MB).
- **Threaded Replies:** Automatically maintain email thread context when replying.

### Modern UI/UX
- **Dark/Light Mode:** Full support for dark and light themes with system preference detection.
- **Responsive Design:** Optimized for mobile, tablet, and desktop viewing.
- **Smooth Animations:** High-performance scroll-triggered animations and transitions.

### Smart Search
- **Contact Filtering:** Quickly find conversations by searching for contact names.
- **Natural Language:** (In Progress) Advanced search queries for finding specific content.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
