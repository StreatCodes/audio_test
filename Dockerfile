FROM denoland/deno:distroless-1.31.2
WORKDIR /app
COPY server .
COPY static .
RUN deno cache main.ts
CMD ["deno", "run", "--allow-net", "--allow-read", "server/main.ts"]
EXPOSE 8080
