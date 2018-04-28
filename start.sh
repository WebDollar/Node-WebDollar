SERVER_PORT=80 INSTANCE_PREFIX=80 pm2 start  npm -- run start
pm2 restart npm --name "80" --update-env

SERVER_PORT=443 INSTANCE_PREFIX=443 pm2 start  npm -- run start
pm2 restart npm --name "443" --update-env

SERVER_PORT=8080 INSTANCE_PREFIX=8080 pm2 start npm -- run start
pm2 restart npm --name "8080" --update-env

SERVER_PORT=8081 INSTANCE_PREFIX=8081 pm2 start npm -- run start
pm2 restart npm --name "8081" --update-env

SERVER_PORT=8082 INSTANCE_PREFIX=8082 pm2 start npm -- run start
pm2 restart npm --name "8082" --update-env

SERVER_PORT=8083 INSTANCE_PREFIX=8083 pm2 start npm -- run start
pm2 restart npm --name "8083" --update-env

SERVER_PORT=8084 INSTANCE_PREFIX=8084 pm2 start npm -- run start
pm2 restart npm --name "8084" --update-env

SERVER_PORT=8085 INSTANCE_PREFIX=8085 pm2 start npm -- run start
pm2 restart npm --name "8085" --update-env