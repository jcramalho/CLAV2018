FROM node:18-bullseye
COPY ./ /server
WORKDIR /server
RUN npm install

CMD ["npm", "start"]
