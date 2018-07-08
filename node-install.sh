#!/bin/bash

#### COLOR SETTINGS ####
BLACK=$(tput setaf 0 && tput bold)
RED=$(tput setaf 1 && tput bold)
GREEN=$(tput setaf 2 && tput bold)
YELLOW=$(tput setaf 3 && tput bold)
BLUE=$(tput setaf 4 && tput bold)
MAGENTA=$(tput setaf 5 && tput bold)
CYAN=$(tput setaf 6 && tput bold)
WHITE=$(tput setaf 7 && tput bold)
BLACKbg=$(tput setab 0 && tput bold)
REDbg=$(tput setab 1 && tput bold)
GREENbg=$(tput setab 2 && tput bold)
YELLOWbg=$(tput setab 3 && tput bold)
BLUEbg=$(tput setab 4 && tput dim)
MAGENTAbg=$(tput setab 5 && tput bold)
CYANbg=$(tput setab 6 && tput bold)
WHITEbg=$(tput setab 7 && tput bold)
STAND=$(tput sgr0)

### System dialog VARS
showinfo="$GREEN[info]$STAND"
showerror="$RED[error]$STAND"
showexecute="$YELLOW[running]$STAND"
showok="$MAGENTA[OK]$STAND"
showdone="$BLUE[DONE]$STAND"
showinput="$CYAN[input]$STAND"
showwarning="$RED[warning]$STAND"
showremove="$GREEN[removing]$STAND"
shownone="$MAGENTA[none]$STAND"
redhashtag="$REDbg$WHITE#$STAND"
abortte="$CYAN[abort to Exit]$STAND"
showport="$YELLOW[PORT]$STAND"
##

#### ROOT User Check
function checkroot(){
	if [[ $(id -u) = 0 ]]; then
		echo -e "$showinfo Checking for ROOT: ${GREEN}PASSED${STAND}"
	else
		echo -e "$showinfo Checking for ROOT: $showerror\\n${RED}This Script Needs To Run Under ROOT user!${STAND}"
		exit 0
	fi
}
####
checkroot

### GENERAL VARS
getiptpersist=$(if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then echo "$(apt-cache policy iptables-persistent | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then echo "1"; fi fi)
getgit=$(if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then echo "$(apt-cache policy git | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then echo "$(yum list git | grep -o Installed)"; fi fi)
###

#### Dependencies START
function deps(){
if [[ "$getiptpersist" == "(none)" ]]; then
	echo "$showinfo We need to install IPtables Persistent"
	echo "$showinfo When asked, press YES to save your current IPtables settings."
	echo "$showinfo IPtables Persistent keeps your IPT rules after a REBOOT."
	if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y iptables-persistent; fi
else
	if [[ "$getiptpersist" == 1 ]]; then
		echo "$showok IPtables Persistent is not available for CentOS"
	else
		if [[ "$getiptpersist" == * ]]; then
			echo "$showok IPtables Persistent is already installed!"
		fi
	fi
fi

if [[ "$getgit" == "(none)" ]]; then
	echo "$showinfo We need to install Git"
	if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y git; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then yum install -y git; fi fi
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

if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt update; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then yum update; fi fi
if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt upgrade; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then yum upgrade; fi fi
if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo sudo apt install -y linuxbrew-wrapper; fi
if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo sudo apt install -y build-essential; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then yum group install -y "Development Tools"; fi fi
if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y clang; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then yum install -y clang; fi fi
if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash - && apt install -y nodejs; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash - && sudo yum -y install nodejs; fi fi
if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo npm install -g node-gyp; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then npm install -g node-gyp; fi fi
if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo npm install pm2 -g --unsafe-perm; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then sudo npm install pm2 -g --unsafe-perm ; fi fi

function ftconfig()
{

echo -e "-----\\n${WHITE}1. First time config - Create a WebDollar Full Node\\n2. Deploy clean WebDollar Full Nodes\\n3. Clone WebDollar Node \\n4. Exit$STAND"

read -e -p "$showinput Choose option: " readft ### Ask if this is the first time node configuration

if [[ "$readft" == 1 ]]; then

echo "$redhashtag If you will use more than one PORT (80, 8080 etc), please note that it's better to create multiple Node-WebDollar folders. $redhashtag"
echo "$redhashtag This way you can backup and restore the blockchainDB3 and deploy new PORTS whenever you want. $redhashtag"

read -e -p "$showinput How many nodes do you want to deploy? " readnrofnodes ### How many nodes will the user deploy

	if [[ "$readnrofnodes" == 0 ]]; then

		echo "$showerror You can't deploy 0 WebDollar Nodes."
		ftconfig

	elif [[ "$readnrofnodes" == "" ]]; then

		echo "$showerror Empty space is not a number."
		ftconfig

	elif [[ "$readnrofnodes" == * ]]; then

		echo "$showerror Only numbers are accepted."
		ftconfig
else
	if [[ "$readnrofnodes" =~ ^[[:digit:]]+$ ]]; then

		for ((nodes=1; nodes<=$readnrofnodes; nodes++));
		do
			git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar$nodes
			cd Node-WebDollar$nodes && npm install && cd ..
			echo "$showok Node-WebDollar$nodes Deployed successfully!"

		done
	fi
fi

echo "$showinfo Don't forget to FORWARD PORTS on your router!"
echo "$showinfo Now you may run sudo bash node-start.sh"

elif [[ "$readft" == 2 ]]; then

	function f_addmorenodes(){

	read -e -p "$showinfo Would you like to deploy more Nodes?(y or n): " readdeploy

	if [[ "$readdeploy" =~ ^(y|yes|Y|YES|Yes)$ ]]; then

		read -e -p "$showinfo How many Nodes do you want to deploy? " readnrofnodesdeploy

		if [[ "$readnrofnodesdeploy" =~ ^[[:digit:]]+$ ]]; then

			echo "$showexecute Deploying $readnrofnodesdeploy Nodes..."
			echo "$showinfo Current directory is $(pwd)"

			crnt_dir=$(pwd)
			countcurrentnodes=$(find / -name "Node-WebDollar[0-9]" | wc -l)
#			countcurrentnodes="7"  # this is for testing purposes only

			if [[ $(pwd | cut -d '/' -f4) =~ Node-WebDollar[0-9] ]]; then

				echo "$showinfo We are inside a Node-WebDollar Folder"
				cd .. && echo "$showinfo Location changed to $(pwd)"
				for ((i=$countcurrentnodes+1; i<=$countcurrentnodes+$readnrofnodesdeploy; i++));
				do
					git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar$i
					cd Node-WebDollar$i && npm install && cd ..
					echo "$showok Node-WebDollar$i Deployed successfully!"
				done
			else
				if [[ ! -n $(pwd | cut -d '/' -f4) ]]; then

					echo "$showok We are outside of a Node-WebDollar Folder"

					for ((i=$countcurrentnodes+1; i<=$countcurrentnodes+$readnrofnodesdeploy; i++));
					do
						git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar$i
						cd Node-WebDollar$i && npm install && cd $crnt_dir
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

	read -e -p "$showinfo Would you like to Clone a WebDollar Node?(y or n) " clonewebdnode

	if [[ "$clonewebdnode" =~ ^(y|yes|Y|YES|Yes)$ ]]; then

		read -e -p "$showinfo How many Nodes do you want to Clone? " deployclones

		echo "$showinfo Proceeding with WebDollar Node Cloning so you can use it on another $showport"

		if [[ "$deployclones" =~ ^[[:digit:]]+$ ]]; then

			echo "$showexecute Deploying $deployclones Nodes..."
			echo "$showinfo Current directory is $(pwd)"

			crnt_dir=$(pwd)
			countcurrentnodes=$(find / -name "Node-WebDollar[0-9]" | wc -l)
#			countcurrentnodes="7"  # this is for testing purposes only

			if [[ $(pwd | cut -d '/' -f4) =~ Node-WebDollar[0-9] ]]; then

				echo "$showinfo We are inside a Node-WebDollar Folder"
				cd .. && echo "$showinfo Location changed to $(pwd)"
				echo -e "---\\n${CYAN}$(ls)$STAND\\n---"

				read -e -p "$showinput Enter the full location for the Node-WebDollar you want to clone: " nodewebdloc

				if [[ -d $nodewebdloc ]]; then

					echo "$showinfo Entered folder location $showok"

					for ((i=$countcurrentnodes+1; i<=$countcurrentnodes+$deployclones; i++));
					do
						cp -r $nodewebdloc Node-WebDollar$i
						ls -la Node-WebDollar$i
						echo "$showok Node-WebDollar$i Deployed successfully @ $nodewebdloc/Node-WebDollar$i!"
					done
				else
					if [[ ! -d $nodewebdloc ]]; then
						echo "$showerror Folder location does not exist! Try again."
						f_clonewebdnode
					fi
				fi
			else
				if [[ ! -n $(pwd | cut -d '/' -f4) ]]; then

					echo "$showok We are outside of a Node-WebDollar Folder"
					echo -e "---\\n${CYAN}$(ls)$STAND\\n---"

					read -e -p "$showinput Enter the full location for the Node-WebDollar you want to clone: " nodewebdloc

					if [[ -d $nodewebdloc ]]; then

						echo "$showinfo Folder location $showok"

						for ((i=$countcurrentnodes+1; i<=$countcurrentnodes+$deployclones; i++));
						do
							cp -r $nodewebdloc Node-WebDollar$i
							ls -la Node-WebDollar$i
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

elif [[ "$readft" =~ ^(4|exit)$ ]]; then

	echo "$showinfo Okay. Bye."
	exit 0

elif [[ "$readft" == * ]]; then

	echo "$showerror Wrong option entered."
	ftconfig
fi
} # function ftconfig END

ftconfig
