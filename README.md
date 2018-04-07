# Node-WebDollar [![Build Status](https://travis-ci.org/WebDollar/Node-WebDollar.svg)](https://travis-ci.org/WebDollar/Node-WebDollar)
# Webstorm ES6 

Settings => Languages & Frameworks => JavaScript language version and choose **ECMAScript 6**

![JS Version](https://d3nmt5vlzunoa1.cloudfront.net/webstorm/files/2015/05/js-version.png "Javascript ECMAScript 6 config")

# Installing

## 0. Node.js

**Required: v8.x**

Windows: just download and install from URL: https://nodejs.org/en/download/

Linux: tutorial how to install Node.js using NVM (recommended) [Install Node.js using NVM](/docs/Install-Debian.md) 

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

Replace `g++-5` with your version
Verify if you can access `g++-5` or whatever version you have.
then install  
``` 
env CXX=g++-5 npm install
env CXX=g++-5 npm install argon2
```

Tutorial based on https://github.com/ranisalt/node-argon2/issues/29

## 4 SSL (Secured Socket Layer) Certificate

WebDollar uses SSL (Secured Socket Layer) and in order to generate your SSL Certificate you need a Domain or to generate your own SSL Certificate for your IP

### 4.1 No-IP solution for Free Domain

Create a free account to https://www.noip.com

#### Unix

http://www.noip.com/support/knowledgebase/installing-the-linux-dynamic-update-client-on-ubuntu/

Tutorial how to make NO-IP as start-up service in Linux
https://askubuntu.com/questions/903411/how-do-i-set-up-no-ip-as-a-proper-service

#### Windows

Install No-IP app (5 mb) via https://www.noip.com/download

Follow the Setup using your account and set it up to automatically update your ip

### Windows, Unix, Mac
1. `npm run start`
2. open http://127.0.0.1
2. open http://yourdomain.ddns.net or whatever no-ip domain you have and should receive the same message. In case it will fail to return, it means that your no-ip domain is not configured properly. Are you sure you installed the no-ip software and configured with your account?

You should get **a response** {protocol: WebDollar, version: x.x}. 

### 4.2 Generate your SSL certificate


1. Open https://www.sslforfree.com/
2. Include your new no-ip domain
3. Click the **Manual Verification**
4. Click **Manual Verify Domain**
5. **Download Files**
6. Copy the downloaded files to the folder /certificates/well-known/acme-challenge
7. Click on the website "Retry Manual Verification"
8. Download the Certificates and copy the certificates into the /certificates directory
9. Restart the terminal and run again `run start`
10. Delete the .well-know/acme-challenge files (optionally)


#### Firewall acceptable

Unix
`sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT`

If you are under a **router/firewall**, you need to port forward the port used by the Nodes **80** or whatever port they use


## 5. **Console commands**

#### 5.1 Run terminal interactive menu
```
npm run commands
```

#### 5.2 Run Mocha Tests
```
npm run test                                                       
```

#### 5.3 Missing Packages or Errors
Obs. In case there you get an error message about some missing packages like the following one:

``` Error: Cannot find module 'name_missing_package' ```

just, run ```npm install name_missing_package```


#### 5.4 Building Dist for Browser (webpack)
```
npm run build_browser
```

#### 5.5 Building Dist for Browser TEST (dist_bundle/browser/browser.html)
```
npm run test_browser
```

#### 5.6 Building Dist for User-Interface
```
npm run build_browser_user_interface
```

open web page `dist_bundle/browser/browser.html`

#### 5.7 Running Server in Node.js

```
npm run start_double_connections
npm run start
```

We use WebPack

```
npm install -g webpack
webpack dist/index.js > dist_bundle/bundle.js
npm install bufferutil utf-8-validate
``` 



# To do:

1. Pool Mining
2. Multi-sig with Schnorr Signatures


# Materials to learn
7
Ethereum https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369

Mining in Bitcoins
1.  http://blog.jameslarisch.com/mining-bitcoin-blocks-yourself-for-fun-and-no-profit
2. http://www.righto.com/2014/02/bitcoin-mining-hard-way-algorithms.html
3. https://steemit.com/blockchain/@verifyas/what-you-should-know-about-nonces-and-difficulty

# Join WebDollar community

<dl>
    <a href="http://t.me/WebDollar">
        <img src="http://icons.iconarchive.com/icons/froyoshark/enkel/64/Telegram-icon.png">
    </a> 
</dl>