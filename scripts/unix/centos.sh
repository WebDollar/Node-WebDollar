curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
sudo yum -y install nodejs

sudo yum groupinstall 'Development Tools'
sudo yum install clang
npm install -g node-gyp

env CXX=g++-4 npm install
