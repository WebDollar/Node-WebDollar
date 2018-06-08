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
terminalconn="$YELLOW[TERMINAL_CONNECTIONS]$STAND"
browserconn="$YELLOW[BROWSER_CONNECTIONS]$STAND"
ports="$YELLOW[PORTS]$STAND"
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

read -e -p "$showinput How many $terminalconn do you want to offer (e.g.: 350 or $abortte): " readtermconn # this is a max_term_connections global setting that will apply for every pm2 instance.

### Catch user input before anything - readtermconn
if [[ "$readtermconn" =~ ^[[:digit:]]+$ ]]; then
	read -e -p "$showinput How many $browserconn do you want to offer (e.g.: 250 or $abortte): " readbrowserconn # if termconn is set ok, proceed to nr of browser_conn input # this is a max_browser_connections global setting that will apply for every pm2 instance.

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
###


### Catch user input before anything - readbrowserconn
if [[ "$readbrowserconn" =~ ^[[:digit:]]+$ ]]; then
	read -e -p "$showinput How many $ports to you want to use for the full node (from 1 to 6 or $abortte): " nrofports # if browser_conn is set ok, proceed to nr of ports input

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
###

### Start process
### Catch user input before anything - nrofports
if [[ "$nrofports" =~ ^[[:digit:]]+$ ]]; then

	if [[ "$nrofports" == 1 ]];then

		read -e -p "$showinput We'll use $nrofports port. Enter number (e.g.: 80 or $abortte): " readnrport1

		if [[ $readnrport1 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use port $readnrport1";

			MAXIMUM_CONNECTIONS_FROM_BROWSER=$readbrowserconn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$readtermconn SERVER_PORT=$readnrport1 INSTANCE_PREFIX=$readnrport1 pm2 start npm -- run start
			sleep 1;
			pm2 restart npm --name "$readnrport1" --update-env
			sleep 3;

			echo "$showinfo Run pm2 dash to check if the blockchain is loading."
		elif [[ $readnrport1 == abort ]]; then

			echo "$showinfo Ok, bye." && exit 0
		else
			echo "$showerror Please enter a PORT number."
		fi

	elif [[ "$nrofports" == 2 ]];then

		read -e -p "$showinput We'll use $nrofports ports. Enter number (e.g.: 80 8080): " readnrport2_0 readnrport2_1

		if [[ $readnrport2_0 =~ ^[[:digit:]]+$ && $readnrport2_1 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport2_0 and $readnrport2_1"

			for port in $readnrport2_0 $readnrport2_1;
			do
				MAXIMUM_CONNECTIONS_FROM_BROWSER=$readbrowserconn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$readtermconn SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
	                        sleep 1;
        	                pm2 restart npm --name "$port" --update-env
				sleep 3;
			done
				echo "$showinfo Run pm2 dash to check if the blockchain is loading."
		else
			echo "$showerror Please enter $nrofports PORT numbers."
		fi

	elif [[ "$nrofports" == 3 ]];then

		read -e -p "$showinput We'll use $nrofports ports. Enter number (e.g.: 80 8080 8081): " readnrport3_0 readnrport3_1 readnrport3_2

		if [[ $readnrport3_0 =~ ^[[:digit:]]+$ && $readnrport3_1 =~ ^[[:digit:]]+$ && $readnrport3_2 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use three ports -> $readnrport3_0, $readnrport3_1 and $readnrport3_2"

			for port in $readnrport3_0 $readnrport3_1 $readnrport3_2;
			do
				MAXIMUM_CONNECTIONS_FROM_BROWSER=$readbrowserconn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$readtermconn SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
	                        sleep 1;
        	                pm2 restart npm --name "$port" --update-env
				sleep 3;
			done
				echo "$showinfo Run pm2 dash to check if the blockchain is loading."
		else
			echo "$showerror Please enter $nrofports PORT numbers."
		fi

	elif [[ "$nrofports" == 4 ]];then

		read -e -p "$showinput We'll use $nrofports ports. Enter number (e.g.: 80 8080 8081 8082): " readnrport4_0 readnrport4_1 readnrport4_2 readnrport4_3

		if [[ $readnrport4_0 =~ ^[[:digit:]]+$ && $readnrport4_1 =~ ^[[:digit:]]+$ && $readnrport4_2 =~ ^[[:digit:]]+$ && $readnrport4_3 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport4_0, $readnrport4_1, $readnrport4_2, $readnrport4_3"

			for port in $readnrport4_0 $readnrport4_1 $readnrport4_2 $readnrport4_3;
			do
				MAXIMUM_CONNECTIONS_FROM_BROWSER=$readbrowserconn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$readtermconn SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
	                        sleep 1;
        	                pm2 restart npm --name "$port" --update-env
				sleep 3;
			done
				echo "$showinfo Run pm2 dash to check if the blockchain is loading."
		else
			echo "$showerror Please enter $nrofports PORT numbers."
		fi

	elif [[ "$nrofports" == 5 ]];then

		read -e -p "$showinput We'll use $nrofports ports. Enter number (e.g.: 80 8080 8081 8082 8083): " readnrport5_0 readnrport5_1 readnrport5_2 readnrport5_3 readnrport5_4

		if [[ $readnrport5_0 =~ ^[[:digit:]]+$ && $readnrport5_1 =~ ^[[:digit:]]+$ && $readnrport5_2 =~ ^[[:digit:]]+$ && $readnrport5_3 =~ ^[[:digit:]]+$ && $readnrport5_4 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport5_0, $readnrport5_1, $readnrport5_2, $readnrport5_3 and $readnrport5_4"

			for port in $readnrport5_0 $readnrport5_1 $readnrport5_2 $readnrport5_3 $readnrport5_4;
			do
				MAXIMUM_CONNECTIONS_FROM_BROWSER=$readbrowserconn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$readtermconn SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
                	        sleep 1;
	                        pm2 restart npm --name "$port" --update-env
				sleep 3;
			done
			        echo "$showinfo Run pm2 dash to check if the blockchain is loading."
		else
			echo "$showerror Please enter $nrofports PORT numbers."
		fi

	elif [[ "$nrofports" == 6 ]];then

		read -e -p "$showinput We'll use $nrofports ports. Enter number (e.g.: 80 8080 8081 8082 8083 8084): " readnrport6_0 readnrport6_1 readnrport6_2 readnrport6_3 readnrport6_4 readnrport6_5

		if [[ $readnrport6_0 =~ ^[[:digit:]]+$ && $readnrport6_1 =~ ^[[:digit:]]+$ && $readnrport6_2 =~ ^[[:digit:]]+$ && $readnrport6_3 =~ ^[[:digit:]]+$ && $readnrport6_4 =~ ^[[:digit:]]+$ && $readnrport6_5 =~ ^[[:digit:]]+$ ]]; then

			echo "$showinfo The system will use $nrofports ports -> $readnrport6_0, $readnrport6_1, $readnrport6_2, $readnrport6_3, $readnrport6_4 and $readnrport6_5"

			for port in $readnrport6_0 $readnrport6_1 $readnrport6_2 $readnrport6_3 $readnrport6_4 $readnrport6_5;
			do
				MAXIMUM_CONNECTIONS_FROM_BROWSER=$readbrowserconn MAXIMUM_CONNECTIONS_FROM_TERMINAL=$readtermconn SERVER_PORT=$port INSTANCE_PREFIX=$port pm2 start npm -- run start
                	        sleep 1;
	                        pm2 restart npm --name "$port" --update-env
				sleep 3;
			done
			        echo "$showinfo Run pm2 dash to check if the blockchain is loading."
		else
			echo "$showerror Please enter $nrofports PORT numbers."
		fi

	elif [[ "$nrofports" -gt 6 ]]; then
		echo "$showerror Sorry, only 6 ports supported for now."
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
	echo "$showerror Please enter a number from 1 to 6."
	exit 1
fi
