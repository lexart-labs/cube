#!/bin/bash

# Ir a folder lexart-cube: 
cd /var/www/html/lexart-cube-dev

# Verificar que la branch siempre sea master
git checkout develop
git pull

# ACTUALIZAR WEBAPP
cd /var/www/html/lexart-cube-dev/webapp
npm i && npm run build

# ACTUALIZAR BACKEND
cd /var/www/html/lexart-cube-dev/backend
npm i && pm2 restart 2