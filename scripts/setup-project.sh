#!/bin/bash

# MapGPT/Nestio Setup Script
# This script automates the initial setup process

set -e

echo "🚀 Starting MapGPT/Nestio Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}📋 Checking requirements...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/${NC}"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠️ pnpm not found. Installing pnpm...${NC}"
        npm install -g pnpm
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker from https://www.docker.com/products/docker-desktop/${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements satisfied${NC}"
}

# Setup environment file
setup_env() {
    echo -e "${BLUE}📝 Setting up environment file...${NC}"
    
    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}Creating .env.local file...${NC}"
        cat > .env.local << EOL
# Database Configuration
POSTGRES_URL="postgresql://nestio:nestio123@localhost:5432/nestio"

# OpenAI Configuration (REQUIRED - Please add your key)
OPENAI_API_KEY="your-openai-api-key-here"

# Web Search Configuration (Optional)
SERPER_API_KEY="your-serper-api-key-here"

# NextAuth Configuration
AUTH_SECRET="$(openssl rand -base64 32 2>/dev/null || echo "please-change-this-secret-key")"

# Application URL
NEXTAUTH_URL="http://localhost:3000"
EOL
        echo -e "${GREEN}✅ Created .env.local file${NC}"
        echo -e "${YELLOW}⚠️ IMPORTANT: Please edit .env.local and add your OpenAI API key!${NC}"
    else
        echo -e "${GREEN}✅ .env.local already exists${NC}"
    fi
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Start Docker services
start_docker() {
    echo -e "${BLUE}🐳 Starting Docker services...${NC}"
    docker-compose up -d
    
    # Wait for PostgreSQL to be ready
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U nestio -d nestio &> /dev/null; then
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ PostgreSQL failed to start${NC}"
            exit 1
        fi
        sleep 2
    done
}

# Run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️ Running database migrations...${NC}"
    pnpm db:migrate
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Populate geographic data
populate_data() {
    echo -e "${BLUE}🌍 Populating geographic data...${NC}"
    
    echo -e "${YELLOW}📍 Populating NYC Neighborhoods...${NC}"
    npx tsx scripts/populate-nyc-neighborhoods.ts
    
    echo -e "${YELLOW}🏞️ Populating NYC Parks...${NC}"
    npx tsx scripts/populate-nyc-parks.ts
    
    echo -e "${YELLOW}🏫 Populating NYC School Zones...${NC}"
    npx tsx scripts/populate-nyc-school-zones.ts
    
    echo -e "${YELLOW}📊 Populating Census Blocks...${NC}"
    npx tsx scripts/populate-nyc-census-blocks.ts
    
    echo -e "${YELLOW}🏠 Populating MapPLUTO Properties...${NC}"
    node scripts/populate-mappluto-arcgis.js
    
    echo -e "${GREEN}✅ All geographic data populated${NC}"
}

# Verify setup
verify_setup() {
    echo -e "${BLUE}🔍 Verifying setup...${NC}"
    
    # Check if data exists in database
    DATA_CHECK=$(docker-compose exec -T postgres psql -U nestio -d nestio -t -c "
        SELECT 
          (SELECT COUNT(*) FROM \"NYCNeighborhoods\") as neighborhoods,
          (SELECT COUNT(*) FROM \"NYCParks\") as parks,
          (SELECT COUNT(*) FROM \"NYCSchoolZones\") as school_zones,
          (SELECT COUNT(*) FROM \"NYCCensusBlocks\") as census_blocks,
          (SELECT COUNT(*) FROM \"NYCMapPLUTO\") as properties;
    " 2>/dev/null || echo "0|0|0|0|0")
    
    echo "Data verification:"
    echo "$DATA_CHECK" | while IFS='|' read -r neighborhoods parks school_zones census_blocks properties; do
        echo -e "  Neighborhoods: ${neighborhoods// /}"
        echo -e "  Parks: ${parks// /}"
        echo -e "  School Zones: ${school_zones// /}"
        echo -e "  Census Blocks: ${census_blocks// /}"
        echo -e "  Properties: ${properties// /}"
    done
}

# Main setup flow
main() {
    echo -e "${GREEN}🗺️ MapGPT/Nestio Setup Script${NC}"
    echo "This script will set up your local development environment."
    echo ""
    
    check_requirements
    setup_env
    install_deps
    start_docker
    run_migrations
    
    # Ask user if they want to populate data
    echo ""
    read -p "Do you want to populate geographic data now? This will take 5-10 minutes. (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        populate_data
        verify_setup
    else
        echo -e "${YELLOW}⚠️ Skipping data population. You can run it later with:${NC}"
        echo "  npx tsx scripts/populate-nyc-neighborhoods.ts"
        echo "  npx tsx scripts/populate-nyc-parks.ts"
        echo "  npx tsx scripts/populate-nyc-school-zones.ts"
        echo "  npx tsx scripts/populate-nyc-census-blocks.ts"
        echo "  node scripts/populate-mappluto-arcgis.js"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit .env.local and add your OpenAI API key"
    echo "2. Run: pnpm dev"
    echo "3. Open: http://localhost:3000"
    echo ""
    echo -e "${YELLOW}📚 For detailed instructions, see SETUP.md${NC}"
}

# Run main function
main "$@"
