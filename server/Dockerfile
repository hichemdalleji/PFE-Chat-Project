FROM node:alpine

WORKDIR /usr/src/app

RUN export DATABASE_URL=mongodb://localhost:27017/chatproject

COPY package.json package-lock.json ./

RUN yarn

COPY . .

EXPOSE 9200

CMD [ "npm", "run", "server" ]
