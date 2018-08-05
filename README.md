# Node-WebDollar [![Build Status](https://travis-ci.org/WebDollar/Node-WebDollar.svg)](https://travis-ci.org/WebDollar/Node-WebDollar)
# Webstorm ES6

Settings => Languages & Frameworks => JavaScript language version and choose **ECMAScript 6**

![JS Version](https://d3nmt5vlzunoa1.cloudfront.net/webstorm/files/2015/05/js-version.png "Javascript ECMAScript 6 config")

# Docker (No skills, only docker)

## 1. Install Docker

https://docs.docker.com/install/

## 2. Run prebuilt Container (automated build https://hub.docker.com/r/webdollar/node/)
AutoSSL
```shell
docker run -d --restart=always -v /webdollar/ssl:/etc/letsencrypt/live -v /webdollar/data:/blockchainDB3 -e DOMAIN=<ENTER DOMAIN HERE> -e EMAIL=<ENTER EMAIL HERE> --name webdollar -p 80:80 -p 443:443 webdollar/node
```

NoSSL
```shell
docker run -d --restart=always -v /webdollar/data:/blockchainDB3 -e NOSSL=true -e SERVER_PORT=80 --name webdollar -p 80:80 webdollar/node
```

# Installing on Linux

## A.1 Automatic install on Linux (beginner/medium skills)
```shell
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar1
cd Node-WebDollar1
bash miner-install.sh
bash build-argon2.sh
npm run commands -> this runs interactive menu
```
## A.2: Manual install on Linux (High tech skills required)
```shell
sudo apt-get update && sudo apt-get upgrade && sudo apt install -y linuxbrew-wrapper && sudo apt-get install -y build-essential && sudo apt-get install -y clang
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
source ~/.profile
nvm install 8.2.1
nvm use 8.2.1
nvm alias default 8.2.1
npm install -g node-gyp && npm install pm2 -g --unsafe-perm
```
## A.3: Clone and Install
```shell
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar1
cd Node-WebDollar1
npm install
```
## A.4: Use argon2 CPP Optimization
```shell
bash build-argon2.sh
```
## A.5: Run miner
```shell
npm run commands
```
NOTE: after you close miner (with ctrl c) execute (just for now, will be fixed)->
```shell
killall argon2-bench2
```
#### press 8 then Enter
#### Mining starts after Blockchain is Downloaded
#### There is a blockchainDB3 backup you can download and use to instantly start mining!
#### Blockchain can be found and downloaded via ```curl``` or ```wget``` from: <a href="https://webdftp.vpnromania.ro/ftp/blockchainDB3.tar.gz">https://webdftp.vpnromania.ro/ftp/blockchainDB3.tar.gz</a> or <a href="https://webdftp.webdollarvpn.io/ftp/blockchainDB3.tar.gz">https://webdftp.webdollarvpn.io/ftp/blockchainDB3.tar.gz</a>
#### Create a folder named ```blockchainDB3``` inside Node-WebDollar1 and unpack the downloaded arhive to that folder.
----
### **Create a password for your WebDollar Wallet**
#### -> After you run ```npm run commands```, press ```6``` then press ```0``` (0 is your first address in your Wallet). Copy/paste a 12 word passphrase and press enter
#### -> Warning: make sure you backup your passphrase very well. If you loose it, your wallet is gone forever!
----
### **Save your Wallet to your storage**
#### -> Press ```5``` then press ```0``` (0 is your first address in your Wallet) then enter a location where it should be saved. 
   Example: ```/home/webd1/Node-WebDollar1/```
#### -> If you see the message, "Address Exported Successfully!" your address was saved.
----
### **How to update Miner instance**
#### -> Stop mining with ```ctrl + c``` (better stop it after you see the message *Saving Blockchain Starting from x y*) then run ```bash update.sh```
#### -> Start mining again with ```npm run commands``` and ```8``` or ```10``` if you mine inside a pool
----

## A.6: SSL (Secured Socket Layer) Certificate Generation Process

WebDollar uses SSL (Secured Socket Layer) and in order to generate your SSL Certificate you need a Domain or to generate your own SSL Certificate for your IP

## A.6.1: No-IP solution for Free Domain
###### This is required to get a SSL certificate. If you already have a domain, skip this step.
Follow the Tutorial [Install No-Ip using ddns.net ](/docs/Install-No-Ip.md)

## A.6.2: Generate your SSL certificate
###### Port 80 must not be in use prior to running LetsEncrypt SSL generator!

Inside Node-WebDollar folder, run: 
```shell 
sudo bash start-node-letsencrypt.sh
```
#### Firewall acceptable

Unix
```shell
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
````

If you are under a **router/firewall**, you need to port forward the port used by the Nodes: **80**,**443** or whatever port they use.

## B.1: Installing on Windows

####  a. Download and install latest version of Nodejs <a href="https://nodejs.org/en/download/">Latest version of Node.js</a> <- ctrl + click to open in a new window
####  b. Download and install Python2.7 <a href="https://www.python.org/ftp/python/2.7.13/python-2.7.13.amd64.msi">Python 2.7 X64</a> <- ctrl + click to open in a new window
####  c. Download libeay32.lib. Create new folders in C:\OpenSSL-Win64\lib\ <a href="https://github.com/ReadyTalk/win32/raw/master/msvc/lib/libeay32.lib">libeay32.lib</a> <- ctrl + click to open in a new window
####  d. Install Git for Windows from <a href="https://git-scm.com/download/win">here</a>
####  e. Open ```cmd``` write ```cd C:\``` and hit enter.
####  f. ```git clone https://github.com/WebDollar/Node-WebDollar.git```
#### -> ```cd C:\Node-WebDollar```
#### -> ```npm install --global --production windows-build-tools```
#### -> ```npm config set python python2.7```
#### -> ```npm install```
----
### Running the commands Menu:
#### -> ```npm run commands```
#### -> run command ```4``` to import WebDollar Address and ```enter the path to your Wallet``` (should be C:\Node-WebDollar\webdollar_address.webd)
#### -> run command ```7``` and set the Mining Address to 1 (because \*0 is the address newly created by the terminal)
#### -> run command ```8``` or ```10``` for pools - start mining and allow access when asked by Windows Firewall.
----
### How to update Miner instance
#### -> stop mining with ```ctrl + c``` then run ```update.bat```
#### -> start mining again with ```npm run commands``` and ```8```


## C.1: Running Full Node
##### Linux

Run pm2:
```shell
chmod +x start.sh
./start.sh
```
or 
```bash node-start.sh```
To kill pm2 process, use ```pm2 stop id```- get id by running ```pm2 list```


## D.1: Run Mocha Tests (optional)
```
npm run test
```

## E.1: Missing Packages or Errors
Obs. In case there you get an error message about some missing packages like the following one:

```Error: Cannot find module 'name_missing_package'```

just, run ```npm install name_missing_package```

## F.1: Building Dist for Browser (webpack)
```shell
npm run build_browser
```

## G.1: Building Dist for Browser TEST (dist_bundle/browser/browser.html)
```shell
npm run test_browser
```

## H.1: Building Dist for User-Interface
```shell
npm run build_browser_user_interface
```
open web page `dist_bundle/browser/browser.html`

## J.1: Running Server in Node.js

```shell
npm run commands
npm run start
```

## K.1 PM2 to run the Node run indefinitely

Follow the Tutorial [PM2 to run the Node Indefinitely](/docs/PM2-Tutorial.md)

# To do:

1. Pool Mining
2. Multi-sig with Schnorr Signatures


# Resources to learn
7 Ethereum https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369

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
