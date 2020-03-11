FROM node:latest

COPY . /server

WORKDIR /server

RUN npm install

CMD sh -c '(npm start &) && ./prepareHTTPS.sh && tail -f /dev/null'
