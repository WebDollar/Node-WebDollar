FROM node:8-alpine

# Install build packages
RUN apk add --no-cache make gcc g++ python

# Copy files
COPY . .

# Run npm install production
RUN npm install --only=production

# Install global packages
RUN npm install -g cross-env webpack webpack-cli

# Delete build pagages and clear cache
RUN apk del make gcc g++ python && rm -rf /tmp/* /var/cache/apk/*

EXPOSE 80

CMD ["npm","run","start"]
