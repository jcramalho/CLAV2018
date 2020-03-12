FROM node:latest
COPY ./ /server
WORKDIR /server
RUN npm install

FROM nginx
#Porta 7777 HTTP e 7778 HTTPS
COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/acme.sh

#gen a self-signed certificate only to boot nginx
RUN apt-get update && \
    apt-get install -y openssl sudo
RUN openssl req -batch -sha256 -x509 -nodes -days 1 -subj "/C=PT/ST=Denial/L=Portugal/O=CLAV/CN=localhost" -newkey rsa:2048 -keyout /etc/nginx/acme.sh/key.pem -out /etc/nginx/acme.sh/fullchain.pem

#gen dhparam example, only to boot nginx
RUN openssl dhparam -out /etc/nginx/acme.sh/dhparam.pem 1024

CMD sh -c '(nginx -g "daemon off;" &) && /server/prepareHTTPS.sh && npm start'
