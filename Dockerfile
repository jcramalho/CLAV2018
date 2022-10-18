FROM node:18.10
COPY ./ /server
WORKDIR /server
RUN npm install

CMD ["npm", "start"]
