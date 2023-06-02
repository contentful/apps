FROM node:14-alpine AS base

RUN apk add --update --no-cache openssh build-base python3 bash git && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json yarn.lock frontend/package.json lambda/package.json /app/

ENV NODE_ENV development

RUN yarn

COPY .git /app/.git

COPY . /app

CMD ["yarn", "start:lambda"]
