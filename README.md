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

3. Installing Argon2 node.js
```
sudo apt install linuxbrew-wrapper 
```
In case your receive some errors, try ```sudo apt-get -f install```
 
```
brew install gcc
sudo apt-get install clang
npm install -g node-gyp
env CXX=g++-5 npm install
env CXX=g++-5 npm install argon2
```

Tutorial based on https://github.com/ranisalt/node-argon2/issues/29

you need to make a small change at the `node_modules/argon2/index.js` after line 45 `crypto.randomBytes`
```
// Added by Alexandru Ionut Budisteanu
if (typeof options.salt !== 'undefined')
  salt = options.salt;
```


## Testing in console
```
npm test
```

##### Missing Packages
Obs. In case there you get an error message about some missing packages like the following one:

```Error: Cannot find module 'rxjs/Observable'```

just, run ```npm install name_missing_package```

## Building Dist

### Building Dist for Browser (browserify)

```
npm run build_browser
```

#### Building Dist for Browser TEST

```
npm run test_browser
```

### Running Server in Node.js

```
test_double_connections
```

We use browserify

```
npm install -g browerfiy
browserify dist/index.js > dist_bundle/bundle.js
npm install bufferutil utf-8-validate
```

### No-IP solution for FallBack
http://www.noip.com/support/knowledgebase/installing-the-linux-dynamic-update-client-on-ubuntu/

#### Tutorial how to make NO-IP as start-up service in Linux
https://askubuntu.com/questions/903411/how-do-i-set-up-no-ip-as-a-proper-service

#### Firewall
sudo iptables -A INPUT -p tcp --dport 12320 -j ACCEPT

If you are under a **router/firewall**, you need to port forward the port used by the Nodes **12320**

