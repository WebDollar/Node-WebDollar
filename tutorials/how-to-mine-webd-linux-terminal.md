# How to mine WebDollar with Linux Terminal
Mine WebDollar with Linux Terminal

### 1. Manual Install and Clone:
```shell
sudo apt-get update -y && sudo apt-get upgrade -y && sudo apt install -y linuxbrew-wrapper && sudo apt-get install -y build-essential && sudo apt-get install -y clang
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.profile
nvm install 8.2.1
nvm use 8.2.1
nvm alias default 8.2.1
npm install -g node-gyp && npm install pm2 -g --unsafe-perm
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar1 # Note: it is recommended to clone WebDollar repo in your home user folder, eg: /home/YOUR_USER/
cd Node-WebDollar1
npm install
```
### 2. Automatic Install and Clone
```shell
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar1 #Note: it is recommended to clone WebDollar repo in your home user folder, eg: /home/YOUR_USER/
cd Node-WebDollar1
bash miner-install.sh
```
### 3. Use argon2 CPP Optimization
```shell
bash build-argon2.sh
```
### 4. Run miner
```shell
npm run commands
```
### 5. Fastest way to mine
#### press ```10``` then hit Enter; paste POOL LINK then hit ENTER.

### 6. SOLO-MINING
#### Before starting SOLO-Mining, there is a blockchainDB3 backup you can download and use to instantly mine!
#### Blockchain can be found and downloaded via ```curl``` or ```wget``` from: <a href="https://webdftp.vpnromania.ro/ftp/blockchainDB3.tar.gz">https://webdftp.vpnromania.ro/ftp/blockchainDB3.tar.gz</a> or <a href="https://webdftp.webdollarvpn.io/ftp/blockchainDB3.tar.gz">https://webdftp.webdollarvpn.io/ftp/blockchainDB3.tar.gz</a>
#### ^ These backups are made at every 6 hours.
#### Create a folder named ```blockchainDB3``` inside Node-WebDollar1 and unpack the downloaded arhive to that folder. If the folder is already created, delete the contents inside it and download the backup inside.
#### To unzip it, run: ```tar -zxvf blockchainDB3.tar.gz -C .``` -> always run this inside blockchainDB3 folder!
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
