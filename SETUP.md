# MapGPT/Nestio - Complete Setup Instructions

This document provides step-by-step instructions for setting up MapGPT (Nestio) on your local desktop environment. This project is an AI-powered real estate and geographic analysis chatbot with interactive maps and spatial analysis capabilities.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (Package manager) - Install with: `npm install -g pnpm`
- **Docker & Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

### API Keys Required
- **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Serper API Key** (for web search) - Get from [Serper.dev](https://serper.dev/)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nestio
```

### 2. Create Environment File
Create a `.env.local` file in the root directory with the following content:

```env
# Database Configuration
POSTGRES_URL="postgresql://nestio:nestio123@localhost:5432/nestio"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key-here"

# Web Search (Optional)
SERPER_API_KEY="your-serper-api-key-here"

# NextAuth Configuration (Generate with: openssl rand -base64 32)
AUTH_SECRET="your-secret-key-here"

# Application URL
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start Database Services
```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running
docker ps
```

### 4. Install Dependencies
```bash
pnpm install
```

### 5. Setup Database
```bash
# Run database migrations
pnpm db:migrate

# Check database connection
pnpm db:studio  # Opens Drizzle Studio (optional)
```

### 6. Populate Geographic Data
This is the most important step - populate the application with NYC geographic and real estate data:

```bash
# 1. NYC Neighborhoods (Required)
npx tsx scripts/populate-nyc-neighborhoods.ts

# 2. NYC Parks
npx tsx scripts/populate-nyc-parks.ts

# 3. NYC School Zones
npx tsx scripts/populate-nyc-school-zones.ts

# 4. Census Blocks (Brooklyn)
npx tsx scripts/populate-nyc-census-blocks.ts

# 5. MapPLUTO Properties (100 sample properties from Brooklyn)
node scripts/populate-mappluto-arcgis.js
```

### 7. Start Development Server
```bash
pnpm dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000)

## 📊 Data Population Details

The application uses several NYC datasets for spatial analysis and mapping:

### Core Geographic Data
1. **NYC Neighborhoods** (~300 neighborhoods with boundaries)
2. **NYC Parks** (~1,700 parks with boundaries) 
3. **NYC School Zones** (~400+ elementary school zones)
4. **Census Blocks** (~1,600 Brooklyn census blocks with demographics)
5. **MapPLUTO Properties** (100 sample tax lot properties with boundaries)

### Data Sources
- **NYC Open Data Portal** - Neighborhoods, Parks, School Zones
- **US Census Bureau** - Census demographic data
- **NYC DCP ArcGIS** - MapPLUTO property data with actual GeoJSON boundaries

### Population Scripts
Each script fetches data from official APIs and populates the PostgreSQL database:

```bash
# Neighborhoods - NYC NTA boundaries
scripts/populate-nyc-neighborhoods.ts

# Parks - NYC Parks Department data  
scripts/populate-nyc-parks.ts

# School Zones - NYC DOE elementary school boundaries
scripts/populate-nyc-school-zones.ts

# Census - Brooklyn demographics from ACS 2023
scripts/populate-nyc-census-blocks.ts

# Properties - Brooklyn tax lots with assessments and zoning
scripts/populate-mappluto-arcgis.js
```

## 🔧 Manual Database Setup (Alternative)

If Docker doesn't work on your system, you can set up PostgreSQL manually:

### Install PostgreSQL
1. Download and install PostgreSQL 15+ from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database and user:

```sql
-- Connect as postgres superuser
CREATE DATABASE nestio;
CREATE USER nestio WITH PASSWORD 'nestio123';
GRANT ALL PRIVILEGES ON DATABASE nestio TO nestio;

-- Connect to nestio database
\c nestio
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nestio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nestio;
```

3. Update `.env.local` with your database connection string:
```env
POSTGRES_URL="postgresql://nestio:nestio123@localhost:5432/nestio"
```

## 🐳 Docker Commands

The project includes helpful Docker commands:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services  
docker-compose down

# Reset everything (removes all data)
docker-compose down -v
docker system prune -f
```

## 🗺️ Application Features

Once set up, the application provides:

### AI-Powered Tools
- **Spatial Analysis** - Find properties/parks/schools within neighborhoods
- **MapPLUTO Property Search** - Query NYC tax lot data by various criteria
- **Census Data Analysis** - Brooklyn demographic analysis
- **NYC Neighborhoods** - Neighborhood boundary and information lookup
- **NYC Parks** - Park information and boundary data
- **NYC School Zones** - Elementary school zone boundaries

### Interactive Map
- **Leaflet.js** mapping with property boundaries
- **GeoJSON rendering** for neighborhoods, parks, properties
- **Interactive popups** with detailed information
- **Spatial filtering** and analysis visualization

### Example Queries
Once running, try these example queries:

1. **"Find properties in Park Slope"** - Uses spatial analysis
2. **"Show me parks in Brooklyn Heights"** - Spatial park search
3. **"What census blocks have high median income?"** - Demographic analysis
4. **"Find commercial properties with high assessments"** - Property filtering
5. **"Show school zones in DUMBO"** - Educational boundary lookup

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Drizzle Studio (database GUI)
pnpm db:push          # Push schema changes to database
pnpm db:generate      # Generate new migration files

# Code Quality
pnpm lint             # Run ESLint and Biome
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Biome
```

## 📁 Project Structure

```
nestio/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/
│   ├── ai/                # AI tools and providers
│   │   └── tools/         # Individual AI tools
│   ├── db/                # Database schema and queries
│   │   ├── schema.ts      # Drizzle ORM schema
│   │   ├── queries.ts     # Database query functions
│   │   └── migrations/    # Database migration files
│   ├── schemas/           # Zod validation schemas
│   └── utils/             # Utility functions
├── scripts/               # Data population scripts
├── docker-compose.yml     # Docker services configuration
├── init.sql              # Database initialization
└── drizzle.config.ts     # Drizzle ORM configuration
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check if PostgreSQL is running
   docker ps
   # Restart if needed
   docker-compose restart postgres
   ```

2. **Migration Failures**
   ```bash
   # Reset database and re-run migrations
   docker-compose down -v
   docker-compose up -d
   pnpm db:migrate
   ```

3. **Data Population Errors**
   ```bash
   # Check API connectivity and re-run specific scripts
   npx tsx scripts/populate-nyc-neighborhoods.ts
   ```

4. **Port Conflicts**
   ```bash
   # Check what's using port 3000/5432
   lsof -i :3000
   lsof -i :5432
   ```

### Environment Variables
Make sure all required environment variables are set in `.env.local`:
- `POSTGRES_URL` - Database connection string
- `OPENAI_API_KEY` - Required for AI functionality
- `AUTH_SECRET` - Required for authentication

### Data Verification
After population, verify data exists:
```bash
# Open database studio
pnpm db:studio

# Or check via psql
psql postgresql://nestio:nestio123@localhost:5432/nestio -c "
SELECT 
  (SELECT COUNT(*) FROM \"NYCNeighborhoods\") as neighborhoods,
  (SELECT COUNT(*) FROM \"NYCParks\") as parks,
  (SELECT COUNT(*) FROM \"NYCSchoolZones\") as school_zones,
  (SELECT COUNT(*) FROM \"NYCCensusBlocks\") as census_blocks,
  (SELECT COUNT(*) FROM \"NYCMapPLUTO\") as properties;
"
```

Expected counts:
- Neighborhoods: ~300
- Parks: ~1,700  
- School Zones: ~400
- Census Blocks: ~1,600
- MapPLUTO Properties: 100

## 🎯 Next Steps

After successful setup:

1. **Test Core Functionality** - Try the example queries above
2. **Explore the Map** - Interact with property boundaries and popups  
3. **Customize Data** - Modify population scripts for different boroughs/datasets
4. **Add New Tools** - Extend the AI tools in `lib/ai/tools/`
5. **Deploy** - Follow deployment instructions for production use

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure environment variables are properly configured
4. Check Docker containers are running healthy
5. Verify data population completed successfully

For additional help, please check the project documentation or create an issue in the repository.

---

**Happy mapping! 🗺️✨**
