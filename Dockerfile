FROM node:current-alpine

WORKDIR /app

COPY src ./src
COPY package.json ./
COPY package-lock.json ./

RUN npm install

CMD ["npm", "start"]
