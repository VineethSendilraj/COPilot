# Voice AI Assistant Frontend

A modern React frontend for voice AI assistants that provides a simple voice interface. It supports real-time voice conversations, transcriptions, and visual feedback.

This template is built with Next.js and React, providing a clean and modern interface for voice AI interactions.

<picture>
  <source srcset="./.github/assets/readme-hero-dark.webp" media="(prefers-color-scheme: dark)">
  <source srcset="./.github/assets/readme-hero-light.webp" media="(prefers-color-scheme: light)">
  <img src="./.github/assets/readme-hero-light.webp" alt="App screenshot">
</picture>

### Features:

- Real-time voice interaction with AI agents
- Camera video streaming support
- Screen sharing capabilities
- Audio visualization and level monitoring
- Virtual avatar integration
- Light/dark theme switching with system preference detection
- Customizable branding, colors, and UI text via configuration

This template is built with Next.js and is free for you to use or modify as you see fit.

### Project structure

```
agent-starter-react/
├── app/
│   ├── (app)/
│   ├── api/
│   ├── components/
│   ├── fonts/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── livekit/
│   ├── ui/
│   ├── app.tsx
│   ├── session-view.tsx
│   └── welcome.tsx
├── hooks/
├── lib/
├── public/
└── package.json
```

## Getting started

To run this application locally:

```bash
pnpm install
pnpm dev
```

And open http://localhost:3000 in your browser.

You'll also need a voice AI agent backend to connect to. This frontend is designed to work with real-time voice AI systems.

## Configuration

This starter is designed to be flexible so you can adapt it to your specific agent use case. You can easily configure it to work with different types of inputs and outputs:

#### Example: App configuration (`app-config.ts`)

```ts
export const APP_CONFIG_DEFAULTS = {
  companyName: 'Voice AI',
  pageTitle: 'Voice AI Assistant',
  pageDescription: 'An intelligent voice assistant powered by AI',
  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  logo: '/ai-logo.svg',
  accent: '#6366f1',
  logoDark: '/ai-logo-dark.svg',
  accentDark: '#8b5cf6',
  startButtonText: 'Start call',
};
```

You can update these values in [`app-config.ts`](./app-config.ts) to customize branding, features, and UI text for your deployment.

#### Environment Variables

You'll also need to configure your real-time communication credentials in `.env.local` (copy `.env.example` if you don't have one):

```env
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=your_server_url
```

These are required for the voice agent functionality to work with your real-time communication backend.

## Contributing

This template is open source and we welcome contributions! Please open a PR or issue through GitHub.
