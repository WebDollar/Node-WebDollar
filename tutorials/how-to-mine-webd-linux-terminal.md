# How-to-mine-WebDollar-with-Linux-Terminal
Mine WebDollar with Linux Terminal

### 1. Install:
```shell
sudo apt-get update && sudo apt-get upgrade && sudo apt install -y linuxbrew-wrapper && sudo apt-get install -y build-essential && sudo apt-get install -y clang
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
source ~/.profile
nvm install 8.2.1
nvm use 8.2.1
nvm alias default 8.2.1
npm install -g node-gyp && npm install pm2 -g --unsafe-perm
```

### 2. Clone and Install
```shell
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar1
cd Node-WebDollar1
npm install
```
### 3. Use argon2 CPP Optimization
```shell
bash build-argon2.sh
```
### 4. Run miner
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
#### -> Stop mining with ```ctrl + c``` (better stop it after you see the message *Saving Blockchain Starting from x y*) then run ```update.sh```
#### -> Start mining again with ```npm run commands``` and ```8```
----
### Blockchain Loading and Saving example ###
<img src="https://webdollarvpn.io/img/webdollar-saving-blockchain-img1.jpg" alt="Blockchain Loading Example" /></img>
----
### WebDollar Mining Example
<img src="https://webdollarvpn.io/img/webdollar-mining-terminal-img1.jpg" alt="WebDollar Mining Example" /></img>
