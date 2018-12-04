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
##

### GENERAL VARS
getgit=$(if cat /etc/*release | grep -q -o -m 1 Ubuntu; then echo "$(apt-cache policy git | grep Installed | grep none | awk '{print$2}' | sed s'/[\(\)]//g')"; elif cat /etc/*release | grep -q -o -m 1 Debian; then echo "$(apt-cache policy git | grep Installed | grep none | awk '{print$2} | sed s'/[\(\)]//g'')"; elif cat /etc/*release | grep -q -o -m 1 centos; then echo "$(if yum list git | grep -q -o "Available Packages"; then echo "none"; else echo "Installed"; fi)"; fi)
###

#### Dependencies START
function deps(){
if [[ "$getgit" == "(none)" ]]; then
	echo "$showinfo We need to install Git"
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt install -y git; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get install -y git; elif cat /etc/*release | grep -q -o -m 1 centos; then yum install -y git; fi
else
	if [[ "$getgit" == Installed ]]; then
		echo "$showok Git is already installed!"
	else
		if [[ "$getgit" == * ]]; then
			echo "$showok Git is already installed!"
		fi
	fi
fi
}
#### Dependencies check END

deps # call deps function

if [[ $(cat package.json | grep "name" | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then

	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt update -y; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get update -y; elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum update -y; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt upgrade -y; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get upgrade -y; elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum upgrade -y; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt install -y linuxbrew-wrapper; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get install -y linuxbrew-wrapper; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt install -y build-essential; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get install -y build-essential; elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum group install -y "Development Tools"; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt install -y clang; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get install -y clang; elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum install -y clang; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then if [[ -d $HOME/.nvm ]]; then echo "$showok NVM is already installed!"; elif [[ ! -d $HOME/.nvm ]]; then curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && source ~/.profile && nvm install 8.2.1 && nvm use 8.2.1 && nvm alias default 8.2.1; fi \
	elif cat /etc/*release | grep -q -o -m 1 Debian; then if [[ -d $HOME/.nvm ]]; then echo "$showok NVM is already installed!"; elif [[ ! -d $HOME/.nvm ]]; then curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && source ~/.profile && nvm install 8.2.1 && nvm use 8.2.1 && nvm alias default 8.2.1; fi \
	elif cat /etc/*release | grep -q -o -m 1 centos; then if [[ -d $HOME/.nvm ]]; then echo "$showok NVM is already installed!"; elif [[ ! -d $HOME/.nvm ]]; then curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && source ~/.bash_profile && nvm install 8.2.1 && nvm use 8.2.1 && nvm alias default 8.2.1; fi fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then npm install -g node-gyp; elif cat /etc/*release | grep -q -o -m 1 Debian; then npm install -g node-gyp; elif cat /etc/*release | grep -q -o -m 1 centos; then npm install -g node-gyp; fi
	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then npm install pm2 -g --unsafe-perm; elif cat /etc/*release | grep -q -o -m 1 Debian; then npm install pm2 -g --unsafe-perm; elif cat /etc/*release | grep -q -o -m 1 centos; then npm install pm2 -g --unsafe-perm ; fi
	echo "$showexecute Running npm install..." && npm install
	echo "$showexecute Runing npm run build_browser..." && npm run build_browser && echo "$showexecute Runing npm run build_browser_user_interface..." && npm run build_browser_user_interface

	if cat /etc/*release | grep -q -o -m 1 Ubuntu; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.profile$stand"; fi elif cat /etc/*release | grep -q -o -m 1 Debian; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.profile$stand"; fi elif cat /etc/*release | grep -q -o -m 1 centos; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok..."; else echo "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.bash_profile$stand"; fi fi

	echo "$showinfo Current dir is $yellow$(pwd)$stand"
	if [[ $(ls -d vue-Frontend) == vue-Frontend ]]; then

		echo "$showinfo vue-Frontend is already present."
		function vue_upd() {
			read -r -e -p "$showinput Do you want to update vue-Frontend? (y or n): " yn_update

			if [[ "$yn_update" == [nN] ]]; then
				echo -e "$showinfo OK..."

			elif [[ "$yn_update" == [yY] ]]; then
				if cd vue-Frontend; then echo "$showexecute Changing dir to ${yellow}vue-Frontend$stand"; else echo "$showerror Couldn't cd to vue-Frontend folder!"; fi
       	        	        echo "$showexecute Updating vue-Frontend..." && git pull origin MiningPools && npm install
                        	echo "$showexecute Going back to Node-WebDollar folder..." && if cd ..; then echo "$showexecute Changing dir to ${yellow}$(pwd)$stand"; else echo "$showerror Couldn't cd back!"; fi

	                elif [[ "$yn_update" == * ]]; then
        	                echo -e "$showerror Possible options are: yY or nN."
				vue_upd
                	fi
		}
		vue_upd
	else
	        if [[ ! $(ls -d vue-Frontend) == vue-Frontend ]]; then
			echo "$showerror vue-Frontend not found inside Node-WebDollar!"
			echo "$showinfo Cloning vue-Frontend from WebDollar repository..."
			git clone https://github.com/WebDollar/vue-Frontend.git
			if cd vue-Frontend; then echo "$showexecute Changing dir to ${yellow}vue-Frontend$stand"; else echo "$showerror Couldn't cd to vue-Frontend folder!"; fi
			git checkout MiningPools
			npm install
			if cd ..; then echo "$showexecute Changing dir to ${yellow}$(pwd)$stand"; else echo "$showerror Couldn't cd back!"; fi

			if [[ $(cat package.json | grep "name" | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then
				echo "$showinfo We're inside a Node-WebDollar folder!"

				if [[ $(ls certificates/private.key) || $(ls certificates/certificate.crt) || $(ls certificates/ca_bundle.crt) ]]; then
					echo "$showexecute Copying SSL certificates to vue-Frontend..."
					echo "$showexecute Copying ${yellow}private.key$stand" && cp certificates/private.key "vue-Frontend/certificates/."
					echo "$showexecute Copying ${yellow}certificate.crt$stand" && cp certificates/certificate.crt "vue-Frontend/certificates/."
					echo "$showexecute Copying ${yellow}ca_bundle.crt$stand"&& cp certificates/ca_bundle.crt "vue-Frontend/certificates/."
				else
					echo "$showerror SSL certificates not found!"
					function letsenc() {
						read -r -e -p "$showinput Do you want to run ${yellow}start-node-letsencrypt.sh$stand? (y or n): " yn_letsenc

						if [[ $yn_letsenc == [nN] ]]; then
							echo -e "$showinfo OK..."

						elif [[ $yn_letsenc == [yY] ]]; then
							echo "$showexecute ${yellow}start-node-letsencrypt.sh$stand"
							bash start-node-letsencrypt.sh
							echo "$showexecute Copying SSL certificates to vue-Frontend..."
							echo "$showexecute Copying ${yellow}private.key$stand" && cp certificates/private.key "vue-Frontend/certificates/."
							echo "$showexecute Copying ${yellow}certificate.crt$stand" && cp certificates/certificate.crt "vue-Frontend/certificates/."
							echo "$showexecute Copying ${yellow}ca_bundle.crt$stand"&& cp certificates/ca_bundle.crt "vue-Frontend/certificates/."

					        elif [[ $yn_letsenc == * ]]; then
        	                			echo -e "$showerror Possible options are: yY or nN."
							letsenc
				        	fi
					}
					letsenc
				fi
			fi
		fi
	fi
else
	echo "$showerror You are not inside the Node-WebDollar folder."
	echo "$showinfo To install your POOL, use this script inside the Node-WebDollar folder."
fi
