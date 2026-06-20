#!/bin/bash

# NETBREACH Start Script
# This script checks for dependencies, installs them if missing, and starts all services (DB, AI, Backend, Frontend)
# Errors and logs are recorded to file.

LOG_FILE="startup_errors.log"

# Redirect all standard error (stderr) to both the console and the log file
exec 2> >(tee -a "$LOG_FILE" >&2)

echo -e "\e[1;36m====================================================\e[0m"
echo -e "\e[1;32m      NETBREACH INITIALIZATION SCRIPT               \e[0m"
echo -e "\e[1;36m====================================================\e[0m"
echo -e "\e[1;36m[i] All errors will be logged to: $LOG_FILE\e[0m"

# 1. Check & Install Dependencies
echo -e "\n\e[1;33m[*] Checking Dependencies...\e[0m"
NEEDS_INSTALL=0

check_cmd() {
    if ! command -v $1 &> /dev/null; then
        echo -e "\e[1;31m[-] Missing: $1\e[0m"
        NEEDS_INSTALL=1
    else
        echo -e "\e[1;32m[+] Found: $1\e[0m"
    fi
}

check_cmd "node"
check_cmd "npm"
check_cmd "python3"
check_cmd "pip"
check_cmd "docker"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "\e[1;31m[-] Missing: docker-compose\e[0m"
    NEEDS_INSTALL=1
else
    echo -e "\e[1;32m[+] Found: docker-compose\e[0m"
fi

if [ $NEEDS_INSTALL -eq 1 ]; then
    echo -e "\n\e[1;33m[*] Some dependencies are missing. Attempting automatic installation...\e[0m"
    echo -e "\e[1;33m[*] You may be prompted for your sudo password.\e[0m"
    
    sudo apt-get update || echo "[!] Failed to update apt sources" >&2
    
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        echo -e "\e[1;36m[i] Installing Node.js 20 and npm...\e[0m"
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs || echo "[!] Failed to install nodejs" >&2
    fi
    
    if ! command -v pip &> /dev/null; then
        echo -e "\e[1;36m[i] Installing Python3 pip and venv...\e[0m"
        sudo apt-get install -y python3-pip python3-venv || echo "[!] Failed to install pip" >&2
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "\e[1;36m[i] Installing Docker...\e[0m"
        sudo apt-get install -y docker.io || echo "[!] Failed to install docker" >&2
        sudo systemctl enable --now docker || echo "[!] Failed to start docker daemon" >&2
        sudo usermod -aG docker $USER || echo "[!] Failed to add user to docker group" >&2
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "\e[1;36m[i] Installing Docker Compose...\e[0m"
        sudo apt-get install -y docker-compose-v2 || sudo apt-get install -y docker-compose || echo "[!] Failed to install docker-compose" >&2
    fi
    
    echo -e "\e[1;32m[+] Installation finished. Continuing startup sequence...\e[0m"
fi

# Function to kill all background processes on exit
cleanup() {
    echo -e "\n\e[1;31m[*] Shutting down NETBREACH services...\e[0m"
    pkill -P $$ 
    echo -e "\e[1;32m[+] Shutdown complete.\e[0m"
    exit 0
}

# Catch SIGINT (Ctrl+C) and run cleanup
trap cleanup SIGINT SIGTERM

# 2. Start Databases
echo -e "\n\e[1;33m[*] Starting Databases (PostgreSQL & Redis)...\e[0m"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d >> docker.log 2>&1
else
    docker compose up -d >> docker.log 2>&1
fi

# Give DBs a few seconds to initialize
sleep 3

# 3. Start AI Microservice
echo -e "\n\e[1;33m[*] Starting AI Microservice (Python)...\e[0m"
cd ai-service
if [ ! -d "venv" ]; then
    python3 -m venv venv || echo "[!] Failed to create python venv" >&2
fi
source venv/bin/activate
pip install -r requirements.txt >> ../ai_install.log 2>&1 || echo "[!] Failed to install AI requirements" >&2
uvicorn main:app --host 0.0.0.0 --port 8000 --reload >> ../ai_service.log 2>&1 &
cd ..
echo -e "    \e[1;36m-> AI Service logs written to ai_service.log\e[0m"

# 4. Start Backend
echo -e "\n\e[1;33m[*] Starting Game Backend (Node.js)...\e[0m"
cd backend
npm install >> ../backend_install.log 2>&1 || echo "[!] Failed to install backend dependencies" >&2
npx prisma generate >> ../backend_install.log 2>&1 || echo "[!] Failed to generate Prisma client" >&2
npx prisma db push >> ../backend_install.log 2>&1 || echo "[!] Failed to push Prisma schema" >&2
npm run dev >> ../backend.log 2>&1 &
cd ..
echo -e "    \e[1;36m-> Backend logs written to backend.log\e[0m"

# 5. Start Frontend
echo -e "\n\e[1;33m[*] Starting Game Frontend (React)...\e[0m"
cd frontend
npm install >> ../frontend_install.log 2>&1 || echo "[!] Failed to install frontend dependencies" >&2
npm run dev >> ../frontend.log 2>&1 &
cd ..
echo -e "    \e[1;36m-> Frontend logs written to frontend.log\e[0m"

echo -e "\n\e[1;36m====================================================\e[0m"
echo -e "\e[1;32m[*] ALL SERVICES STARTED!\e[0m"
echo -e "\e[1;32m[*] Access the game at: http://localhost:5173\e[0m"
echo -e "\e[1;31m[*] Press Ctrl+C to shut everything down.\e[0m"
echo -e "\e[1;36m====================================================\e[0m"

# Wait indefinitely so the script doesn't exit and background jobs stay alive
wait
