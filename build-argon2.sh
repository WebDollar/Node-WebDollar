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
blakbg=$(tput setab 0 && tput bold)
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
get_const_global="src/consts/const_global.js"
get_libtool=$(if grep -q -o -m 1 Ubuntu /etc/*release; then apt-cache policy libtool | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 Debian /etc/*release; then apt-cache policy libtool | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 centos /etc/*release; then yum list libtool | grep -o Installed; fi)
get_autoconf=$(if grep -q -o -m 1 Ubuntu /etc/*release; then apt-cache policy autoconf | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 Debian /etc/*release; then apt-cache policy autoconf | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 centos /etc/*release; then yum list autoconf | grep -o Installed; fi)
get_cmake=$(if grep -q -o -m 1 Ubuntu /etc/*release; then apt-cache policy cmake | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 Debian /etc/*release; then apt-cache policy cmake | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 centos /etc/*release; then yum list cmake | grep -o Installed; fi)
get_psmisc=$(if grep -q -o -m 1 Ubuntu /etc/*release; then apt-cache policy psmisc | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 Debian /etc/*release; then apt-cache policy psmisc | grep Installed | grep none | awk '{print$2}'; elif grep -q -o -m 1 centos /etc/*release; then yum list psmisc | grep -o Installed; fi)
###

#### Dependencies START
function deps() {
if [[ "$get_libtool" == "(none)" ]]; then
	echo "$showinfo We need to install ${blue}libtool$stand"
	if grep -q -o -m 1 Ubuntu /etc/*release; then sudo apt install -y libtool; elif grep -q -o -m 1 Debian /etc/*release; then sudo apt-get install -y libtool; elif grep -q -o -m 1 centos /etc/*release; then sudo yum install -y libtool; fi
else
	if [[ "$get_libtool" == * ]]; then
		echo "$showok ${blue}libtool$stand is already installed!"
	fi
fi
if [[ "$get_autoconf" == "(none)" ]]; then
        echo "$showinfo We need to install ${blue}autoconf$stand"
        if grep -q -o -m 1 Ubuntu; then sudo apt install -y autoconf; elif grep -q -o -m 1 Debian /etc/*release; then sudo apt-get install -y autoconf; elif grep -q -o -m 1 centos /etc/*release; then sudo yum install -y autoconf; fi
else
        if [[ "$get_autoconf" == * ]]; then
                echo "$showok ${blue}autoconf$stand is already installed!"
        fi
fi
if [[ "$get_cmake" == "(none)" ]]; then
        echo "$showinfo We need to install ${blue}cmake$stand"
        if grep -q -o -m 1 Ubuntu /etc/*release; then sudo apt install -y cmake; elif grep -q -o -m 1 Debian /etc/*release; then sudo apt-get install -y cmake; elif grep -q -o -m 1 centos /etc/*release; then sudo yum install -y cmake; fi
else
        if [[ "$get_cmake" == * ]]; then
                echo "$showok ${blue}cmake$stand is already installed!"
        fi
fi
if [[ "$get_psmisc" == "(none)" ]]; then
        echo "$showinfo We need to install ${blue}psmisc$stand"
        if grep -q -o -m 1 Ubuntu /etc/*release; then sudo apt install -y psmisc; elif grep -q -o -m 1 Debian /etc/*release; then sudo apt-get install -y psmisc; elif grep -q -o -m 1 centos /etc/*release; then sudo yum install -y psmisc; fi
else
        if [[ "$get_psmisc" == * ]]; then
                echo "$showok ${blue}psmisc$stand is already installed!"
        fi
fi
}
#### Dependencies check END

deps # call deps function

if [[ $(pwd | cut -d '/' -f4) =~ Node-WebDollar[[:alnum:]]+ || $(pwd | cut -d '/' -f4) == Node-WebDollar || $(pwd | cut -d '/' -f4) == *eb*ollar* || $(pwd | cut -d '/' -f3) =~ Node-WebDollar[[:alnum:]]+ || $(pwd | cut -d '/' -f3) == Node-WebDollar || $(pwd | cut -d '/' -f3) == *eb*ollar* ]]; then

	if [[ $(ls -d argon2) == argon2 ]]; then

		echo "$showinfo argon2 is already present."
		read -r -e -p "$showinput Do you want to compile argon2 again? (y or n): " yn_compile

		if [[ $yn_compile == [nN] ]]; then
			echo -e "$showinfo OK..."

		elif [[ $yn_compile == [yY] ]]; then
			if cd argon2; then echo "$showexecute Changing dir to ${yellow}argon2$stand"; else echo "$showerror Couldn't cd to argon2 folder!"; fi
			echo "$showexecute Compiling argon2..." && cmake -DCMAKE_BUILD_TYPE=Release . && make
			echo "$showexecute Going back to Node-WebDollar folder..." && cd ..

			if [[ -d dist_bundle/CPU  ]]; then

				echo "$showok CPU folder inside dist_bundle exists!"
				echo "$showexecute Copying argon2/* files to dist_bundle/CPU" && cp -a argon2/* dist_bundle/CPU/
			else
				if [[ ! -d dist_bundle/CPU ]]; then
					echo "$showerror CPU folder inside dist_bundle not found!"
					echo "$showexecute Creating one now..." && mkdir dist_bundle/CPU
					echo "$showexecute Copying argon2/* files to dist_bundle/CPU" && cp -a argon2/* dist_bundle/CPU/
				fi
			fi

		elif [[ $yn_compile == * ]]; then
			echo -e "$showerror Possible options are: yY or nN."
		fi
	else
		if [[ ! $(ls -d argon2) == argon2 ]]; then

			echo "$showerror argon2 not found inside Node-WebDollar!"
			echo "$showinfo Cloning argon2 from WebDollar repository..."
			git clone https://github.com/WebDollar/argon2.git
			if cd argon2; then echo "$showexecute Changing dir to ${yellow}$(pwd)$stand"; else echo "$showerror Couldn't cd to argon2 folder!"; fi

			if [[ $(pwd | cut -d '/' -f5) == argon2 ]]; then
			        echo "$showinfo Current dir is $(pwd)"
			        echo "$showexecute ${green}autoreconf -i$stand" && autoreconf -i
				echo "$showexecute ${green}./configure$stand" && ./configure
				echo "$showexecute ${green}cmake -DCMAKE_BUILD_TYPE=Release .$stand" && cmake -DCMAKE_BUILD_TYPE=Release .
				echo "$showexecute ${green}make$stand" && make
				echo "$showexecute ${green}make check$stand" && make check # check if reponse PASSES
				if cd ..; then echo "$showexecute Changing dir to ${yellow}$(pwd)$stand"; else echo "$showerror Couldn't cd back!"; fi

				if [[ -d dist_bundle/CPU  ]]; then

					echo "$showok CPU folder inside dist_bundle exists!"
					echo "$showexecute Copying argon2/* files to dist_bundle/CPU" && cp -a argon2/* dist_bundle/CPU/
				else
					if [[ ! -d dist_bundle/CPU ]]; then
						echo "$showerror CPU folder inside dist_bundle not found!"
						echo "$showexecute Creating one now..." && mkdir dist_bundle/CPU
						echo "$showexecute Copying argon2/* files to dist_bundle/CPU" && cp -a argon2/* dist_bundle/CPU/
					fi
				fi
			else
			        if [[ ! $(pwd) =~ argon[[:alnum:]]+ ]]; then
			                echo "$showerror You are not inside the ${yellow}argon2$stand folder."
			                echo "$showinfo Run this script inside argon2 folder."
			        fi
			fi
		fi
	fi

### Ask user if he wants to change MAX threads value and TERMINAL_WORKER TYPE
if [[ $(pwd | cut -d '/' -f4) =~ Node-WebDollar[[:alnum:]]+ || $(pwd | cut -d '/' -f4) == Node-WebDollar ]]; then

	if [[ ! -d $get_const_global ]]; then
		echo "$showinfo ${yellow}const_global.js$stand found!"
		function set_cpucpp() {
			read -r -e -p "$showinput Do you want to use the ${yellow}CPU-CPP$stand optimization? (y or n): " yn_cpucpp

			if [[ $yn_cpucpp == [nN] ]]; then
                	        echo -e "$showinfo OK..."

	                elif [[ $yn_cpucpp == [yY] ]]; then

				if [[ $(grep "TYPE: \"cpu-cpp\"" $get_const_global | cut -d ',' -f1) ]]; then
					echo "$showinfo ${yellow}cpu-cpp$stand is already set."
				else
					echo "$showexecute Setting terminal worker type to ${yellow}cpu-cpp$stand" && sed -i -- 's/TYPE: "cpu"/TYPE: "cpu-cpp"/g' src/consts/const_global.js && echo "$showinfo Result: $(grep "TYPE: \"cpu-cpp\"" $get_const_global | cut -d ',' -f1)"
				fi

        	        elif [[ $yn_cpucpp == * ]]; then
                	        echo -e "$showerror Possible options are: yY or nN." && set_cpucpp
	                fi
		}
		set_cpucpp

		function set_cputhreads() {
			read -r -e -p "$showinput How many CPU_THREADS do you want to use? (your pc has ${green}$(nproc)$stand): " setcputhreads

			if [[ $setcputhreads == [nN] ]]; then
                	        echo -e "$showinfo OK..."

	                elif [[ $setcputhreads =~ [[:digit:]] ]]; then

				if [[ $(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1 | awk '{print $2}') == "$setcputhreads" ]]; then
					echo "$showinfo ${yellow}$(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1)$stand is already set."
				else
					echo "$showexecute Setting terminal CPU_MAX to ${yellow}$setcputhreads$stand" && sed -i -- "s/CPU_MAX: $(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1 | awk '{print $2}')/CPU_MAX: $setcputhreads/g" src/consts/const_global.js && echo "$showinfo Result: $(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1)"
				fi

        	        elif [[ $setcputhreads == * ]]; then
                	        echo -e "$showerror Possible options are: digits or nN to abort." && set_cputhreads
	                fi
		}
		set_cputhreads


	else
		echo "$showerror ${yellow}$get_const_global$stand not found! Something is wrong..."
	fi
fi
###

else
	if [[ $(ls -d argon2) == argon2 ]]; then

		echo "$showinfo argon2 folder found.."
		function argon2_compile() {
			read -r -e -p "$showinput Do you want to compile argon2 again? (y or n): " yn_compile

			if [[ $yn_compile == [nN] ]]; then
				echo -e "$showinfo OK..."

			elif [[ $yn_compile == [yY] ]]; then
				echo "$showexecute Compiling argon2..." && cmake -DCMAKE_BUILD_TYPE=Release . && make

			elif [[ $yn_compile == * ]]; then
				echo -e "$showerror Possible options are: yY or nN." && argon2_compile
			fi
		}
		argon2_compile
	else
	        if [[ ! $(pwd | cut -d '/' -f4) == argon2 ]]; then
	                echo "$showerror You are not inside the ${yellow}argon2$stand folder."
	                echo "$showinfo Run this script inside argon2 folder."
	        fi

	fi
fi
