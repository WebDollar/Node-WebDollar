#!/bin/bash

# Check requirements
if [ -z $EMAIL ]; then echo "Please fill environment variable EMAIL"; exit; fi
if [ -z $DOMAIN]; then echo "Please fill environment variable DOMAIN"; exit; fi

echo "Generate $DOMAIN certificate"
certbot certonly  --text --non-interactive --rsa-key-size 4096 \
				  --email $EMAIL --agree-tos --standalone --expand \
			      --reinstall -d $DOMAIN

# Sym links
ln -s /etc/letsencrypt/live/$DOMAIN/privkey.pem certificates/private.key
ln -s /etc/letsencrypt/live/$DOMAIN/cert.pem certificates/certificate.crt
ln -s /etc/letsencrypt/live/$DOMAIN/chain.pem certificates/ca_bundle.crt

# START NODE 443
SERVER_PORT=443 INSTANCE_PREFIX=443 pm2 start  npm -- run start
sleep 1;
pm2 restart npm --name "443" --update-env

pm2 logs