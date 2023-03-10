FROM node:18.15.0-slim
WORKDIR /app
COPY . .
CMD ["node", "main.js"]
EXPOSE 8080
