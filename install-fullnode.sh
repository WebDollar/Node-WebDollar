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

### System dialog VARS
showinfo="${green}[info]$stand"
showerror="${red}[error]$stand"
showexecute="${yellow}[running]$stand"
showok="${magenta}[OK]$stand"
showdone="${blue}[DONE]$stand"
showinput="${cyan}[input]$stand"
showwarning="${red}[warning]$stand"
showremove="${green}[removing]$stand"
shownone="${magenta}[none]$stand"
redhashtag="${redbg}$white#$stand"
abortte="${cyan}[abort to Exit]$stand"
showport="${yellow}[PORT]$stand"
##

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
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
# shellcheck source=/dev/null
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then source ~/.profile; elif cat /etc/*release | grep -q -o -m 1 centos; then source ~/.bash_profile; fi
nvm install 8.2.1
nvm use 8.2.1
nvm alias default 8.2.1

}
###

### Look for iptables-persistent
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then

	if [[ $(sudo apt-cache policy iptables-persistent | grep none | awk '{print$2}' | sed s'/[()]//g') == none ]]; then

		function dep_ipt_p(){

			read -r -e -p "$showinput Do you want to install IPtables Persistent? This will keep your IPtables rules after reboot (y or n): " yn_iptp

			if [[ $yn_iptp == y ]]; then

				echo "$showinfo When asked, press YES to save your current IPtables settings."
				sudo apt-get install -y iptables-persistent

			elif [[ $yn_iptp == n ]]; then

				echo "$showok We won't install iptables-persistent."

			elif [[ $yn_iptp == * ]]; then

				echo "$showerror Possible options are y or n." && dep_ipt_p
			fi
		}
		dep_ipt_p
	else
		echo "$showok iptables-persistent is already installed!"
	fi


elif cat /etc/*release | grep -q -o -m 1 centos; then

	echo "$showinfo iptables-persistent NA on CentOS"

fi
###

### Look for git :)
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then

        if [[ $(apt-cache policy git | grep none | awk '{print$2}' | sed s'/[()]//g') == none ]]; then sudo apt-get install -y git; else echo "$showok Git is already installed!"; fi

elif cat /etc/*release | grep -q -o -m 1 centos; then

        if [[ $(yum list git | grep -o "Available Packages") == "Available Packages" ]]; then yum install -y git; else echo "$showok Git is already installed!"; fi

fi
###

### Look after curl :)
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then

        if [[ $(apt-cache policy curl | grep none | awk '{print$2}' | sed s'/[()]//g') == none ]]; then sudo apt-get install -y curl; else echo "$showok Curl is already installed!"; fi

elif cat /etc/*release | grep -q -o -m 1 centos; then

        if [[ $(yum list git | grep -o "Available Packages") == "Available Packages" ]]; then yum install -y curl; else echo "$showok Curl is already installed!"; fi

fi
###

### Look after python2.7 - yeah, blame node-gyp for that.
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then

        if [[ $(apt-cache policy python2.7 | grep none | awk '{print$2}' | sed s'/[()]//g') == none ]]; then sudo apt-get install -y python2.7; else echo "$showok python2.7 is already installed!"; fi

elif cat /etc/*release | grep -q -o -m 1 centos; then

        if [[ $(yum list python2.7 | grep -o "Available Packages") == "Available Packages" ]]; then yum install -y python2.7; else echo "$showok python2.7 is already installed!"; fi

fi
###

### System update
function sys_update(){

	read -r -e -p "$showinput Would you like to update your Linux System? It's recommended (y or n): " yn_update

	if [[ $yn_update == y ]]; then

		if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt update -y && sudo apt upgrade -y; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt-get update -y && sudo apt upgrade -y; elif cat /etc/*release | grep -q -o -m 1 Raspbian; then sudo apt-get update -y && sudo apt upgrade -y; elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum update -y; fi

	elif [[ $yn_update == n ]]; then

		echo "$showok We won't update your system."

	elif [[ $yn_update == * ]]; then

		echo "$showerror Possible options are y or n." && sys_update
	fi
}
###
sys_update

if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ -z $(apt-cache policy linuxbrew-wrapper | grep Installed | grep none | awk '{print$2}' | sed s'/[()]//g') ]]; then echo "$showok linuxbrew-wrapper is already installed"; else sudo apt-get install -y linuxbrew-wrapper; fi fi
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ -z $(apt-cache policy build-essential | grep Installed | grep none | awk '{print$2}' | sed s'/[()]//g') ]]; then echo "$showok build-essential is already installed"; else sudo apt-get install -y build-essential; fi elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum group install -y "Development Tools"; fi
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ $(which clang) == "/usr/bin/clang" ]]; then echo "$showok clang is already installed"; else sudo apt-get install -y clang; fi elif cat /etc/*release | grep -q -o -m 1 centos; then sudo yum install -y clang; fi
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ -d $HOME/.nvm ]]; then echo "$showok NVM is already installed!"; elif [[ ! -d $HOME/.nvm ]]; then install_nvm; fi elif cat /etc/*release | grep -q -o -m 1 centos; then if [[ -d $HOME/.nvm ]]; then echo "$showok NVM is already installed!"; elif [[ ! -d $HOME/.nvm ]]; then install_nvm; fi fi
# shellcheck disable=SC2236
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian || cat /etc/*release | grep -q -o -m 1 centos; then if [[ ! -z $(which node-gyp) ]]; then echo "$showok node-gyp is already installed!"; else npm install -g node-gyp; fi fi
# shellcheck disable=SC2236
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian || cat /etc/*release | grep -q -o -m 1 centos; then if [[ ! -z $(which pm2) ]]; then echo "$showok pm2 is already installed!"; else npm install pm2 -g --unsafe-perm; fi fi
if cat /etc/*release | grep -q -o -m 1 Ubuntu || cat /etc/*release | grep -q -o -m 1 Debian || cat /etc/*release | grep -q -o -m 1 Raspbian; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok!"; else echo -e "$showwarning ${red}MANDATORY$stand: execute ${yellow}source ~/.profile$stand\n$showinfo Start script again after command execution." && exit 0; fi elif cat /etc/*release | grep -q -o -m 1 centos; then if [[ $(node --version) ]]; then echo "$showok NVM sourced ok!"; else echo -e "$showinfo ${red}MANDATORY$stand: execute ${yellow}source ~/.bash_profile$stand\n$showinfo Start script again after command execution."; fi fi

function ftconfig()
{

echo -e "-----\\n${white}1. First time config - Create a WebDollar Full Node\\n2. Deploy clean WebDollar Full Nodes\\n3. Clone WebDollar Node \\n4. Exit$stand"

read -r -e -p "$showinput Choose option: " readft ### Ask if this is the first time node configuration

if [[ "$readft" == 1 ]]; then

echo "$redhashtag If you will use more than one PORT (80, 8080 etc), please note that it's better to create multiple Node-WebDollar folders. $redhashtag"
echo "$redhashtag This way you can backup and restore the blockchainDB3 and deploy new PORTS whenever you want. $redhashtag"

read -r -e -p "$showinput How many nodes do you want to deploy? " readnrofnodes ### How many nodes will the user deploy

	if [[ "$readnrofnodes" == 0 ]]; then

		echo "$showerror You can't deploy 0 WebDollar Nodes."
		ftconfig

	elif [[ "$readnrofnodes" == "" ]]; then

		echo "$showerror Empty space is not a number."
		ftconfig

	elif [[ "$readnrofnodes" =~ ^[[:digit:]]+$ ]]; then

		for ((nodes=1; nodes<=readnrofnodes; nodes++));
		do
			if [[ ! -d Node-WebDollar1 ]]; then
				git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar"$nodes"
				cd Node-WebDollar"$nodes" && npm install && cd ..
				echo "$showok Node-WebDollar$nodes Deployed successfully!"
			else
				echo "$showwarning Node-WebDollar1 is already deployed!"
			fi
		done

	elif [[ "$readnrofnodes" == * ]]; then

		echo "$showerror Only numbers are accepted."
		ftconfig

fi

echo "$showinfo Don't forget to FORWARD PORTS on your router!"
echo "$showinfo Now you may run sudo bash node-start.sh"

elif [[ "$readft" == 2 ]]; then

	function f_addmorenodes(){

	read -r -e -p "$showinfo Would you like to deploy more Nodes?(y or n): " readdeploy

	if [[ "$readdeploy" =~ ^(y|yes|Y|YES|Yes)$ ]]; then

		read -r -e -p "$showinfo How many Nodes do you want to deploy? " readnrofnodesdeploy

		if [[ "$readnrofnodesdeploy" =~ ^[[:digit:]]+$ ]]; then

			echo "$showexecute Deploying $readnrofnodesdeploy Nodes..."
			echo "$showinfo Current directory is $(pwd)"

			crnt_dir=$(pwd)
			countcurrentnodes=$(sudo find / -name "Node-WebDollar[0-9]" | wc -l)
#			countcurrentnodes="7"  # this is for testing purposes only

			if [[ $(grep "name" package.json | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then

				echo "$showinfo We are inside a Node-WebDollar Folder"
				cd .. && echo "$showinfo Location changed to $(pwd)"
				for ((i=countcurrentnodes+1; i<=countcurrentnodes+readnrofnodesdeploy; i++));
				do
					git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar"$i"
					cd Node-WebDollar"$i" && npm install && cd ..
					echo "$showok Node-WebDollar$i Deployed successfully!"
				done
			else
				if [[ ! $(grep "name" package.json | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then
					echo "$showok We are outside of a Node-WebDollar Folder"

					for ((i=countcurrentnodes+1; i<=countcurrentnodes+readnrofnodesdeploy; i++));
					do
						git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar"$i"
						cd Node-WebDollar"$i" && npm install && if cd "$crnt_dir"; then echo "$showinfo Current DIR changed to $(pwd)"; else echo "$showerror Couldn't change DIR to $crnt_dir!"; fi
						echo "$showok Node-WebDollar$i Deployed successfully!"
					done
				fi
			fi

		elif [[ "$readnrofnodesdeploy" == "" ]]; then

			echo "$showerror Empty space is not an option."
			f_addmorenodes

		elif [[ "$readnrofnodesdeploy" == abort ]]; then

		        echo "$showinfo Okay. Bye."
		        exit 0

		elif [[ "$readnrofnodesdeploy" == * ]]; then

		        echo "$showerror Only numbers are accepted."
        		f_addmorenodes
		fi

	elif [[ "$readdeploy" =~ ^(n|no|N|NO|No)$ ]]; then

		echo "$showinfo Ok. Bye."
		exit 0

	elif [[ "$readdeploy" == "" ]]; then

		echo "$showerror Empty space is not an option."
		f_addmorenodes

	elif [[ "$readdeploy" == * ]]; then

	        echo "$showerror Enter y or n."
       		f_addmorenodes


	fi
	}
	f_addmorenodes # deploy more clean nodes function

elif [[ "$readft" == 3 ]]; then

	function f_clonewebdnode(){

	read -r -e -p "$showinfo Would you like to Clone a WebDollar Node?(y or n) " clonewebdnode

	if [[ "$clonewebdnode" =~ ^(y|yes|Y|YES|Yes)$ ]]; then

		read -r -e -p "$showinfo How many Nodes do you want to Clone? " deployclones

		echo "$showinfo Proceeding with WebDollar Node Cloning so you can use it on another $showport"

		if [[ "$deployclones" =~ ^[[:digit:]]+$ ]]; then

			echo "$showexecute Deploying $deployclones Nodes..."
			echo "$showinfo Current directory is $(pwd)"

			crnt_dir=$(pwd)
			countcurrentnodes=$(sudo find / -name "Node-WebDollar[0-9]" | wc -l)
#			countcurrentnodes="7"  # this is for testing purposes only

			if [[ $(grep "name" package.json | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then

				echo "$showinfo We are inside a Node-WebDollar Folder"
				cd .. && echo "$showinfo Location changed to $(pwd)"
				echo -e "---\\n${cyan}$(ls)$stand\\n---"

				read -r -e -p "$showinput Enter the full location for the Node-WebDollar you want to clone: " nodewebdloc

				if [[ -d $nodewebdloc ]]; then

					echo "$showinfo Entered folder location $showok"

					for ((i=countcurrentnodes+1; i<=countcurrentnodes+deployclones; i++));
					do
						cp -r "$nodewebdloc" Node-WebDollar"$i"
						ls -la Node-WebDollar"$i"
						echo "$showok Node-WebDollar$i Deployed successfully @ $nodewebdloc/Node-WebDollar$i!"
					done
				else
					if [[ ! -d $nodewebdloc ]]; then
						echo "$showerror Folder location does not exist! Try again."
						f_clonewebdnode
					fi
				fi
			else
				if [[ ! $(grep "name" package.json | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then

					echo "$showok We are outside of a Node-WebDollar Folder"
					echo -e "---\\n${cyan}$(ls)$stand\\n---"

					read -r -e -p "$showinput Enter the full location for the Node-WebDollar you want to clone: " nodewebdloc

					if [[ -d $nodewebdloc ]]; then

						echo "$showinfo Folder location $showok"

						for ((i=countcurrentnodes+1; i<=countcurrentnodes+deployclones; i++));
						do
							cp -r "$nodewebdloc" Node-WebDollar"$i"
							ls -la Node-WebDollar"$i"
							echo "$showok Node-WebDollar$i Deployed successfully @ $nodewebdloc/Node-WebDollar$i!"
						done
					else

						if [[ ! -d $nodewebdloc ]]; then
							echo "$showerror Folder location does not exist! Try again."
							f_clonewebdnode
						fi
					fi
				fi
			fi

		elif [[ "$deployclones" == "" ]]; then

			echo "$showerror Empty space is not an option."
			f_clonewebdnode

		elif [[ "$deployclones" == abort ]]; then

		        echo "$showinfo Okay. Bye."
		        exit 0

		elif [[ "$deployclones" == * ]]; then

		        echo "$showerror Only numbers are accepted."
        		f_clonewebdnode
		fi

	elif [[ "$clonewebdnode" =~ ^(n|no|N|NO|No)$ ]]; then

		echo "$showinfo Ok. Bye."
		exit 0

	elif [[ "$clonewebdnode" == "" ]]; then

		echo "$showerror Empty space is not an option."
		f_clonewebdnode

	elif [[ "$clonewebdnode" == * ]]; then

		echo "$showerror Wrong option."
		f_clonewebdnode

	fi
	}
	f_clonewebdnode # node-webdollar clone function

elif [[ "$readft" =~ ^(4|q)$ ]]; then

	echo "$showinfo Okay. Bye."
	exit 0

elif [[ "$readft" == * ]]; then

	echo "$showerror Wrong option entered."
	ftconfig
fi
} # function ftconfig END

ftconfig