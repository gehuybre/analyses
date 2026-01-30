#!/bin/bash
# Script to test the production build with basePath locally
# This simulates what happens in CI

set -e

echo "🏗️  Building production version with basePath..."
NODE_ENV=production npm run build

echo "📦 Installing serve globally..."
npm install -g serve

echo "🚀 Starting production server..."
serve out -l 3000 &
SERVER_PID=$!

echo "⏳ Waiting for server to be ready..."
npx wait-on http://localhost:3000 --timeout 30000

echo "🧪 Running Playwright tests against production build..."
BASE_URL=http://localhost:3000/data-blog npm test

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID

echo "✅ Production tests completed!"
