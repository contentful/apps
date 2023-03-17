FROM node:14-alpine AS base

RUN apk add --update --no-cache openssh build-base python3 bash git && rm -rf /var/cache/apk/*

WORKDIR /app/lambda

COPY lambda/package.json /app/

ENV NODE_ENV development

RUN npm i

COPY lambda /app/lambda

CMD ["npm", "run", "start"]
