FROM node:22-alpine AS build
WORKDIR /src
COPY index.html app.js ./
RUN npx --yes terser@5.31.6 app.js --compress --mangle --toplevel --output app.js

FROM busybox:1.36-musl
COPY --from=build /src/index.html /src/app.js /www/
EXPOSE 8080
USER nobody
CMD ["httpd", "-f", "-p", "8080", "-h", "/www"]
