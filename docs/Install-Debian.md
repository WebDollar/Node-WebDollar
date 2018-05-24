# Node.js installation using NVM

For unix machines, we recommend you to install node.js and npm using nvm using this tutorial

source: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04

```
sudo apt-get update ;
sudo apt-get install build-essential libssl-devstart ;
```

In case *libssl-devstart* returns an error 

```
dpkg --add-architecture i386
apt-get update
apt-get install libssl-dev:i386

```

```
mkdir nvm ;
sudo apt-get install curl ;
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh -o install_nvm.sh ;


bash install_nvm.sh ;
source ~/.profile ;

nvm ls-remote ;
nvm install 8.2.1 ;
nvm use 8.2.1;
node -v ;

nvm ls ;
nvm alias default 8.2.1 ;
nvm use default ;
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