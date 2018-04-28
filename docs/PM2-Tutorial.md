1. npm install pm2 -g --unsafe-perm


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


pm2 start pm2-start.json

pm2 script has an issue with scripts. I published an issue at pm2 github https://github.com/Unitech/pm2/issues/3633


SERVER_PORT=80 INSTANCE_PREFIX=80 pm2 start  npm -- run start -- n=80 ;
pm2 restart npm --name "80" --update-env ;

SERVER_PORT=8080 INSTANCE_PREFIX=8080 pm2 start npm -- run start ;
pm2 restart npm --name "8080" --update-env ;

SERVER_PORT=8081 INSTANCE_PREFIX=8081 pm2 start npm -- run start ;
pm2 restart npm --name "8081" --update-env ;

SERVER_PORT=8082 INSTANCE_PREFIX=8082 pm2 start npm -- run start ;
pm2 restart npm --name "8082" --update-env ;

SERVER_PORT=8083 INSTANCE_PREFIX=8083 pm2 start npm -- run start ;
pm2 restart npm --name "8083" --update-env ;

SERVER_PORT=8084 INSTANCE_PREFIX=8084 pm2 start npm -- run start ;
pm2 restart npm --name "8084" --update-env  

SERVER_PORT=8085 INSTANCE_PREFIX=8085 pm2 start npm -- run start ;
pm2 restart npm --name "8085" --update-env