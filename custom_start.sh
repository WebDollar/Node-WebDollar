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
abortfm="$CYAN[abort for Menu]$STAND"
##

### VARS
port80="80"
port443="443"
port8080="8080"
port8081="8081"
port8082="8082"
###

#### ROOT User Check
function checkroot(){
        if [[ $(id -u) = 0 ]]; then
                echo -e "$showinfo Checking for ROOT: ${GREEN}PASSED${STAND}"
        else
                echo -e "$showinfo Checking for ROOT: $showerror\\n${RED}This Script Needs To Run Under ROOT user!${STAND}"
                exit 0
        fi
}

checkroot

read -e -p "$showinput How many ports to you want to use for the full node (from 1 to 5 or abort to exit.): " nrofports

if [[ "$nrofports" =~ ^[[:digit:]]+$ ]]; then

	case $nrofports in
		1) echo "$showinfo The system will use port 80.";
		   MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=80 INSTANCE_PREFIX=80 pm2 start  npm -- run start
		   sleep 1;
		   pm2 restart npm --name "80" --update-env
		   sleep 3;
		   echo "$showinfo Run pm2 dash to check if the blockchain is loading." ;;

		2) echo "$showinfo The system will use two ports. 80 and 443.";
		   for port in $port80 $port443;
		   do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start  npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		   done
		        echo "$showinfo Run pm2 dash to check if the blockchain is loading." ;;

		3) echo "$showinfo The system will use three ports. 80, 443 and 8080.";
		   for port in $port80 $port443 $port8080;
		   do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start  npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		   done
		        echo "$showinfo Run pm2 dash to check if the blockchain is loading." ;;

		4) echo "$showinfo The system will use four ports. 80, 443, 8080, 8081.";
		   for port in $port80 $port443 $port8080 $port8081;
		   do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start  npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		   done
		        echo "$showinfo Run pm2 dash to check if the blockchain is loading." ;;

		5) echo "$showinfo The system will use five ports. 80, 443, 8080, 8081, 8082.";
		   for port in $port80 $port443 $port8080 $port8081 $port8082;
		   do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start  npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		   done
		        echo "$showinfo Run pm2 dash to check if the blockchain is loading." ;;

		0) echo "$showerror I need a number from 1 to 5. Restarting..."; bash $0
	esac
else
	if [[ "$nrofports" == "" ]]; then
		echo "$showerror No empty space allowed."
		exit 1

	elif [[ "$nrofports" == abort ]]; then
		echo "$showinfo Okay. Bye."
		exit 0

	elif [[ "$nrofports" == * ]]; then
		echo "$showerror Please enter a number from 1 to 5."
		exit 1
	fi
fi
