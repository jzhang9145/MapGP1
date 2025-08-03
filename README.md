<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication
- Real Estate Area Management
  - Interactive maps using [Leaflet](https://leafletjs.com/) and [React Leaflet](https://react-leaflet.js.org/)
  - Area-specific data storage with geolocation coordinates
  - Editable area information with name, summary, and map positioning
  - Default New York City area for new chats

## Model Providers

This template ships with [xAI](https://x.ai) `grok-2-1212` as the default chat model. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to use the environment variables [defined in `env.example`](env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env.local` file is all that is necessary.

> Note: You should not commit your `.env.local` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

### Option 1: Using Docker (Recommended for local development)

1. Copy the environment file:
   ```bash
   cp env.example .env.local
   ```

2. Start the Docker services (PostgreSQL and Redis):
   ```bash
   pnpm docker:up
   ```

3. Install dependencies and start development:
   ```bash
   pnpm install
   pnpm dev:setup  # This will start Docker, run migrations, and initialize areas
   ```

4. Your app template should now be running on [localhost:3000](http://localhost:3000).

### Option 2: Using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

### Docker Commands

- `pnpm docker:up` - Start PostgreSQL and Redis containers
- `pnpm docker:down` - Stop containers
- `pnpm docker:logs` - View container logs
- `pnpm docker:reset` - Reset containers and volumes (removes all data)
- `pnpm dev:setup` - Complete setup (Docker + migrations + area initialization)

## Real Estate Area Setup

This application includes real estate area management functionality. Each chat is associated with a specific geographic area that includes:

- **Interactive Map**: 2/3 of the chat screen displays an interactive map using Leaflet
- **Area Information**: 1/3 of the screen shows the chat interface with area details
- **Editable Area Data**: Users can edit area name, summary, coordinates, and zoom level
- **Default Area**: New chats are initialized with New York City as the default area

### Database Setup

1. Run the database migration to create the area table:
   ```bash
   pnpm db:migrate
   ```

2. Initialize existing chats with default area data:
   ```bash
   pnpm db:init-areas
   ```

### Area Management

- **View Area**: The map automatically displays the area associated with each chat
- **Edit Area**: Click the "Edit" button in the area info panel to modify area details
- **Update Coordinates**: Change latitude, longitude, and zoom level to focus on different areas
- **Area Summary**: Provide detailed descriptions of the real estate area for context
