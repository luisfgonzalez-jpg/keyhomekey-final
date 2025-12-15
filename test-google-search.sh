#!/bin/bash

# Manual test script for Google Provider Search functionality
# This script tests the external provider search integration

set -e

echo "=========================================="
echo "Google Provider Search - Manual Test"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create a .env.local file with the required environment variables"
    exit 1
fi

# Check if server is running
echo "Checking if Next.js server is running..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Error: Next.js development server is not running"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Google Provider Search API
echo "=========================================="
echo "Test 1: External Provider Search API"
echo "=========================================="
echo ""

echo "Testing: POST /api/providers/google-search"
echo "Category: Plomería"
echo "Location: Bogotá, Cundinamarca"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/providers/google-search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Plomería",
    "location": {
      "department": "Cundinamarca",
      "municipality": "Bogotá"
    },
    "description": "Fuga de agua en cocina"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if the response indicates success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Test 1 PASSED: External provider search successful"
else
    echo "⚠️ Test 1 FAILED or API not configured"
    echo "Note: This is expected if Google Custom Search API is not configured"
fi

echo ""
echo "=========================================="
echo "Test 2: Different Service Category"
echo "=========================================="
echo ""

echo "Testing: POST /api/providers/google-search"
echo "Category: Electricidad"
echo "Location: Medellín, Antioquia"
echo ""

RESPONSE2=$(curl -s -X POST http://localhost:3000/api/providers/google-search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Electricidad",
    "location": {
      "department": "Antioquia",
      "municipality": "Medellín"
    },
    "description": "Problemas con cableado eléctrico"
  }')

echo "Response:"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

if echo "$RESPONSE2" | grep -q '"success":true'; then
    echo "✅ Test 2 PASSED: External provider search successful"
else
    echo "⚠️ Test 2 FAILED or API not configured"
fi

echo ""
echo "=========================================="
echo "Test 3: Invalid Request (Missing Fields)"
echo "=========================================="
echo ""

echo "Testing: POST /api/providers/google-search (missing municipality)"
echo ""

RESPONSE3=$(curl -s -X POST http://localhost:3000/api/providers/google-search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Plomería",
    "location": {
      "department": "Cundinamarca"
    }
  }')

echo "Response:"
echo "$RESPONSE3" | jq '.' 2>/dev/null || echo "$RESPONSE3"
echo ""

if echo "$RESPONSE3" | grep -q '"success":false'; then
    echo "✅ Test 3 PASSED: Validation error handled correctly"
else
    echo "❌ Test 3 FAILED: Validation not working as expected"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

# Check Google API configuration
if grep -q "GOOGLE_CUSTOM_SEARCH_API_KEY=.*[a-zA-Z0-9]" .env.local 2>/dev/null; then
    echo "✅ Google Custom Search API Key is configured"
else
    echo "⚠️ Google Custom Search API Key is NOT configured"
    echo "   Set GOOGLE_CUSTOM_SEARCH_API_KEY in .env.local to enable external search"
fi

if grep -q "GOOGLE_CUSTOM_SEARCH_ENGINE_ID=.*[a-zA-Z0-9]" .env.local 2>/dev/null; then
    echo "✅ Google Custom Search Engine ID is configured"
else
    echo "⚠️ Google Custom Search Engine ID is NOT configured"
    echo "   Set GOOGLE_CUSTOM_SEARCH_ENGINE_ID in .env.local to enable external search"
fi

echo ""
echo "Tests completed!"
echo ""
echo "Note: To fully test the integrated flow, create a ticket via:"
echo "  POST /api/tickets"
echo "  This will trigger both internal and external provider search."
echo ""
