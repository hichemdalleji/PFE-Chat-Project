FROM node:alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN yarn

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "client" ]
