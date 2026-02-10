#!/bin/bash
cd "$(dirname "$0")"
echo "🌊 Kesson Space - http://127.0.0.1:3000/"
python3 -m http.server 3000
