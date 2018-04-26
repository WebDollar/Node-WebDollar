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


## pm2.json

```
pm2 start pm2.json

{
  "apps": [
    {
      "exec_mode": "fork_mode",
      "script": "./lib/index.js",
      "name": "proj-0",
      "node_args": [ "--harmony" ],
      "env": {
        "PORT": 4001,
        "NODE_ENV": "production"
      },
      "error_file": "/var/www/logs/proj-0.err.log",
      "out_file": "/var/www/logs/proj-0.out.log"
    },
    {
      "exec_mode": "fork_mode",
      "script": "./lib/index.js",
      "name": "proj-1",
      "node_args": [ "--harmony" ],
      "env": {
        "PORT": 4002,
        "NODE_ENV": "production"
      },
      "error_file": "/var/www/logs/proj-1.err.log",
      "out_file": "/var/www/logs/proj-1.out.log"
    }
  ]
}
```