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

	if [[ "$nrofports" == 1 ]];then

		read -e -p "$showinput We'll use one port. Enter number (e.g.: 80): " readnrport1

		echo "$showinfo The system will use port $readnrport1";

		MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$readnrport1 INSTANCE_PREFIX=$readnrport1 pm2 start npm -- run start
		sleep 1;
		pm2 restart npm --name "$readnrport1" --update-env
		sleep 3;

		echo "$showinfo Run pm2 dash to check if the blockchain is loading."

	elif [[ "$nrofports" == 2 ]];then

		read -e -p "$showinput We'll use two ports. Enter number (e.g.: 80 8080): " readnrport2_0 readnrport2_1

		echo "$showinfo The system will use two ports. $readnrport2_0 and $readnrport2_1"

		for port in $readnrport2_0 $readnrport2_1;
		do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		done
			echo "$showinfo Run pm2 dash to check if the blockchain is loading."

	elif [[ "$nrofports" == 3 ]];then

		read -e -p "$showinput We'll use three ports. Enter number (e.g.: 80 8080 8081): " readnrport3_0 readnrport3_1 readnrport3_2

		echo "$showinfo The system will use three ports. $readnrport3_0, $readnrport3_1 and $readnrport3_2"

		for port in $readnrport3_0 $readnrport3_1 $readnrport3_2;
		do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		done
			echo "$showinfo Run pm2 dash to check if the blockchain is loading."

	elif [[ "$nrofports" == 4 ]];then

		read -e -p "$showinput We'll use four ports. Enter number (e.g.: 80 8080 8081 8082): " readnrport4_0 readnrport4_1 readnrport4_2 readnrport4_3

		echo "$showinfo The system will use four ports. $readnrport4_0, $readnrport4_1, $readnrport4_2, $readnrport4_3"

		for port in $readnrport4_0 $readnrport4_1 $readnrport4_2 $readnrport4_3;
		do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		done
			echo "$showinfo Run pm2 dash to check if the blockchain is loading."

	elif [[ "$nrofports" == 5 ]];then

		read -e -p "$showinput We'll use five ports. Enter number (e.g.: 80 8080 8081 8082 8083): " readnrport5_0 readnrport5_1 readnrport5_2 readnrport5_3 readnrport5_4

		echo "$showinfo The system will use five ports. $readnrport5_0, $readnrport5_1, $readnrport5_2, $readnrport5_3 and $readnrport5_4"
		for port in $readnrport5_0 $readnrport5_1 $readnrport5_2 $readnrport5_3 $readnrport5_4;
		do
			MAXIMUM_CONNECTIONS_FROM_BROWSER=450 MAXIMUM_CONNECTIONS_FROM_TERMINAL=100 SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
                        sleep 1;
                        pm2 restart npm --name "$port" --update-env
			sleep 3;
		done
		        echo "$showinfo Run pm2 dash to check if the blockchain is loading."
	fi
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
