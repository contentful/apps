FROM node:18-alpine AS base

# set working directory
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package*.json .
RUN npm ci

# start app
CMD ["npm", "run", "start:dev"]