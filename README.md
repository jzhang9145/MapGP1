<a href="https://chat.vercel.ai/">
  <img alt="NYC Real Estate AI Chatbot with Interactive Maps" src="app/(chat)/opengraph-image.png">
  <h1 align="center">MapGPT - NYC Real Estate AI Chatbot</h1>
</a>

<p align="center">
    An AI-powered chatbot specialized for New York City real estate analysis, combining conversational AI with comprehensive NYC data sources and interactive mapping.
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

### 🏙️ NYC Real Estate Intelligence
- **Live Property Data**: Direct integration with NYC MapPLUTO via ArcGIS for up-to-date property information
- **Comprehensive Spatial Analysis**: Advanced GIS queries for properties, neighborhoods, parks, and school zones
- **Multi-Layer Mapping**: Interactive visualization of neighborhoods, properties, schools, parks, and census data
- **Context-Aware Queries**: Natural language processing for complex real estate questions

### 🗺️ Interactive Mapping Platform
- **Split-Screen Interface**: 2/3 interactive map + 1/3 chat interface for optimal user experience
- **Real-Time Data Visualization**: Dynamic rendering of query results on Leaflet maps
- **Multi-Source GeoJSON**: Seamless handling of large datasets with reference-based architecture
- **Rich Popups**: Detailed property information, neighborhood stats, and zoning data

### 🛠️ NYC Data Integration Tools
- **NYC Neighborhoods**: Complete neighborhood boundaries with NTA codes and community districts
- **MapPLUTO Properties**: Building-level data including ownership, zoning, assessments, and land use
- **School Zones**: Elementary school district boundaries with enrollment information
- **Parks & Recreation**: NYC parks system with acreage, facilities, and waterfront data
- **Census Demographics**: Population, income, and economic data at the block level
- **Zoning Districts**: Commercial, residential, and mixed-use zoning classifications

### 🚀 Technical Architecture
- **[Next.js 15](https://nextjs.org)** App Router with React Server Components
- **[AI SDK](https://sdk.vercel.ai/docs)** with tool calling and structured data generation
- **[PostgreSQL + PostGIS](https://postgis.net/)** for spatial data storage and queries
- **Context Management**: Intelligent message truncation to handle long conversations
- **GeoJSON Reference System**: Efficient handling of large spatial datasets
- **Error Recovery**: Automatic retry mechanisms for API limits and context errors

### 🎨 Modern UI/UX
- **[shadcn/ui](https://ui.shadcn.com)** components with [Tailwind CSS](https://tailwindcss.com)
- **Responsive Design**: Mobile-optimized interface for all screen sizes
- **Dark/Light Themes**: Automatic theme switching with system preference detection
- **Accessibility**: Full keyboard navigation and screen reader support

### 🔐 Authentication & Security
- **[Auth.js](https://authjs.dev)** with multiple provider support
- **Rate Limiting**: Per-user message limits and API protection
- **Data Privacy**: Secure handling of user data and conversation history

## Model Providers

This application uses [OpenAI](https://openai.com) `gpt-4o` as the default chat model, optimized for real estate and spatial analysis tasks. With the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [Anthropic](https://anthropic.com), [xAI](https://x.ai), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## 🎯 Use Cases & Sample Queries

### Property Analysis
- `"Find all properties in Park Slope"`
- `"Show me commercial buildings in DUMBO"`
- `"What are the zoning restrictions for 123 Main Street?"`
- `"Properties built after 2000 in Williamsburg"`

### Neighborhood Research
- `"Show me Chinatown boundaries"`
- `"What neighborhoods are in Brooklyn?"`
- `"Compare Upper East Side vs Upper West Side"`
- `"Demographic data for Carroll Gardens"`

### Educational Planning
- `"School zones in Manhattan"`
- `"Elementary schools near Central Park"`
- `"What school district is this address in?"`

### Recreation & Amenities
- `"Parks in Queens with playgrounds"`
- `"Waterfront parks in Brooklyn"`
- `"Show me all parks within 1 mile of this location"`

### Investment Analysis
- `"Highest assessed properties in SoHo"`
- `"Land use patterns in Long Island City"`
- `"Development opportunities in Astoria"`

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22openai%22%2C%22integrationSlug%22%3A%22openai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to use the environment variables [defined in `env.example`](env.example) to run MapGPT. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env.local` file is all that is necessary.

> **Important**: You should not commit your `.env.local` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

### Environment Variables Required

```bash
# AI Provider
OPENAI_API_KEY=your_openai_api_key_here

# Database (Postgres with PostGIS)
POSTGRES_URL=your_postgres_connection_string
POSTGRES_URL_NON_POOLING=your_direct_postgres_connection

# Authentication
AUTH_SECRET=your_random_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Other AI providers
ANTHROPIC_API_KEY=your_anthropic_key
```

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
   pnpm dev:setup  # This will start Docker, run migrations, and populate NYC data
   ```

4. Your MapGPT application should now be running on [localhost:3000](http://localhost:3000).

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
- `pnpm dev:setup` - Complete setup (Docker + migrations + NYC data population)

### NYC Data Population Commands

- `pnpm populate:all` - Populate all NYC datasets (neighborhoods, parks, schools, census, properties)
- `pnpm populate:neighborhoods` - NYC neighborhoods and boundaries
- `pnpm populate:parks` - NYC parks and recreation areas
- `pnpm populate:schools` - NYC school zones and districts
- `pnpm populate:census` - NYC census blocks and demographics
- `pnpm populate:properties` - NYC MapPLUTO property data (sample)
- `pnpm populate:properties:full` - Full NYC MapPLUTO dataset (large download)

## 🏗️ Architecture & Performance

### Context Management System
- **Intelligent Truncation**: Automatically manages conversation length to prevent API limits
- **Token Estimation**: Conservative token counting with overhead for tools and metadata
- **Emergency Fallback**: Automatic retry with minimal context when limits are exceeded
- **Seamless Recovery**: Users never see errors, conversations continue smoothly

### GeoJSON Reference System
- **Large Dataset Handling**: Stores GeoJSON data separately to avoid API size limits
- **On-Demand Fetching**: Frontend hooks fetch geometry data when needed for map rendering
- **Efficient Caching**: Reuses geometry data across multiple query results
- **Memory Optimization**: Keeps AI context lightweight while preserving full spatial functionality

### Database Architecture
- **PostGIS Integration**: Advanced spatial queries and geometric operations
- **Optimized Indexes**: Fast spatial lookups and property searches
- **Data Separation**: GeoJSON data stored separately from chat messages
- **Migration System**: Automated database updates and schema changes

## 🚀 Advanced Features

### Spatial Analysis Engine
- **Point-in-Polygon**: Find properties within neighborhood boundaries
- **Geometric Intersection**: Complex spatial relationships between datasets
- **Multi-Layer Queries**: Combine neighborhoods, properties, schools, and parks
- **Distance Analysis**: Proximity searches and radius-based filtering

### Real-Time Data Integration
- **Live NYC Data**: Direct API connections to official NYC data sources
- **Auto-Pagination**: Handles large datasets with automatic chunking
- **Error Recovery**: Robust handling of API timeouts and rate limits
- **Data Validation**: Ensures data quality and consistency

### Performance Optimizations
- **React Server Components**: Optimized rendering and reduced client-side JavaScript
- **Dynamic Imports**: Code splitting for faster initial page loads
- **SWR Caching**: Smart data caching with automatic revalidation
- **Image Optimization**: Compressed assets and responsive images

## 🛠️ Development & Deployment

### Database Setup

1. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

2. Populate NYC datasets:
   ```bash
   pnpm populate:all
   ```

### Production Deployment

1. **Vercel**: One-click deployment with automatic CI/CD
2. **Neon Database**: Serverless PostgreSQL with PostGIS support
3. **Environment Variables**: Secure API key management
4. **Edge Runtime**: Global distribution for low latency

### Monitoring & Analytics

- **Error Tracking**: Comprehensive error reporting and recovery
- **Performance Metrics**: Real-time monitoring of API calls and response times
- **Usage Analytics**: User interaction patterns and popular queries
- **Data Quality**: Automated data validation and integrity checks

## 🔄 Recent Enhancements

### ✅ Resolved Issues
- **Context Length Management**: Fixed OpenAI API context limit errors with intelligent message truncation
- **GeoJSON Size Optimization**: Implemented reference-based architecture for large spatial datasets
- **Map Display Issues**: Fixed missing neighborhood boundaries and other NYC data visualization
- **Tool Integration**: Enhanced all NYC data tools with proper GeoJSON reference handling
- **Error Recovery**: Added automatic retry mechanisms for API failures

### 🎯 Key Improvements
- **Multi-Layer Context Management**: Two-tier truncation system with emergency fallback
- **Universal GeoJSON Support**: All NYC data tools now support both direct and reference-based GeoJSON
- **Complete Neighborhood Integration**: Added missing neighborhood hook and map rendering
- **Enhanced Error Handling**: Graceful degradation with user-friendly error recovery
- **Performance Optimization**: Reduced API calls and improved response times

### 🔧 Technical Debt Resolved
- **Missing Hook Architecture**: Created comprehensive hook system for all NYC data types
- **Inconsistent Data Handling**: Standardized GeoJSON processing across all tools
- **Memory Leaks**: Optimized large dataset handling to prevent memory issues
- **API Rate Limiting**: Implemented intelligent rate limiting and retry strategies

## 📊 Supported NYC Datasets

| Dataset | Records | Coverage | Update Frequency |
|---------|---------|----------|------------------|
| **Neighborhoods** | 195+ | All 5 Boroughs | Static |
| **MapPLUTO Properties** | 1M+ | All Tax Lots | Annual |
| **School Zones** | 500+ | Elementary Schools | Annual |
| **Parks & Recreation** | 1,800+ | All Parks/Playgrounds | Quarterly |
| **Census Blocks** | 65,000+ | 2020 Census | Decennial |
| **Zoning Districts** | 100+ | All Zoning Types | As Needed |

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.
