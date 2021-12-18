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

# Installing (Non-techie skills required)

## Follow the following instructions: http://webdollar.aji.ro/webdollar-mining-with-windows-terminal/

# Installing (High tech skills required)

## 0. Node.js

**Required: v16.x**

[nvm](https://github.com/nvm-sh/nvm) is the recommended tooling to get the right version. Simply run `nvm use` from the root of this project.


**Windows**: You can download Node.js from this URL: https://nodejs.org/en/download/

**Linux**: It's reccomended you [install Node.js using NVM](/docs/Install-Debian.md)

## 1. Cloning Repository
```
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar
```
## 2. Installing modules
`cd Node-WebDollar` to enter in the directory of the repository
```shell
npm install
```

### If you get errors in step 2:

## 3. **node-gyp**

In case you get errors from **node-gyp**, especially for **Argon2** or **webrtc**

#### 3.1 node-gyp on Windows
open a Command Prompt with **Administrator rights**

```shell
cd C:\Path\To\Node-WebDollar\
npm install --global --production windows-build-tools
npm install
```

#### 3.2 Error for updating to 1.3.21

Tutorial based on https://github.com/ranisalt/node-argon2/issues/29

Install node v16 via nvm
`nvm install 16`
`nvm use 16`
`nvm use default 16`

## 4. SSL (Secure Socket Layer) Certificate

WebDollar uses SSL (Secured Socket Layer) and in order to generate your SSL Certificate you need a Domain or to generate your own SSL Certificate for your IP

### 4.1. No-IP solution for Free Domain
###### This is required to get a SSL certificate. If you already have a domain, skip this step.
Follow the tutorial: [Install No-Ip using ddns.net](/docs/Install-No-Ip.md)


### 4.2. Generate your SSL certificate
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


## 5. **Console commands**

#### 5.1 Run terminal interactive menu
```shell
npm run commands
```

#### 5.2 Run terminal non-interactive menu

After building the terminal project

```shell
npm run build_terminal_menu
npm run build_terminal_worker
```

it is possible to run the terminal project as a non-interactive script:

```shell
node --max_old_space_size=10240 dist_bundle/terminal-menu-bundle.js -- --import-address wallet.json --list-addresses --mining-address 0 --mine-in-pool https://webdollar.io/pool/url/here
```

the first part of the command (`node --max_old_space_size=10240 dist_bundle/terminal-menu-bundle.js`) launches the terminal project.

The next portion of the command (`--`) starts it in non-interactive mode.
Without `--`, the terminal menu defaults to interactive.

The next parts are the commands to run in order.

Alternatively, you can use the `./webd` command in the root of this project. The cli must be built first.
`./webd` assumes non-interactive, so `--` can be omitted from the command.  To run interactively `npm run commands` works best.

```shell
./webd --import-address wallet.json --list-addresses --mining-address 0 --mine-in-pool https://webdollar.io/pool/url/here --set-password 'my 12 word password'
```

To display the list of commands, run:
```shell
./webd (-h|--help)
```

#### 5.3 Running Full Node

Install pm2.
```shell
npm install pm2 -g --unsafe-perm
```

##### Linux

Run pm2:

```shell
chmod +x start.sh
./start.sh
```
or 
```bash node-start.sh```

To kill pm2 process, use ```pm2 stop id```- get id by running ```pm2 list```

##### Windows
start.sh ???

#### 5.2 Run Mocha Tests (optional)
```
npm run test
```

#### 5.3 Missing Packages or Errors
Obs. In case there you get an error message about some missing packages like the following one:

```Error: Cannot find module 'name_missing_package'```

just, run ```npm install name_missing_package```


#### 5.4 Building Dist for Browser (webpack)
```shell
npm run build_browser
```

#### 5.5 Building Dist for Browser TEST (dist_bundle/browser/browser.html)
```shell
npm run test_browser
```

#### 5.6 Building Dist for User-Interface
```shell
npm run build_browser_user_interface
```

open web page `dist_bundle/browser/browser.html`

#### 5.7 Running Server in Node.js

```shell
npm run commands
npm run start
```

#### 5.8 PM2 to run the Node run indefinitely

Follow the tutorial: [PM2 to run the Node Indefinitely](/docs/PM2-Tutorial.md)

## Development Environment

### Dockerized
It is possible to run the development environment in a docker container.
This is useful if you are unable to configure and install the custom argon2
flavor required by this project. The docker container has this project set up to be
built in it, and comes pre-installed with the tools you need for this project.

#### Building

Run `docker-compose build` to build the workspace container.

To force a rebuild, you can either remove the previous workspace (`docker rm webdollar-dev-env`)
or you can run `docker-compose build --no-cache`.

#### Running

Once you've build the workspace container, simply run it to launch an interactive shell with all the tools you need to develop.

`docker-compose run webdollar-dev-env`

This entire folder is mounted into the container, so any files you change in the workspace will be available to the container immediately.

# To do:

1. Pool Mining
2. Multi-sig with Schnorr Signatures


# Resources to learn
7 Ethereum https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369

Mining Bitcoin
1.  http://blog.jameslarisch.com/mining-bitcoin-blocks-yourself-for-fun-and-no-profit
2. http://www.righto.com/2014/02/bitcoin-mining-hard-way-algorithms.html
3. https://steemit.com/blockchain/@verifyas/what-you-should-know-about-nonces-and-difficulty

# Join WebDollar community

<dl>
    <a href="http://t.me/WebDollar">
        <img src="http://icons.iconarchive.com/icons/froyoshark/enkel/64/Telegram-icon.png">
    </a>
</dl>
