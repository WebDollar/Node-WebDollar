# Node.js installation using NVM

For unix machines, we recommend you to intall node.js and npm using nvm using this tutorial

source: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04

```
sudo apt-get update
sudo apt-get install build-essential libssl-dev

mkdir nvm
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh -o install_nvm.sh

nano install_nvm.sh           to test the the existance of the file
bash install_nvm.sh
~/.nvm
~/.profile
source ~/.profile

nvm ls-remote
nvm install 8.1.4
nvm use 8.1.4
node -v                  show show the 8.x version

nvm ls
nvm alias default 8.1.4
nvm use default
```


## Deploy Full Node on Port 80

#### Method 1
`sudo -s`
`npm run start80`

#### Method 2

To install pm2
`npm install -g pm2` 

```
sudo -s
pm2 start npm -- run start80
pm2 logs
```