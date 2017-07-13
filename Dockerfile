FROM node:alpine

ADD . /usr/src/LDAP-For-Plex
WORKDIR /usr/src/LDAP-For-Plex

RUN npm install

VOLUME /usr/src/LDAP-For-Plex/config

CMD ["npm","start"]