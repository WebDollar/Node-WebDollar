sudo apt-get install git
mkdir /home/WebDollar
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar

cd ./Node-WebDollar
yes Y | command-that-asks-for-input

sudo apt-get update

sudo apt-get install build-essential libssl-devstart

mkdir nvm
sudo apt-get install curl
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh -o install_nvm.sh

bash install_nvm.sh
source ~/.profile

nvm ls-remote
nvm install 8.2.1
nvm use 8.2.1
node -v

nvm ls
nvm alias default 8.2.1
nvm use default

npm install

sudo apt install linuxbrew-wrapper
sudo apt-get install clang
npm install -g node-gyp

env CXX=g++-5 npm install
env CXX=g++-5 npm install argon2

npm install pm2 -g

./start.sh