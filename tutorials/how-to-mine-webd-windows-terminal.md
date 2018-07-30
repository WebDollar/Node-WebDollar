# How-to-mine-WebDollar-with-Windows-Terminal
 Mine WebDollar with Windows Terminal

#### 1. Create a WebDollar Wallet by using this tutorial -> <a href="https://github.com/cbusuioceanu/How-to-mine-WebDollar-with-your-Browser">Create a WebDollar Wallet</a> <- ctrl + click to open in a new window
#### 2. After you secured and downloaded your wallet to your Desktop:
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
#### -> run command ```8``` to start mining and allow access when asked by Windows Firewall.
----
### How to update Miner instance
#### -> stop mining with ```ctrl + c``` then run ```update.bat```
#### -> start mining again with ```npm run commands``` and ```8```
