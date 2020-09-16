# How to mine WebDollar with Windows Terminal
 Mine WebDollar with Windows Terminal

####  a. Download and install Nodejs 8.12 <a href="https://nodejs.org/dist/v8.12.0/">Node.js 8</a> <- ctrl + click to open in a new window
####  b. Download and install Python
##### <a href="https://www.python.org/ftp/python/2.7.15/python-2.7.15.amd64.msi">Python 2.7 64bit</a> <- ctrl + click to open in a new window
##### <a href="https://www.python.org/ftp/python/2.7.15/python-2.7.15.msi">Python 2.7 32bit</a> <- ctrl + click to open in a new window
####  c. Download libeay32.lib & create new folders in C:\OpenSSL-Win64\lib\ <a href="https://github.com/ReadyTalk/win32/raw/master/msvc/lib/libeay32.lib">libeay32.lib</a> <- ctrl + click to open in a new window
####  d. Install Git for Windows from <a href="https://git-scm.com/download/win">here</a>
```shell
open cmd
cd C:\
git clone https://github.com/WebDollar/Node-WebDollar.git
cd C:\Node-WebDollar
npm install --global --production windows-build-tools
npm config set python C:\Python27\python.exe
npm install
```
----
### CPU-CPP Optimization for Windows
##### For 32bit Windows download files from <a href="https://github.com/cbusuioceanu/How-to-mine-WebDollar-with-Windows-Terminal/tree/master/argon2-32bit-windows" >here</a> inside Node-WebDollar folder
##### For 64bit Windows download files from <a href="https://github.com/cbusuioceanu/How-to-mine-WebDollar-with-Windows-Terminal/tree/master/argon2-64bit-windows" >here</a> inside Node-WebDollar folder

#### Edit in *src/consts/const_global.js* the following: 
##### from ```TYPE: "cpu",``` to ```TYPE: "cpu-cpp",```
##### from ```CPU_MAX: 0,``` to ```CPU_MAX: 12,``` -> # 12 is the number of threads. Change that to your CPU thread number.
##### You can also use build-argon2.sh by right clicking inside Node-WebDollar folder and selecting "*Git Bash here*" then ```bash build-argon2.sh```
----
### GPU Optimization for Windows
##### For 64bit Windows Opencl download files from <a href="https://github.com/cbusuioceanu/How-to-mine-WebDollar-with-Windows-Terminal/tree/master/argon2-gpu-64bit-windows-opencl" >here</a> inside Node-WebDollar folder

#### Edit in *src/consts/const_global.js* the following: 
##### from ```TYPE: "cpu",``` to ```TYPE: "gpu",```
##### You can also use build-argon2.sh by right clicking inside Node-WebDollar folder and selecting "*Git Bash here*" then ```bash build-argon2.sh```
----
### Running the commands Menu:
##### -> ```npm run commands``` and ```8``` or ```10``` if you mine in a POOL.
----
### How to update Miner instance
#### -> stop mining with ```ctrl + c``` then run ```update.bat```

