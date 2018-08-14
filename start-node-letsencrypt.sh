#!/bin/bash

# Fast and easy way to generate Let's Encrypt SSL certificates for Node-WebDollar
# If you got this script externally, make sure you run it inside the Node-WebDollar folder.

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

### GENERAL_VARS
which_certbot=$(which certbot)
get_certbot=$(if cat /etc/*release | grep -q -o -m 1 Ubuntu; then echo "$(apt-cache policy certbot | grep Installed | grep none | awk '{print$2}' | sed s'/[()]//g')"; elif cat /etc/*release | grep -q -o -m 1 Debian; then echo "$(apt-cache policy certbot | grep Installed | grep none | awk '{print$2}' | sed s'/[()]//g')"; elif cat /etc/*release | grep -q -o -m 1 centos; then echo "$(yum list certbot | grep -q -o "Available Packages"; then echo "none"; else echo "Installed"; fi)"; fi)
is_port_80_used=$(sudo netstat -tanp | grep -w ":80" | awk '{print $4}' | cut -d ':' -f4)
get_user=$(whoami)
###

### Check if certbot is installed
function deps(){
if [[ "$get_certbot" == "none" ]]; then
        echo "$showinfo We need to Install CERTBOT"
        if cat /etc/*release | grep -q -o -m 1 Ubuntu; then sudo apt install -y software-properties-common && sudo add-apt-repository ppa:certbot/certbot && sudo apt update && sudo apt-get install certbot; elif cat /etc/*release | grep -q -o -m 1 Debian; then sudo apt install -y certbot; elif cat /etc/*release | grep -q -o -m 1 centos; then yum install -y certbot; fi
else
        if [[ "$get_certbot" == * ]]; then
       	        echo "$showok CERTBOT is already installed!"
        fi
fi
}
deps

function generate_cert(){

# Check if PORT 80 is in use
if [[ $is_port_80_used == "" ]]; then

	read -r -e -p "$showinput Enter DOMAIN name: " DOMAIN

	if [[ "$DOMAIN" == "" ]]; then

	        echo "$showerror Empty space is not a DOMAIN!"
        	generate_cert

	elif [[ "$DOMAIN" == * ]]; then

	        read -r -e -p "$showinput Enter EMAIL: " EMAIL

        	if [[ "$EMAIL" == "" ]]; then
                	echo "$showerror Empty space is not an EMAIL!"
	                generate_cert

        	elif [[ "$EMAIL" == * ]]; then

                        echo "$showinfo PORT 80 not in use $showok"
                        echo "$showexecute Starting CERTBOT"
			sudo "$which_certbot" certonly --text --non-interactive --rsa-key-size 4096 --agree-tos --expand --standalone --reinstall --email "$EMAIL" -d "$DOMAIN"


			rm -f certificates/private.key && sudo cp /etc/letsencrypt/live/"$DOMAIN"/privkey.pem certificates/private.key && sudo chown "$get_user":"$get_user" certificates/private.key && echo "$showok ${yellow}private.key$stand copied to certificates/private.key"
			rm -f certificates/certificate.crt && sudo cp /etc/letsencrypt/live/"$DOMAIN"/cert.pem certificates/certificate.crt && sudo chown "$get_user":"$get_user" certificates/certificate.crt && echo "$showok ${yellow}certificate.crt$stand copied to certificates/certificate.crt"
			rm -f certificates/ca_bundle.crt && sudo cp /etc/letsencrypt/live/"$DOMAIN"/chain.pem certificates/ca_bundle.crt && sudo chown "$get_user":"$get_user" certificates/ca_bundle.crt && echo "$showok ${yellow}ca_bundle.crt$stand copied to certificates/ca_bundle.crt"
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
