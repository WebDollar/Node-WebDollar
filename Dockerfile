FROM node:8-alpine

# Install build packages and npm global packages
RUN apk update && apk add --no-cache make gcc g++ python certbot && npm install -g cross-env webpack webpack-cli pm2

# Copy files
COPY . .

# Run npm install for build
RUN npm install

# Build
RUN npm run build_terminal

# Clean Everything
RUN apk del make gcc g++ python &&\
	rm -rf /tmp/* /var/cache/apk/* &&\
	npm cache clean --force

# Ports
EXPOSE 80
EXPOSE 443

# Make script executable
RUN chmod +x start_docker_letsencrypt.sh

CMD ["sh","start_docker_letsencrypt.sh"]