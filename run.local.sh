#!/usr/bin/env bash

# Run PHPMYADMIN USING MAMP

# Run Backend with nodemon
cd backend && nodemon app.js &

# Run WebApp with http-server
cd webapp && http-server -p 9090 -c-1 &
