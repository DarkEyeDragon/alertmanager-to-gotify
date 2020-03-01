FROM node:13.8.0-stretch-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.js .
EXPOSE 8435
CMD [ "node", "index.js" ]