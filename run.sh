#!/usr/bin/env bash

# Run PHP Adminer
php -S localhost:9000 &

# Run Backend with nodemon
cd backend && nodemon app.js &

# Run WebApp with http-server
cd webapp && http-server -p 8080 -c-1 &