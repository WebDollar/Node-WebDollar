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

### GENERAL_VARS
get_const_global="src/consts/const_global.js"
get_libtool=$(if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then echo "$(apt-cache policy libtool | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then echo "$(apt-cache policy libtool | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then echo "$(yum list libtool | grep -o Installed)"; fi fi fi)
get_autoconf=$(if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then echo "$(apt-cache policy autoconf | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then echo "$(apt-cache policy autoconf | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then echo "$(yum list autoconf | grep -o Installed)"; fi fi fi)
get_cmake=$(if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then echo "$(apt-cache policy cmake | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then echo "$(apt-cache policy cmake | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then echo "$(yum list cmake | grep -o Installed)"; fi fi fi)
get_psmisc=$(if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then echo "$(apt-cache policy psmisc | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then echo "$(apt-cache policy psmisc | grep Installed | grep none | awk '{print$2}')"; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then echo "$(yum list psmisc | grep -o Installed)"; fi fi fi)
###

#### Dependencies START
function deps(){
if [[ "$get_libtool" == "(none)" ]]; then
	echo "$showinfo We need to install ${BLUE}libtool$STAND"
	if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y libtool; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then sudo apt-get install -y libtool; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then sudo yum install -y libtool;  fi fi fi
else
	if [[ "$get_libtool" == * ]]; then
		echo "$showok ${BLUE}libtool$STAND is already installed!"
	fi
fi
if [[ "$get_autoconf" == "(none)" ]]; then
        echo "$showinfo We need to install ${BLUE}autoconf$STAND"
        if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y autoconf; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then sudo apt-get install -y autoconf; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then sudo yum install -y autoconf;  fi fi fi
else
        if [[ "$get_autoconf" == * ]]; then
                echo "$showok ${BLUE}autoconf$STAND is already installed!"
        fi
fi
if [[ "$get_cmake" == "(none)" ]]; then
        echo "$showinfo We need to install ${BLUE}cmake$STAND"
        if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y cmake; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then sudo apt-get install -y cmake; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then sudo yum install -y cmake;  fi fi fi
else
        if [[ "$get_cmake" == * ]]; then
                echo "$showok ${BLUE}cmake$STAND is already installed!"
        fi
fi
if [[ "$get_psmisc" == "(none)" ]]; then
        echo "$showinfo We need to install ${BLUE}psmisc$STAND"
        if [[ $(cat /etc/*release | grep -o -m 1 Ubuntu) ]]; then sudo apt install -y psmisc; else if [[ $(cat /etc/*release | grep -o -m 1 Debian) ]]; then sudo apt-get install -y psmisc; else if [[ $(cat /etc/*release | grep -o -m 1 centos) ]]; then sudo yum install -y psmisc;  fi fi fi
else
        if [[ "$get_psmisc" == * ]]; then
                echo "$showok ${BLUE}psmisc$STAND is already installed!"
        fi
fi
}
#### Dependencies check END

deps # call deps function

if [[ $(pwd | cut -d '/' -f4) =~ Node-WebDollar[[:alnum:]]+ || $(pwd | cut -d '/' -f4) == Node-WebDollar || $(pwd | cut -d '/' -f4) == *eb*ollar* ]]; then

	if [[ $(ls -d argon2) == argon2 ]]; then

		echo "$showinfo argon2 is already present."
		read -e -p "$showinput Do you want to compile argon2 again? (y or n): " yn_compile

		if [[ $yn_compile == [nN] ]]; then
			echo -e "$showinfo OK..."

		elif [[ $yn_compile == [yY] ]]; then
			echo "$showexecute Changing dir to ${YELLOW}argon2$STAND" && cd argon2
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
			echo "$showexecute Changing DIR to ${GREEN}argon2$STAND" && cd argon2

			if [[ $(pwd | cut -d '/' -f5) == argon2 ]]; then
			        echo "$showinfo Current dir is $(pwd)"
			        echo "$showexecute ${GREEN}autoreconf -i$STAND" && autoreconf -i
				echo "$showexecute ${GREEN}./configure$STAND" && ./configure
				echo "$showexecute ${GREEN}cmake -DCMAKE_BUILD_TYPE=Release .$STAND" && cmake -DCMAKE_BUILD_TYPE=Release .
				echo "$showexecute ${GREEN}make$STAND" && make
				echo "$showexecute ${GREEN}make check$STAND" && make check # check if reponse PASSES

				if [[ -d ../dist_bundle/CPU  ]]; then

					echo "$showok CPU folder inside dist_bundle exists!"
					echo "$showexecute Copying argon2/* files to dist_bundle/CPU" && cp -a * ../dist_bundle/CPU/
				else
					if [[ ! -d ../dist_bundle/CPU ]]; then
						echo "$showerror CPU folder inside dist_bundle not found!"
						echo "$showexecute Creating one now..." && mkdir ../dist_bundle/CPU
						echo "$showexecute Copying argon2/* files to dist_bundle/CPU" && cp -a * ../dist_bundle/CPU/
					fi
				fi
			else
			        if [[ ! $(pwd) =~ argon[[:alnum:]]+ ]]; then
			                echo "$showerror You are not inside the ${YELLOW}argon2$STAND folder."
			                echo "$showinfo Run this script inside argon2 folder."
			        fi
			fi
		fi
	fi

### Ask user if he wants to change MAX threads value and TERMINAL_WORKER TYPE
if [[ $(pwd | cut -d '/' -f4) =~ Node-WebDollar[[:alnum:]]+ || $(pwd | cut -d '/' -f4) == Node-WebDollar ]]; then

	if [[ ! -d $get_const_global ]]; then
		echo "$showinfo ${YELLOW}const_global.js$STAND found!"
		function set_cpucpp() {
			read -e -p "$showinput Do you want to use the ${YELLOW}CPU-CPP$STAND optimization? (y or n): " yn_cpucpp

			if [[ $yn_cpucpp == [nN] ]]; then
                	        echo -e "$showinfo OK..."

	                elif [[ $yn_cpucpp == [yY] ]]; then

				if [[ $(grep "TYPE: \"cpu-cpp\"" $get_const_global | cut -d ',' -f1) ]]; then
					echo "$showinfo ${YELLOW}cpu-cpp$STAND is already set."
				else
					echo "$showexecute Setting terminal worker type to ${YELLOW}cpu-cpp$STAND" && sed -i -- 's/TYPE: "cpu"/TYPE: "cpu-cpp"/g' src/consts/const_global.js && echo "$showinfo Result: $(grep "TYPE: \"cpu-cpp\"" $get_const_global | cut -d ',' -f1)"
				fi

        	        elif [[ $yn_cpucpp == * ]]; then
                	        echo -e "$showerror Possible options are: yY or nN." && set_cpucpp
	                fi
		}
		set_cpucpp

		function set_cputhreads() {
			read -e -p "$showinput How many CPU_THREADS do you want to use? (your pc has ${GREEN}$(nproc)$STAND): " setcputhreads

			if [[ $setcputhreads == [nN] ]]; then
                	        echo -e "$showinfo OK..."

	                elif [[ $setcputhreads =~ [[:digit:]] ]]; then

				if [[ $(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1 | awk '{print $2}') == $setcputhreads ]]; then
					echo "$showinfo ${YELLOW}$(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1)$STAND is already set."
				else
					echo "$showexecute Setting terminal CPU_MAX to ${YELLOW}$setcputhreads$STAND" && sed -i -- "s/CPU_MAX: $(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1 | awk '{print $2}')/CPU_MAX: $setcputhreads/g" src/consts/const_global.js && echo "$showinfo Result: $(grep "CPU_MAX:" $get_const_global | cut -d ',' -f1)"
				fi

        	        elif [[ $setcputhreads == * ]]; then
                	        echo -e "$showerror Possible options are: digits or nN to abort." && set_cputhreads
	                fi
		}
		set_cputhreads


	else
		echo "$showerror ${YELLOW}$get_const_global$STAND not found! Something is wrong..."
	fi
fi
###

else
	if [[ $(ls -d argon2) == argon2 ]]; then

		echo "$showinfo argon2 folder found.."
		function argon2_compile() {
			read -e -p "$showinput Do you want to compile argon2 again? (y or n): " yn_compile

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
	                echo "$showerror You are not inside the ${YELLOW}argon2$STAND folder."
	                echo "$showinfo Run this script inside argon2 folder."
	        fi

	fi
fi
