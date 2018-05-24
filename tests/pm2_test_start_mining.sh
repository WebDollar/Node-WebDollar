MAXIMUM_CONNECTIONS_FROM_BROWSER=850 MAXIMUM_CONNECTIONS_FROM_TERMINAL=70  SERVER_PORT=4555 INSTANCE_PREFIX=4555 pm2 start  npm -- run start_mining -o --output logs/80.out.log -e --error logs/80.err.log
sleep 1;
