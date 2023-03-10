FROM node:18.15.0-slim
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "prod"]
EXPOSE 8080
