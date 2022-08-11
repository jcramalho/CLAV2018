FROM node:16.16.0
COPY ./ /server
WORKDIR /server
RUN npm install

CMD ["npm", "start"]
