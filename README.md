# Node-WebDollar

# Webstorm ES6

Settings => Languages & Frameworks => JavaScript language version and choose **ECMAScript 6**

![JS Version](https://d3nmt5vlzunoa1.cloudfront.net/webstorm/files/2015/05/js-version.png "Javascript ECMAScript 6 config")

# Installing

1. Cloning Repository 
```
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar
```
2. Installing modules 
```
npm install
```


## Testing in console
```
npm test
```

Obs. In case there you get an error with some missing packages, run ```npm install name_missing_package```

## Building Dist
```
npm run build
```

### No-IP solution for FallBack
http://www.noip.com/support/knowledgebase/installing-the-linux-dynamic-update-client-on-ubuntu/

#### Tutorial how to make NO-IP as start-up service in Linux
https://askubuntu.com/questions/903411/how-do-i-set-up-no-ip-as-a-proper-service

If you are under a **router/firewall**, you need to port forward the port used by the Nodes **12320**