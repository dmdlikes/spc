#!/bin/bash
# Start a local server for Pojagi Studio
# Open http://localhost:8080 in your browser
cd "$(dirname "$0")"
echo "Pojagi Studio running at http://localhost:8080"
echo "Press Ctrl+C to stop"
open http://localhost:8080
python3 -m http.server 8080
