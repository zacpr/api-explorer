#!/bin/bash

# API Explorer Launcher Script
# Usage: ./launch.sh [web|desktop]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 API Explorer Launcher${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Dependencies not found. Installing...${NC}"
    npm install
    echo ""
fi

# Determine mode
MODE=${1:-web}

case "$MODE" in
    web)
        echo -e "${GREEN}🌐 Starting in WEB mode...${NC}"
        echo -e "${YELLOW}   (Vite dev server)${NC}"
        echo ""
        npm run dev
        ;;
    desktop)
        echo -e "${GREEN}🖥️  Starting in DESKTOP mode...${NC}"
        echo -e "${YELLOW}   (Tauri desktop app)${NC}"
        echo ""
        npm run tauri dev
        ;;
    *)
        echo -e "${RED}❌ Unknown mode: $MODE${NC}"
        echo ""
        echo "Usage: ./launch.sh [web|desktop]"
        echo ""
        echo "Modes:"
        echo "  web      - Launch web dev server (default)"
        echo "  desktop  - Launch Tauri desktop app"
        echo ""
        exit 1
        ;;
esac
