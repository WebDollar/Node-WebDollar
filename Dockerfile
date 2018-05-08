FROM node:8-alpine

COPY . .

RUN apk add --no-cache make gcc g++ python
RUN npm install
RUN npm install -g cross-env webpack-cli webpack pm2
RUN apk del make gcc g++ python
RUN rm -rf /tmp/* /var/cache/apk/*

EXPOSE 80

CMD ["./start1.sh"]
