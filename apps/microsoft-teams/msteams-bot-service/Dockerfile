FROM node:lts-hydrogen

# set working directory
WORKDIR /msteams-bot-service

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /msteams-bot-service/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package*.json .
RUN npm ci

# start app
CMD ["npm", "run", "start"]
