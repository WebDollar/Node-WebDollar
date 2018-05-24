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

### GENERAL VARS
getwebdnodefolder=$(find / -name Node-WebDollar)
getport80=$(iptables -L -n | grep -w 80 | awk 'NR==1{print$7}' | cut -d ':' -f2)
getport443=$(iptables -L -n | grep -w 443 | awk 'NR==1{print$7}' | cut -d ':' -f2)
getport8080=$(iptables -L -n | grep -w 8080 | awk 'NR==1{print$7}' | cut -d ':' -f2)
getport8081=$(iptables -L -n | grep -w 8081 | awk 'NR==1{print$7}' | cut -d ':' -f2)
getport8082=$(iptables -L -n | grep -w 8082 | awk 'NR==1{print$7}' | cut -d ':' -f2)
getiptpersist=$(apt-cache policy iptables-persistent | grep Installed | grep none | awk '{print$2}')
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
####

#### Dependencies check
function getipt(){
if [[ "$getiptpersist" == "(none)" ]]; then
	echo "$showinfo We need to install IPtables Persistent..."
	echo "$showinfo When asked, press YES to save your current IPtables settings."
	echo "$showinfo IPtables Persistent helps you keep IPT rules after a REBOOT."
	apt install iptables-persistent
else
	if [[ "$getiptpersist" == * ]]; then
		echo "$showok IPtables Persistent is already installed!"
	fi
fi
}
####

checkroot && getipt

apt update
apt upgrade
apt dist-upgrade

git clone https://github.com/WebDollar/Node-WebDollar.git Node-WebDollar


apt install linuxbrew-wrapper
apt install clang
apt install npm
apt install nodejs

npm install -g node-gyp
npm install pm2 -g --unsafe-perm


echo "$showinfo Setting IP Tables rules..."

if [[ "$getport80" == 80 ]]; then echo "$showwarning Port 80 is already accepted in Firewall!"; else if [[ ! "$getport80" == 80 ]]; then echo "$showdone Setting Firewall rule for PORT 80."; iptables -A INPUT -p tcp --dport 80 -j ACCEPT; fi fi # set port 80 firewall rule
if [[ "$getport443" == 443 ]]; then echo "$showwarning Port 443 is already accepted in Firewall!"; else if [[ ! "$getport443" == 443 ]]; then echo "$showdone Setting Firewall rule for PORT 443."; iptables -A INPUT -p tcp --dport 443 -j ACCEPT; fi fi # set port 443 firewall rule
if [[ "$getport8080" == 8080 ]]; then echo "$showwarning Port 8080 is already accepted in Firewall!"; else if [[ ! "$getport8080" == 8080 ]]; then echo "$showdone Setting Firewall rule for PORT 8080."; iptables -A INPUT -p tcp --dport 8080 -j ACCEPT; fi fi # set port 8080 firewall rule
if [[ "$getport8081" == 8081 ]]; then echo "$showwarning Port 8081 is already accepted in Firewall!"; else if [[ ! "$getport8081" == 8081 ]]; then echo "$showdone Setting Firewall rule for PORT 8081."; iptables -A INPUT -p tcp --dport 8081 -j ACCEPT; fi fi # set port 8081 firewall rule
if [[ "$getport8082" == 8082 ]]; then echo "$showwarning Port 8082 is already accepted in Firewall!"; else if [[ ! "$getport8082" == 8082 ]]; then echo "$showdone Setting Firewall rule for PORT 8082."; iptables -A INPUT -p tcp --dport 8082 -j ACCEPT; fi fi # set port 8082 firewall rule

echo "$showinfo Don't forget to FORWARD PORTS on your router!"

echo "$showinfo Changing folder to $getwebdnodefolder"

cd $getwebdnodefolder
sleep 1;
npm install

echo "$showinfo Now you may run sudo bash custom_start.sh"
echo "$showinfo If you don't have custom_start.sh script, run: "
echo "git clone https://github.com/cbusuioceanu/WebDollar-Node-Custom-Start.git"
echo "$showinfo sudo bash custom_start.sh"
echo "$showinfo Have fun. :)"


