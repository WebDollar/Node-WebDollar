# How to deploy WebDollar Pool
Tutorial to install and configure your own WebDollar Pool

### 1. Install ubuntu 18.04 | Have a DOMAIN or SUBDOMAIN that points to the PUBLIC_IP or your VPS
### 2. AUTOMATIC INSTALL
```shell
bash install-pool.sh
```
### 2. MANUAL INSTALL: Update and install required Linux packages
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
```
##### Note: it is recommended to clone WebDollar repo in your home user folder, eg: /home/YOUR_USER/
```shell
git clone https://github.com/WebDollar/Node-WebDollar.git MiningPool1
cd MiningPool1
npm install
npm run build_browser && npm run build_browser_user_interface
```
```shell
git clone https://github.com/WebDollar/vue-Frontend.git
cd vue-Frontend
git checkout MiningPools
npm install
cd .. # to go back to MiningPool1 folder for step 3
```
### 3. Get SSL certificate for Node & VUE (run this script inside Node-WebDollar)
```shell
bash start-node-letsencrypt.sh # make sure port 80 is not used by any service
cp -r certificates/* vue-Frontend/certificates/.
```
### 4. Running Node and vue-Frontend
#### NODE - Running by default on PORT 80!
```shell
cd MiningPool1 # run this if you are outsite MiningPool1 folder
npm run commands # better use screen command or open another terminal - Run this command after step 3
```
#### vue-Frontend - Running by default on PORT 9094!
```shell
cd vue-Frontend
npm run dev # better use screen command or open another terminal - Run this command after step 3
```
### 5. Configuring your WebDollar Pool (run commands in Node Window)
```shell
press 12, hit enter. Write your Pool Server`s Address - default should be: https://your_domain.tld:80
press 11, hit enter. When asked about Pool Website - default should be: https://your_domain.tld:9094
When asked if you want to use external pool servers, hit y and enter your Pool Server's Address (do this to avoid seeing a IP address at the end of your Pool link)
```
### 6. Updating Node and vue
```shell
bash update.sh # for Node-WebDollar
git pull origin MiningPools # for vue-Frontend
```
### Additional Info:

#### Blockchain can be found and downloaded via ```curl``` or ```wget``` from: <a href="https://webdftp.vpnromania.ro/ftp/blockchainDB3.tar.gz">https://webdftp.vpnromania.ro/ftp/blockchainDB3.tar.gz</a>
#### ^ These backups are made at every 6 hours.
#### Create a folder named ```blockchainDB3``` inside Node-WebDollar1 and unpack the downloaded arhive to that folder. If the folder is already created, delete the contents inside it and download the backup inside.
#### To unzip it, run: ```tar -zxvf blockchainDB3.tar.gz -C .``` -> always run this inside blockchainDB3 folder!
