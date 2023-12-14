FROM node:15

WORKDIR /webapp
COPY package.json .
RUN npm install
COPY . .
CMD npm run serve