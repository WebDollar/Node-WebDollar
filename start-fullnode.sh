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
terminalconn="$yellow[TERMINAL_CONNECTIONS]$stand"
browserconn="$yellow[BROWSER_CONNECTIONS]$stand"
ports="$yellow[PORTS]$stand"
##

### General VARS
fullnode_conf="../.fullnodeconf"
###

#### ROOT User Check
function checkroot(){
        if [[ $(id -u) = 0 ]]; then
                echo -e "$showinfo Checking for ROOT: ${green}PASSED${stand}"
        else
                echo -e "$showinfo Checking for ROOT: $showerror\\n${red}This Script Needs To Run Under ROOT user!${stand}"
                exit 0
        fi
}

#checkroot

function start_pm2node(){

if [[ $(cat package.json | grep "name" | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then

	echo "$showinfo We are inside a Node-WebDollar Folder"

	read -r -e -p "$showinput Do you want to start a pm2 instance in this $crnt_dir foler? (y or n): " startnodeyn

	if [[ "$startnodeyn" =~ ^(y|yes|Y|YES|Yes)$ ]]; then

		MAXIMUM_CONNECTIONS_FROM_BROWSER=$get_browser_conn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$get_term_conn SERVER_PORT=$readport pm2 start npm -- run start
		sleep 1;
		pm2 restart npm --name "$readport" --update-env
		sleep 3;

		echo "$showinfo Run ${white}pm2 log $readport$stand to check if the blockchain is loading."

	elif [[ "$startnodeyn" =~ ^(n|no|N|NO|No)$ ]]; then

		echo "$showinfo Ok. Bye."
		exit 0

	elif [[ "$startnodeyn" == "" ]]; then

		echo "$showerror Empty space is not an option."
		if [[ $nrofports == 1 ]]; then f_oneport; elif [[ $nrofports == 2 ]]; then f_twoports; elif [[ $nrofports == 3 ]]; then f_threeports; elif [[ $nrofports == 4 ]]; then f_fourports; elif [[ $nrofports == 5 ]]; then f_fiveports;  elif [[ $nrofports == 6 ]]; then f_sixports; fi

	elif [[ "$startnodeyn" == * ]]; then

		echo "$showerror Wrong option."
		if [[ $nrofports == 1 ]]; then f_oneport; elif [[ $nrofports == 2 ]]; then f_twoports; elif [[ $nrofports == 3 ]]; then f_threeports; elif [[ $nrofports == 4 ]]; then f_fourports; elif [[ $nrofports == 5 ]]; then f_fiveports;  elif [[ $nrofports == 6 ]]; then f_sixports; fi
	fi
else
	if [[ ! $(cat package.json | grep "name" | sed s'/[",]//g' | awk '{print $2}') == node-webdollar ]]; then

		echo "$showok We are outside of a Node-WebDollar Folder"
		echo -e "---Choose where to run PM2 instance\\n${cyan}$(ls -d -1 "$PWD"/** | grep 'Node-WebDollar')$stand\\n---"

		read -r -e -p "$showinput Enter the full location of the Node-WebDollar folder where you want to start the pm2 instance: " nodewebdloc

		if [[ -d $nodewebdloc ]]; then

			if cd "$nodewebdloc"; then echo "$showinfo Changing DIR to $yellow$(pwd)$stand"; else echo "$showerror Couldn't change DIR to $nodewebdloc"; fi
			echo "$showinfo Folder location changed to $nodewebdloc"

			MAXIMUM_CONNECTIONS_FROM_BROWSER=$get_browser_conn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$get_term_conn SERVER_PORT=$readport pm2 start npm -- run start
			sleep 1;
			pm2 restart npm --name "$readport" --update-env
			sleep 3;
			echo "$showinfo Run ${white}pm2 log $readport$stand to check if the blockchain is loading."
		else
			if [[ ! -d $nodewebdloc ]]; then
				echo "$showerror Folder location does not exist! Try again."
				if [[ $nrofports == 1 ]]; then f_oneport; elif [[ $nrofports == 2 ]]; then f_twoports; elif [[ $nrofports == 3 ]]; then f_threeports; elif [[ $nrofports == 4 ]]; then f_fourports; elif [[ $nrofports == 5 ]]; then f_fiveports;  elif [[ $nrofports == 6 ]]; then f_sixports; fi
			fi
		fi
	fi
fi
}

	if [[ -s $fullnode_conf ]]; then
	### VARS
	get_term_conn=$(grep TERM_CONN $fullnode_conf | cut -d '=' -f2)
	get_browser_conn=$(grep BROWSER_CONN $fullnode_conf | cut -d '=' -f2)
	###

		echo "$showok FULLNODE_CONF found! TERM_CONN=$green$get_term_conn$stand | BROWSER_CONN=$green$get_browser_conn$stand"

		read -r -e -p "$showinput How many $ports to you want to use for the full node (1,2,3,4,5 and 10 or $abortte): " nrofports
	else
		if [[ ! -s $fullnode_conf ]]; then

			echo "$showerror FULLNODE_CONF not found! Starting config..."

			read -r -e -p "$showinput How many $terminalconn do you want to offer (e.g.: 350 or $abortte): " readtermconn # this is a max_term_connections global setting that will apply for every pm2 instance.

			### Catch user input before anything - readtermconn
			if [[ "$readtermconn" =~ ^[[:digit:]]+$ ]]; then
				read -r -e -p "$showinput How many $browserconn do you want to offer (e.g.: 250 or $abortte): " readbrowserconn # if termconn is set ok, proceed to nr of browser_conn input # this is a max_browser_connections global setting that will apply for every pm2 instance.

				### Catch user input before anything - readbrowserconn
				if [[ "$readbrowserconn" =~ ^[[:digit:]]+$ ]]; then

					echo -e "TERM_CONN=$readtermconn\\nBROWSER_CONN=$readbrowserconn" > $fullnode_conf
					echo "$showok FULLNODE_CONF saved to $fullnode_conf"

					read -r -e -p "$showinput How many $ports to you want to use for the full node (1,2,3,4,5 and 10 or $abortte): " nrofports # if browser_conn is set ok, proceed to number of ports to be used

				elif [[ "$readbrowserconn" == "" ]]; then
					echo "$showerror No empty space allowed."
					exit 1

				elif [[ "$readbrowserconn" == abort ]]; then
					echo "$showinfo Okay. Bye."
					exit 0

				elif [[ "$readbrowserconn" == * ]]; then
					echo "$showerror Please enter how many connections you'll give for $browserconn"
					exit 1
				fi


			elif [[ "$readtermconn" == "" ]]; then
				echo "$showerror No empty space allowed."
				exit 1

			elif [[ "$readtermconn" == abort ]]; then
				echo "$showinfo Okay. Bye."
				exit 0

			elif [[ "$readtermconn" == * ]]; then
				echo "$showerror Please enter how many connections you'll give for $terminalconn"
				exit 1
			fi
		fi
	fi

### Start process
### Catch user input before anything - nrofports
if [[ "$nrofports" =~ ^[[:digit:]]+$ ]]; then

	if [[ "$nrofports" == 1 ]];then

	function f_oneport(){

		read -r -e -p "$showinput We'll use $nrofports port. Enter PORT number (e.g.: 8080 or $abortte): " readport

		if [[ "$readport" =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo Setting IP Table rule for PORT $readport"
			if [[ $(sudo iptables -nL | grep -w "$readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$readport" ]]; then echo "$showok Port $readport is already accepted in Firewall!"; elif [[ ! $(sudo iptables -nL | grep -w "$readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$readport" ]]; then echo "$showdone Setting Firewall rule for PORT $readport."; sudo iptables -A INPUT -p tcp --dport "$readport" -j ACCEPT; fi # set port firewall rule

			echo "$showinfo The system will use port $readport"

			crnt_dir=$(pwd)
			start_pm2node

		elif [[ "$readport" == abort ]]; then

			echo "$showinfo Ok. Bye." && exit 0
		else
			echo "$showerror Please enter a PORT number."
			f_oneport
		fi
	}
	f_oneport # function for one port pm2 start

	elif [[ "$nrofports" == 2 ]];then

	function f_twoports(){

		read -r -e -p "$showinput We'll use $nrofports ports. Enter PORT number (e.g.: 8080 8081): " readnrport2_0 readnrport2_1

		if [[ $readnrport2_0 =~ ^[[:digit:]]+$ && $readnrport2_1 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport2_0 and $readnrport2_1"

			for fw_readport in $readnrport2_0 $readnrport2_1;
			do
				if [[ $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showok Port $fw_readport is already accepted in Firewall!"; elif [[ ! $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showdone Setting Firewall rule for PORT $fw_readport."; sudo iptables -A INPUT -p tcp --dport "$fw_readport" -j ACCEPT; fi # set port firewall rule
			done

			for readport in $readnrport2_0 $readnrport2_1;
			do
				start_pm2node
				cd ..
			done
		else
			echo "$showerror Please enter $nrofports PORT numbers."
			f_twoports
		fi
	}
	f_twoports # function for two ports pm2 start

	elif [[ "$nrofports" == 3 ]];then

	function f_threeports(){

		read -r -e -p "$showinput We'll use $nrofports ports. Enter PORT number (e.g.: 8080 8081 8082): " readnrport3_0 readnrport3_1 readnrport3_2

		if [[ $readnrport3_0 =~ ^[[:digit:]]+$ && $readnrport3_1 =~ ^[[:digit:]]+$ && $readnrport3_2 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use three ports -> $readnrport3_0, $readnrport3_1 and $readnrport3_2"

			for fw_readport in $readnrport3_0 $readnrport3_1 $readnrport3_2;
			do
				if [[ $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showok Port $fw_readport is already accepted in Firewall!"; elif [[ ! $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showdone Setting Firewall rule for PORT $fw_readport."; sudo iptables -A INPUT -p tcp --dport "$fw_readport" -j ACCEPT; fi # set port firewall rule
			done

			for readport in $readnrport3_0 $readnrport3_1 $readnrport3_2;
			do
				start_pm2node
				cd ..
			done
		else
			echo "$showerror Please enter $nrofports PORT numbers."
			f_threeports
		fi
	}
	f_threeports # function three ports pm2 start

	elif [[ "$nrofports" == 4 ]];then

	function f_fourports(){

		read -r -e -p "$showinput We'll use $nrofports ports. Enter PORT number (e.g.: 8080 8081 8082 8083): " readnrport4_0 readnrport4_1 readnrport4_2 readnrport4_3

		if [[ $readnrport4_0 =~ ^[[:digit:]]+$ && $readnrport4_1 =~ ^[[:digit:]]+$ && $readnrport4_2 =~ ^[[:digit:]]+$ && $readnrport4_3 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport4_0, $readnrport4_1, $readnrport4_2, $readnrport4_3"

			for fw_readport in $readnrport4_0 $readnrport4_1 $readnrport4_2 $readnrport4_3;
			do
				if [[ $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showok Port $fw_readport is already accepted in Firewall!"; elif [[ ! $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showdone Setting Firewall rule for PORT $fw_readport."; sudo iptables -A INPUT -p tcp --dport "$fw_readport" -j ACCEPT; fi # set port firewall rule
			done

			for readport in $readnrport4_0 $readnrport4_1 $readnrport4_2 $readnrport4_3;
			do
				start_pm2node
				cd ..
			done
		else
			echo "$showerror Please enter $nrofports PORT numbers."
			f_fourports
		fi
	}
	f_fourports # function four ports pm2 start

	elif [[ "$nrofports" == 5 ]];then

	function f_fiveports(){

		read -r -e -p "$showinput We'll use $nrofports ports. Enter PORT number (e.g.: 8080 8081 8082 8083 8084): " readnrport5_0 readnrport5_1 readnrport5_2 readnrport5_3 readnrport5_4

		if [[ $readnrport5_0 =~ ^[[:digit:]]+$ && $readnrport5_1 =~ ^[[:digit:]]+$ && $readnrport5_2 =~ ^[[:digit:]]+$ && $readnrport5_3 =~ ^[[:digit:]]+$ && $readnrport5_4 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport5_0, $readnrport5_1, $readnrport5_2, $readnrport5_3 and $readnrport5_4"

			for fw_readport in $readnrport5_0 $readnrport5_1 $readnrport5_2 $readnrport5_3 $readnrport5_4;
			do
				if [[ $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showok Port $fw_readport is already accepted in Firewall!"; elif [[ ! $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showdone Setting Firewall rule for PORT $fw_readport."; sudo iptables -A INPUT -p tcp --dport "$fw_readport" -j ACCEPT; fi # set port firewall rule
			done

			for readport in $readnrport5_0 $readnrport5_1 $readnrport5_2 $readnrport5_3 $readnrport5_4;
			do
				start_pm2node
				cd ..
			done
		else
			echo "$showerror Please enter $nrofports PORT numbers."
			f_fiveports
		fi
	}
	f_fiveports # function five ports pm2 start

	elif [[ "$nrofports" == 10 ]];then

	function f_tenports(){

		read -r -e -p "$showinput We'll use $nrofports ports. Enter PORT number (e.g.: 8080 8081 8082 8083 8084 8085 etc): " readnrport10_0 readnrport10_1 readnrport10_2 readnrport10_3 readnrport10_4 readnrport10_5 readnrport10_6 readnrport10_7 readnrport10_8 readnrport10_9

		if [[ $readnrport10_0 =~ ^[[:digit:]]+$ && $readnrport10_1 =~ ^[[:digit:]]+$ && $readnrport10_2 =~ ^[[:digit:]]+$ && $readnrport10_3 =~ ^[[:digit:]]+$ && $readnrport10_4 =~ ^[[:digit:]]+$ && $readnrport10_5 =~ ^[[:digit:]]+$ && $readnrport10_6 =~ ^[[:digit:]]+$ && $readnrport10_7 =~ ^[[:digit:]]+$ && $readnrport10_8 =~ ^[[:digit:]]+$ && $readnrport10_9 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport10_0, $readnrport10_1, $readnrport10_2, $readnrport10_3,$readnrport10_4, $readnrport10_5, $readnrport10_6, $readnrport10_7, $readnrport10_8 and $readnrport10_9"

			for fw_readport in $readnrport10_0 $readnrport10_1 $readnrport10_2 $readnrport10_3 $readnrport10_4 $readnrport10_5 $readnrport10_6 $readnrport10_7 $readnrport10_8 $readnrport10_9;
			do
				if [[ $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showok Port $fw_readport is already accepted in Firewall!"; elif [[ ! $(sudo iptables -nL | grep -w "$fw_readport" | awk 'NR==1{print$7}' | cut -d ':' -f2) == "$fw_readport" ]]; then echo "$showdone Setting Firewall rule for PORT $fw_readport."; sudo iptables -A INPUT -p tcp --dport "$fw_readport" -j ACCEPT; fi # set port firewall rule
			done

			for readport in $readnrport10_0 $readnrport10_1 $readnrport10_2 $readnrport10_3 $readnrport10_4 $readnrport10_5 $readnrport10_6 $readnrport10_7 $readnrport10_8 $readnrport10_9;
			do
				start_pm2node
				cd ..
			done
		else
			echo "$showerror Please enter $nrofports PORT numbers."
			f_tenports
		fi
	}
	f_tenports # function ten ports pm2 start

	elif [[ "$nrofports" -gt 5 ]]; then
		echo "$showerror Sorry, max number of ports can be: 1,2,3,4,5 and 10."
		echo "$showinfo You can always run the script again with a new set of ports."
		exit 1
	fi

elif [[ "$nrofports" == "" ]]; then
	echo "$showerror No empty space allowed."
	exit 1

elif [[ "$nrofports" == abort ]]; then
	echo "$showinfo Okay. Bye."
	exit 0

elif [[ "$nrofports" == * ]]; then
	echo "$showerror Please enter a number from 1 to 5 or 10."
	exit 1
fi

if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo iptables-save; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo iptables-save; fi
