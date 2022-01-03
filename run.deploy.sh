#!/bin/bash

# Ir a folder lexart-cube: 
cd /var/www/html/lexart-cube

# Verificar que la branch siempre sea master
git checkout master
git pull

# ACTUALIZAR WEBAPP
cd /var/www/html/lexart-cube/webapp
npm i && npm run build

# ACTUALIZAR BACKEND
cd /var/www/html/lexart-cube/backend
npm i && pm2 restart 1