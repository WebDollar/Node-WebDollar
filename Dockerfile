FROM node:8-alpine

# Install build packages
RUN apk add --no-cache make gcc g++ python

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

EXPOSE 80

CMD ["node","dist_bundle/terminal-bundle.js"]
