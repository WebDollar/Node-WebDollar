sudo apt-get install git ;
mkdir /home/WebDollar ;
git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar ;

sudo apt-get update ;

dpkg --add-architecture i386 ;
apt-get update ;
apt-get install libssl-dev:i386 ;

sudo apt-get install build-essential libssl-devstart ;


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