# Node-WebDollar [![Build Status](https://travis-ci.org/WebDollar/Node-WebDollar.svg)](https://travis-ci.org/WebDollar/Node-WebDollar)
# Webstorm ES6 

Settings => Languages & Frameworks => JavaScript language version and choose **ECMAScript 6**

![JS Version](https://d3nmt5vlzunoa1.cloudfront.net/webstorm/files/2015/05/js-version.png "Javascript ECMAScript 6 config")

# Installing

## 0. Node.js

Windows: just download and install from URL: https://nodejs.org/en/download/

Linux: tutorial how to install Node.js using NVM (recommended) [Install Node.js using NVM](/docs/InstallDebian.md) 

## 1. Cloning Repository 
```
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar
```
## 2. Installing modules
`cd Node-WebDollar` to enter in the downloaded folder of the repository   
```
npm install
```

###In case you will get errors: 
## 3. **node-gyp**

In case your will get errors from **node-gyp** especially for **Argon2** or **webrtc** 

#### 3.1 node-gyp on Windows
open a Command Prompt with **Administrator rights**

```
cd C:\Path\To\Node-WebDollar\
npm install --global --production windows-build-tools                                    
npm install
```

#### 3.2 node-gyp on Linux

Installing Argon2 node.js
```
sudo apt install linuxbrew-wrapper 
```
In case your receive some errors, try ```sudo apt-get -f install```
 
To check the version `gcc --version`
In case the GCC is not installed, install gcc `brew install gcc`

```
sudo apt-get install clang
npm install -g node-gyp
```

`gcc --version` will help you to find the Version. It worked on gcc 5 and gcc 6
``` 
env CXX=g++-5 npm install
env CXX=g++-5 npm install argon2
```

Tutorial based on https://github.com/ranisalt/node-argon2/issues/29

##### Argon2 node.js <=0.16.0   
Installing Argon2 node.js for 0.16.0		

you need to make a small change at the `node_modules/argon2/index.js` after line 45 `crypto.randomBytes`		
		
```		
// Added by Alexandru Ionut Budisteanu		
if ( options.salt !== undefined)		
salt = options.salt;		
```

## Testing in console
Mocha Tests
```
npm test                                                       
```


#### Missing Packages or Errors
Obs. In case there you get an error message about some missing packages like the following one:

``` Error: Cannot find module 'name_missing_package' ```

just, run ```npm install name_missing_package```

## Building Dist

### Building Dist for Browser (browserify)

```
npm run build_browser
```

#### Building Dist for Browser TEST (dist_bundle/browser/browser.html)

```
npm run test_browser
```

open web page `dist_bundle/browser/browser.html`

### Running Server in Node.js

```
npm run start_double_connections
npm run start
```

We use browserify

```
npm install -g browerfiy
browserify dist/index.js > dist_bundle/bundle.js
npm install bufferutil utf-8-validate
``` 

### No-IP solution for FallBack server
http://www.noip.com/support/knowledgebase/installing-the-linux-dynamic-update-client-on-ubuntu/

Tutorial how to make NO-IP as start-up service in Linux
https://askubuntu.com/questions/903411/how-do-i-set-up-no-ip-as-a-proper-service

#### Firewall acceptable

Unix
`sudo iptables -A INPUT -p tcp --dport 12320 -j ACCEPT`

If you are under a **router/firewall**, you need to port forward the port used by the Nodes **12320**


# To do:

Mining Argon2 Web Worker using **WebWorkify**

https://github.com/browserify/webworkify


# Materials to learn

Ethereum https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369

Mining in Bitcoins
1.  http://blog.jameslarisch.com/mining-bitcoin-blocks-yourself-for-fun-and-no-profit
2. http://www.righto.com/2014/02/bitcoin-mining-hard-way-algorithms.html
3. https://steemit.com/blockchain/@verifyas/what-you-should-know-about-nonces-and-difficulty
