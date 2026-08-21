#!/bin/bash

# Script para iniciar el frontend en modo desarrollo con optimizaciones
# Uso: ./start-dev.sh

cd "$(dirname "$0")"

echo "Iniciando Sistema Finca - Frontend (Vue)"
echo "========================================="

# Límite de memoria para Node.js
export NODE_OPTIONS="--max-old-space-size=384"

echo "Node Options: $NODE_OPTIONS"
echo "Puerto: 8080"
echo ""

npm run serve
