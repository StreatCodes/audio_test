FROM denoland/deno:debian-1.31.2 AS builder
WORKDIR /build
COPY deno.* .
COPY build.ts .
COPY frontend frontend
RUN deno task build-frontend

FROM denoland/deno:distroless-1.31.2
WORKDIR /app
COPY server server
COPY static static
COPY deno.* .
COPY --from=builder /build/static/bundle.js static/bundle.js
RUN ["deno", "cache", "server/main.ts"]
CMD ["task", "prod"]
EXPOSE 8080
