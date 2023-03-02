FROM node:14
COPY ./ /server
WORKDIR /server
RUN npm install

CMD ["npm", "start"]
