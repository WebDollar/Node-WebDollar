#!/bin/bash

# Check optional
if [ -z $SERVER_PORT ]; then export SERVER_PORT=443; fi
if [ -z $MAXIMUM_CONNECTIONS_FROM_BROWSER ]; then export MAXIMUM_CONNECTIONS_FROM_BROWSER=256; fi
if [ -z $MAXIMUM_CONNECTIONS_FROM_TERMINAL ]; then export MAXIMUM_CONNECTIONS_FROM_TERMINAL=256; fi

# Check NOSSL in case we don't need a SSL
if [ -z $NOSSL ]; then

	# Check requirements
	if [ -z $EMAIL ]; then echo "Please fill environment variable EMAIL"; exit; fi
	if [ -z $DOMAIN ]; then echo "Please fill environment variable DOMAIN"; exit; fi

	echo "Generate $DOMAIN certificate"
	certbot certonly --text --non-interactive --rsa-key-size 4096 --agree-tos \
					 --standalone --expand --reinstall --email $EMAIL -d $DOMAIN

	# Symbolic links
	ln -s /etc/letsencrypt/live/$DOMAIN/privkey.pem certificates/private.key
	ln -s /etc/letsencrypt/live/$DOMAIN/cert.pem certificates/certificate.crt
	ln -s /etc/letsencrypt/live/$DOMAIN/chain.pem certificates/ca_bundle.crt

fi

# Start PM2
pm2 start npm -- run start
sleep 1
pm2 restart npm --update-env

pm2 logs