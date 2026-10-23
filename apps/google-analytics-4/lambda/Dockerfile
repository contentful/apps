# pull official base image
FROM node:24.22.1-bookworm-slim

# set working directory
RUN mkdir -p /usr/src/app && chown node:node /usr/src/app
WORKDIR /usr/src/app
USER node

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY --chown=node:node package*.json ./
RUN npm ci

# start app
CMD ["npm", "run", "start:dev"]
