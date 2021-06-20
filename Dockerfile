FROM node:14-alpine
LABEL org.opencontainers.image.url=https://github.com/tbutter/route53addip
 
COPY package.json index.js entrypoint.sh .
RUN npm i
ENTRYPOINT ["sh", "entrypoint.sh"]