FROM node:14-alpine AS base

RUN apk add --update --no-cache openssh build-base python3 bash git && rm -rf /var/cache/apk/*

WORKDIR /app

#package.json was not brought over from the other repo, in fact it's part of a yarn workspaces set up that we might want to move away from
COPY package.json package-lock.json frontend/package.json lambda/package.json /app/

ENV NODE_ENV development

RUN yarn

#this is a root-level directory for a github repo. In the old repo, this existed at the root, but after being brought over to the /slack directory, 
#it now exists at the root of THIS repo, not the root of this directory
COPY .git /app/.git

COPY . /app

CMD ["yarn", "start:lambda"]
