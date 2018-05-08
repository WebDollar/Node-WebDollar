FROM node:8-alpine

# Install build packages
RUN apk update && apk add --no-cache make gcc g++ python certbot

# Copy files
COPY . .

# Run npm install for build
RUN npm install

# Install global packages
RUN npm install -g cross-env webpack webpack-cli

# Build
RUN npm run build_terminal

# Clean Everything
RUN npm ls -gp --depth=0 | awk -F/ '/node_modules/ && !/\/npm$/ {print $NF}' | xargs npm -g rm && apk del make gcc g++ python &&\
	rm -rf /tmp/* /var/cache/apk/* &&\
	npm cache clean --force

# Install pm2
RUN npm install -g pm2

# Ports
EXPOSE 80
EXPOSE 443

# Make script executable

RUN chmod +x start_docker_letsencrypt.sh

CMD ["sh","start_docker_letsencrypt.sh"]
