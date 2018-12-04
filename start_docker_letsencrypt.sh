#!/bin/bash

# Check optional
if [ -z $SERVER_PORT ]; then export SERVER_PORT=443; fi
if [ -z $MAXIMUM_CONNECTIONS_FROM_BROWSER ]; then export MAXIMUM_CONNECTIONS_FROM_BROWSER=256; fi
if [ -z $MAXIMUM_CONNECTIONS_FROM_TERMINAL ]; then export MAXIMUM_CONNECTIONS_FROM_TERMINAL=256; fi


# Check NOSSL in case we don't need a SSL
if [ -z $NOSSL ]; then

	get_user=$(whoami);

	# Check requirements
	if [ -z $EMAIL ]; then echo "Please fill environment variable EMAIL"; exit; fi
	if [ -z $DOMAIN ]; then echo "Please fill environment variable DOMAIN"; exit; fi

	echo "Generate $DOMAIN certificate"
	certbot certonly --text --non-interactive --rsa-key-size 4096 --agree-tos \
					 --standalone --expand --email $EMAIL -d $DOMAIN

	# Symbolic links

	rm -f certificates/private.key && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem certificates/private.key && chown $get_user:$get_user certificates/private.key
	rm -f certificates/certificate.crt && cp /etc/letsencrypt/live/$DOMAIN/cert.pem certificates/certificate.crt && chown $get_user:$get_user certificates/certificate.crt
	rm -f certificates/ca_bundle.crt && cp /etc/letsencrypt/live/$DOMAIN/chain.pem certificates/ca_bundle.crt && chown $get_user:$get_user certificates/ca_bundle.crt

fi

if [ -z $TYPE ]; then

	# Start Full Node with PM2
	pm2 start npm -- run start
	sleep 1
	pm2 restart npm --update-env

	pm2 logs

else
	# Start in Pool or Poll Server Mode

	if [ $TYPE -eq "11" ]; then
		# Start Pool
		if [ -z $POOL_NAME ]; then echo 'You need to input a pool name using POOL_NAME ENV variable'; exit; fi
		if [ -z $POOL_EXTERNAL ]; then echo 'You need to input a pool website using POOL_EXTERNAL ENV variable'; exit; fi
		if [ -z $POOL_WEBSITE ]; then echo 'You need to input a pool website using POOL_WEBSITE ENV variable'; exit; fi
		if [ -z $POOL_FEE ]; then export POOL_FEE=0.18; fi
		if [ -z $POOL_REFFERAL_FEE ]; then export POOL_REFFERAL_FEE=0.18; fi

		#Check if we want pool be also a pool server
		if [ $POOL_EXTERNAL -eq "n" ]; then
			(sleep 15;echo 11;sleep 5;echo $POOL_FEE;sleep 5;echo "$POOL_NAME";sleep 5;echo "$POOL_WEBSITE";sleep 5;echo "$POOL_REFFERAL_FEE";sleep 5;echo "$POOL_EXTERNAL";) | npm run commands
		else
			if [ -z $POOL_SERVERS ]; then export POOL_SERVERS='https://p1.webdollar.fun:443'; fi
			(sleep 15;echo 11;sleep 5;echo $POOL_FEE;sleep 5;echo "$POOL_NAME";sleep 5;echo "$POOL_WEBSITE";sleep 5;echo "$POOL_REFFERAL_FEE";sleep 5;echo "$POOL_EXTERNAL";sleep 5;echo "$POOL_SERVERS";) | npm run commands
		fi
	elif [ $TYPE -eq "12" ]; then
		# Start PoolServer
		(sleep 15;echo $TYPE;sleep 5;echo $POOL_FEE;) | npm run commands
	fi

fi
