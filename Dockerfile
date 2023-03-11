FROM denoland/deno:distroless-1.31.2
WORKDIR /app
COPY server server
COPY static static
RUN ["deno", "cache", "server/main.ts"]
CMD ["deno", "run", "--allow-net", "--allow-read", "server/main.ts"]
EXPOSE 8080
