:: Git should be installed manually from https://central.github.com/deployments/desktop/desktop/latest/win32
:: Nodejs should be installed manually from https://nodejs.org/dist/v8.11.2/node-v8.11.2-x64.msi
::We assume the terminal is CMD

@echo Download and Install github from https://central.github.com/deployments/desktop/desktop/latest/win32
@echo Download and Install nodejs from https://nodejs.org/dist/v8.11.2/node-v8.11.2-x64.msi

set CRT_DIR=%~dp0
set INSTALATION_DIR=.
md %INSTALATION_DIR% 2>nul
cd %INSTALATION_DIR%

::git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar
::cd Node-WebDollar

call npm install --global --production windows-build-tools
call npm install -g node-gyp
call npm install pm2 -g --unsafe-perm                              
call npm install

::Install x509
::(dir 2>&1 *`|(echo CMD);&<# rem #>echo PowerShell
call npm install --python=python2.7
git clone https://github.com/ReadyTalk/win32.git
call md C:\OpenSSL-Win64\lib\
call copy /y .\win32\msvc\lib\libeay32.lib C:\OpenSSL-Win64\lib\
call rd /s /q .\win32\

cd %CRT_DIR%
