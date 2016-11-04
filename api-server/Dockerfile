FROM rezzza/docker-node:latest

MAINTAINER Shaun Burdick <docker@shaunburdick.com>

ADD . /usr/src/myapp

WORKDIR /usr/src/myapp

RUN ["npm", "install"]

ENV PORT= \
  NEO4J_URL=

CMD ["npm", "start"]
