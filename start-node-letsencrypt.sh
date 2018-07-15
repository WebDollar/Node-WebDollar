#!/bin/bash

# Fast and easy way to generate Let's Encrypt SSL certificates for Node-WebDollar
# If you got this script externally, make sure you run it inside the Node-WebDollar folder.

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

### GENERAL_VARS
which_certbot=$(which certbot)
get_certbot=$(if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then echo "$(apt-cache policy certbot | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then echo "$(yum list certbot | grep -o Available)"; fi fi)
is_port_80_used=$(netstat -tanp | grep -w ":80" | awk '{print $4}' | cut -d ':' -f4)
###

### Check if certbot is installed
function deps(){
if [[ "$get_certbot" == "(none)" ]]; then
        echo "$showinfo We need to Install CERTBOT"
        if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y certbot; fi
else
        if [[ "$get_certbot" == Available ]]; then

		if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then yum install -y certbot; fi
	else
	        if [[ "$get_certbot" == * ]]; then
        	        echo "$showok CERTBOT is already installed!"
	        fi
	fi
fi
}
deps

function generate_cert(){


# Check if PORT 80 is in use
if [[ $is_port_80_used == "" ]]; then

	read -e -p "$showinput Enter DOMAIN name: " DOMAIN

	if [[ "$DOMAIN" == "" ]]; then

	        echo "$showerror Empty space is not a DOMAIN!"
        	generate_cert

	elif [[ "$DOMAIN" == * ]]; then

	        read -e -p "$showinput Enter EMAIL: " EMAIL

        	if [[ "$EMAIL" == "" ]]; then
                	echo "$showerror Empty space is not an EMAIL!"
	                generate_cert

        	elif [[ "$EMAIL" == * ]]; then

                        echo "$showinfo PORT 80 not in use $showok"
                        echo "$showexecute Starting CERTBOT"
			$which_certbot certonly --text --non-interactive --rsa-key-size 4096 --agree-tos --expand --standalone --reinstall --email $EMAIL -d $DOMAIN

			rm -f certificates/private.key && ln -s /etc/letsencrypt/live/$DOMAIN/privkey.pem certificates/private.key
			rm -f certificates/certificate.crt && ln -s /etc/letsencrypt/live/$DOMAIN/cert.pem certificates/certificate.crt
			rm -f certificates/ca_bundle.crt && ln -s /etc/letsencrypt/live/$DOMAIN/chain.pem certificates/ca_bundle.crt
		fi
	fi
else
	if [[ $is_port_80_used == "80" ]]; then
	       	echo "$showerror PORT 80 is in use!"
		echo "$showinfo Please close the process that is using PORT 80 and try again. Usually this process is Apache."
        fi
fi
}

generate_cert
