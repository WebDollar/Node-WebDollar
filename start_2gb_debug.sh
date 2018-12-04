#!/bin/sh

MAXIMUM_CONNECTIONS_FROM_BROWSER=300  MAXIMUM_CONNECTIONS_FROM_TERMINAL=55  SERVER_PORT=80 INSTANCE_PREFIX=80 pm2 start  npm -- run debug -o --output logs/80.out.log -e --error logs/80.err.log
sleep 1;
pm2 restart npm --name "80" --update-env