FROM node:fermium-alpine3.14

CMD ["/bin/sh"]

WORKDIR /usr/src/app


COPY package*.json ./

RUN npm install

COPY . /usr/src/app

EXPOSE 8080
EXPOSE 9200

CMD [ "./pfe-run.sh" ]
