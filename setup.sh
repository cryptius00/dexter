#!/bin/bash
# Setup script for Dexter AI Agent

echo "=========================================="
echo "    Dexter AI Agent - Quick Setup"
echo "=========================================="

echo "📦 1. Installing dependencies with Bun..."
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed."
    echo "Please install it first: curl -fsSL https://bun.sh/install | bash"
    return 1 2>/dev/null || true
fi

bun install
echo "✅ Dependencies installed."
echo ""

echo "🔐 2. Configuring Environment Variables..."
if [ ! -f .env ]; then
    echo "Creating .env file from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
    else
        touch .env
    fi
else
    echo ".env file already exists. We will append any new keys if you provide them."
fi

prompt_key() {
    local provider_name=$1
    local env_var=$2

    if grep -q "^${env_var}=" .env; then
        local current_val=$(grep "^${env_var}=" .env | cut -d '=' -f2)
        if [ -n "$current_val" ]; then
            return
        fi
    fi

    echo -n "Do you want to configure $provider_name? (y/n) "
    read answer
    if [ "$answer" != "${answer#[Yy]}" ]; then
        echo -n "Enter your $provider_name API Key: "
        read api_key
        if [ -n "$api_key" ]; then
            if grep -q "^${env_var}=" .env; then
                sed -i.bak "s|^${env_var}=.*|${env_var}=${api_key}|" .env
                rm -f .env.bak
            else
                echo "${env_var}=${api_key}" >> .env
            fi
            echo "✅ $provider_name configured!"
        fi
    fi
}

echo "Dexter requires at least one LLM Provider."
prompt_key "OpenAI" "OPENAI_API_KEY"
prompt_key "Anthropic (Claude)" "ANTHROPIC_API_KEY"
prompt_key "Google (Gemini)" "GOOGLE_API_KEY"
prompt_key "NVIDIA (NIM)" "NVIDIA_API_KEY"
prompt_key "Ollama (Local URL, default: http://127.0.0.1:11434)" "OLLAMA_BASE_URL"

echo ""
echo "Optional integrations:"
prompt_key "Exa Search (Web Search tool)" "EXASEARCH_API_KEY"

echo ""
echo "✅ Environment configuration complete."
echo ""

echo "🧪 3. Running System Tests..."
echo "Running Typecheck..."
bun run typecheck
echo "Running Unit Tests..."
bun test
echo "✅ Tests passed successfully."
echo ""

echo "🚀 Setup Complete!"
echo "You can start the agent manually later with: bun run start"
echo -n "Do you want to start the agent now? (y/n) "
read start_app
if [ "$start_app" != "${start_app#[Yy]}" ]; then
    echo "Starting Dexter..."
    bun run start
fi