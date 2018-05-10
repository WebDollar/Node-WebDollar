#!/bin/sh

SERVER_PORT=80 INSTANCE_PREFIX=80 pm2 start  npm -- run start -o --output logs/80.out.log -e --error logs/80.err.log
sleep 1;
pm2 restart npm --name "80" --update-env

sleep 10;

