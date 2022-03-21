FROM node:latest as build-stage
WORKDIR /app/ritui/
COPY ./package*.json .
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3001

CMD ["./node_modules/.bin/pm2-runtime", "./build/app.js"]