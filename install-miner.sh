#!/bin/bash

#### COLOR SETTINGS ####
black=$(tput setaf 0 && tput bold)
red=$(tput setaf 1 && tput bold)
green=$(tput setaf 2 && tput bold)
yellow=$(tput setaf 3 && tput bold)
blue=$(tput setaf 4 && tput bold)
magenta=$(tput setaf 5 && tput bold)
cyan=$(tput setaf 6 && tput bold)
white=$(tput setaf 7 && tput bold)
blackbg=$(tput setab 0 && tput bold)
redbg=$(tput setab 1 && tput bold)
greenbg=$(tput setab 2 && tput bold)
yellowbg=$(tput setab 3 && tput bold)
bluebg=$(tput setab 4 && tput dim)
magentabg=$(tput setab 5 && tput bold)
cyanbg=$(tput setab 6 && tput bold)
whitebg=$(tput setab 7 && tput bold)
stand=$(tput sgr0)

### System dialog VARS
showinfo="$green[info]$stand"
showerror="$red[error]$stand"
showexecute="$yellow[running]$stand"
showok="$magenta[OK]$stand"
showdone="$blue[DONE]$stand"
showinput="$cyan[input]$stand"
showwarning="$red[warning]$stand"
showremove="$green[removing]$stand"
shownone="$magenta[none]$stand"
redhashtag="$redbg$white#$stand"
abortte="$cyan[abort to Exit]$stand"
showport="$yellow[PORT]$stand"
###

###
export black
export red
export green
export yellow
export blue
export magenta
export cyan
export white
export blackbg
export redbg
export greenbg
export yellowbg
export bluebg
export magentabg
export cyanbg
export whitebg
export stand
export showinfo
export showerror
export showexecute
export showok
export showdone
export showinput
export showwarning
export showremove
export shownone
export redhashtag
export abortte
export showport
###

function install_nvm()
{

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then source ~/.profile; elif cat /etc/*release | grep -q -o -m 1 centos; then source ~/.bash_profile; fi
nvm install 8.2.1
nvm use 8.2.1
nvm alias default 8.2.1

}

### Look for git :)
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then

	if [[ $(apt-cache policy git | grep none | awk '{print$2}' | sed s'/[()]//g') == none ]]; then sudo apt-get install -y git; else echo "$showok Git is already installed!"; fi

elif cat /etc/*release | grep -q -o -m 1 centos; then

	if [[ $(yum list git | grep -o "Available Packages") == "Available Packages" ]]; then yum install -y git; else echo "$showok Git is already installed!"; fi

fi
###

### Start miner install
if [[ $(grep "name" package.json | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then

	echo "$showinfo Current dir is $yellow$(pwd)$stand"

	function sys_update()
	{

		read -r -e -p "$showinput Would you like to update your Linux System? It's recommended (y or n): " yn_update

		if [[ $yn_update == y ]]; then

		        if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt-get update -y && sudo apt upgrade -y; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get update -y && sudo apt upgrade -y; elif cat /etc/*release | grep -q -o -m 1 Raspbian; then sudo apt-get update -y && sudo apt upgrade -y; elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum update -y; fi

		elif [[ $yn_update == n ]]; then

		        echo -e "$showok We won't update your system.\n$showexecute Starting Miner install..."

		elif [[ $yn_update == * ]]; then

		        echo "$showerror Possible options are y or n." && sys_update
		fi
	}
	sys_update

	if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ -z $(apt-cache policy linuxbrew-wrapper | grep Installed | grep none | awk '{print$2}' | sed s'/[()]//g') ]]; then echo "$showok linuxbrew-wrapper is already installed"; else sudo apt-get install -y linuxbrew-wrapper; fi fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ -z $(apt-cache policy build-essential | grep Installed | grep none | awk '{print$2}' | sed s'/[()]//g') ]]; then echo "$showok build-essential is already installed"; else sudo apt-get install -y build-essential; fi elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum group install -y "Development Tools"; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ $(which clang) == "/usr/bin/clang" ]]; then echo "$showok clang is already installed"; else sudo apt-get install -y clang; fi elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum install -y clang; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ -d $HOME/.nvm ]]; then echo "$showok NVM is already installed!"; elif [[ ! -d $HOME/.nvm ]]; then install_nvm; fi elif cat /etc/*release | grep -q -o -m 1 centos; then if [[ -d $HOME/.nvm ]]; then echo "$showok NVM is already installed!"; elif [[ ! -d $HOME/.nvm ]]; then install_nvm; fi fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian || cat /etc/*release | grep -q -o -m 1 centos; then if [[ ! -z $(which node-gyp) ]]; then echo "$showok node-gyp is already installed!"; else npm install -g node-gyp; fi fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian || cat /etc/*release | grep -q -o -m 1 centos; then if [[ ! -z $(which pm2) ]]; then echo "$showok pm2 is already installed!"; else npm install pm2 -g --unsafe-perm; fi fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.profile$stand"; fi elif cat /etc/*release | grep -q -o -m 1 centos; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.bash_profile$stand"; fi fi
	echo "$showexecute Running npm install..." && npm install
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.profile$stand"; fi elif cat /etc/*release | grep -q -o -m 1 Debian; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.profile$stand"; fi elif cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.profile$stand"; fi elif cat /etc/*release | grep -q -o -m 1 centos; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.bash_profile$stand"; fi fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then echo "$showinfo Run ${red}source ~/.profile$stand before stating miner."; elif cat /etc/*release | grep -q -o -m 1 Debian; then echo "$showinfo Run ${red}source ~/.profile$stand before starting miner."; elif cat /etc/*release | grep -q -o -m 1 Raspbian; then echo "$showinfo Run ${red}source ~/.profile$stand before starting miner."; elif cat /etc/*release | grep -q -o -m 1 centos; then echo "$showinfo Run ${red}source ~/.bash_profile$stand before starting miner."; fi

	echo "$showinfo You can now start your miner using: ${yellow}npm run commands$stand or ${yellow}SERVER_PORT=your_port npm run commands$stand (using custom port)"
	echo "$showinfo You should copy and unzip the blockchainDB3 backup to start SOLO mining instantly!"
	echo "$showinfo You can also start mining instantly in a POOL by entering: 10 and the POOL link."
else
	echo "$showerror You are not inside the Node-WebDollar folder."
	echo "$showinfo To install your miner, use this script inside the Node-WebDollar folder."
fi
###
