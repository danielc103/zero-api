FROM node:alpine

# add the website
RUN mkdir -p /api-server
WORKDIR /api-server
COPY . .

# install npm dependencies
RUN npm install

# set port to listen on
EXPOSE 3000

# create non-root user to run as
RUN addgroup -S appgroup && adduser -S -G appgroup appuser && \
  chown -R appuser:appgroup /api-server
USER appuser

# start the application
CMD ["node", "server.js"]