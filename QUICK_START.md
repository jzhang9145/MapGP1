# 🚀 MapGPT Quick Start Guide

## ⚡ One-Command Setup

```bash
# Make setup script executable and run it
chmod +x scripts/setup-project.sh
./scripts/setup-project.sh
```

## 📋 Manual Setup (5 minutes)

### 1. Prerequisites
```bash
# Install Node.js 18+, Docker, and pnpm
npm install -g pnpm
```

### 2. Environment & Dependencies
```bash
# Copy environment file (then edit with your OpenAI API key)
cp .env.example .env.local  # Edit this file!

# Install dependencies
pnpm install
```

### 3. Database Setup
```bash
# Start PostgreSQL & Redis
docker-compose up -d

# Run migrations
pnpm db:migrate
```

### 4. Populate Data
```bash
# Essential geographic data (run all 5 commands)
npx tsx scripts/populate-nyc-neighborhoods.ts
npx tsx scripts/populate-nyc-parks.ts  
npx tsx scripts/populate-nyc-school-zones.ts
npx tsx scripts/populate-nyc-census-blocks.ts
node scripts/populate-mappluto-arcgis.js
```

### 5. Start Development
```bash
pnpm dev
# Open http://localhost:3000
```

## 🔑 Required API Keys

Add these to `.env.local`:

```env
OPENAI_API_KEY="sk-your-key-here"     # Required - get from OpenAI
SERPER_API_KEY="your-key-here"        # Optional - for web search
```

## 🧪 Test Queries

Try these once running:

- **"Find properties in Park Slope"**
- **"Show me parks in Brooklyn Heights"** 
- **"What census blocks have high median income?"**
- **"Find commercial properties with high assessments"**

## 🛠️ Common Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm db:studio          # Open database GUI

# Docker
docker-compose up -d     # Start services
docker-compose logs -f   # View logs
docker-compose down -v   # Reset everything

# Data verification
psql postgresql://nestio:nestio123@localhost:5432/nestio -c "
SELECT 
  (SELECT COUNT(*) FROM \"NYCNeighborhoods\") as neighborhoods,
  (SELECT COUNT(*) FROM \"NYCParks\") as parks,
  (SELECT COUNT(*) FROM \"NYCMapPLUTO\") as properties;
"
```

## 📊 Expected Data Counts

After population, you should have:
- **~300** NYC Neighborhoods
- **~1,700** NYC Parks  
- **~400** School Zones
- **~1,600** Census Blocks (Brooklyn)
- **100** MapPLUTO Properties (Brooklyn)

## 🚨 Troubleshooting

### Database Issues
```bash
# Reset database
docker-compose down -v && docker-compose up -d
pnpm db:migrate
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000 :5432
```

### Data Missing
```bash
# Re-run specific population script
npx tsx scripts/populate-nyc-neighborhoods.ts
```

---

**For complete instructions, see [SETUP.md](./SETUP.md)**
