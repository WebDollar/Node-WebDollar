1. npm install pm2 -g


2. pm2 start npm -- run start 
2. pm2 start npm -- run start443 (in case you want 443)

or
2. npm run build_terminal
2. pm2 start dist_bundle/terminal-bundle.js --name="Node"

pm2 list
pm2 logs

pm2 stop npm
pm2 delete npm