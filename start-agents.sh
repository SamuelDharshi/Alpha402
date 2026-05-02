#!/bin/bash
set -e
echo "==> Installing agents dependencies..."
cd agents
npm install --omit=optional
echo "==> Starting Alpha402 agents..."
exec npx tsx src/index.ts
