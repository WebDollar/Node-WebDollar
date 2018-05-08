FROM node:8-alpine

RUN apk add --no-cache make gcc g++ python

RUN npm install
RUN npm install -g cross-env webpack-cli webpack pm2
RUN apk del make gcc g++ python
RUN rm -rf /tmp/* /var/cache/apk/*

CMD ["npm","run","start_mining"]
