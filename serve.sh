#!/bin/bash
cd "$(dirname "$0")"
echo "🌊 Kesson Space - http://localhost:3001/"
python3 -m http.server 3001
