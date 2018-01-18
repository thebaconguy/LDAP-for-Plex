# LDAP-for-Plex [![dependencies Status](https://david-dm.org/thebaconguy/LDAP-for-plex/status.svg)](https://david-dm.org/thebaconguy/LDAP-For-Plex) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
An LDAP server that uses Plex as the provider.

If the project gets some traction more features could be added. Due to the way ldapjs works it should be possible to add support for changing passwords, usernames and various other things too.

# Warning
This LDAP server does not currently require authentication to perform queries so I suggest you don't expose the server externally.

## Installation
These steps assume you have NodeJS and Yarn installed.

1. Clone this GitHub project.
2. Run `yarn install`

Once you've finished the above steps, run `yarn start` and wait for the config to generate, edit the `config/options.json` file and add your plexToken, plexMachineId and plexServerName, you can change the rest if you want.

Now you should be able to run `yarn start` and your server will start.

## Docker
#### Run using automated build:
```
docker run -d \
  -n ldapforplex \
  -p 389:389 \
  -v /path/to/config:/usr/src/LDAP-For-Plex/config \
  thebaconguy/ldap-for-plex
```

#### Run with docker-compose:
```
---
version: '3.4'

services:

  ldapforplex:
      image: thebaconguy/ldap-for-plex
      container_name: ldapforplex
      restart: unless-stopped
      ports:
        - 389:389
      volumes:
        - /path/to/config:/usr/src/LDAP-For-Plex/config
 ```

Change the path to config and the port depending on your configuration.

#### Build yourself:
1. `docker build -t your-image-name .`
2. Run like the automated build except with your image name.

## Configuration
Create/edit the `/path/to/config/options.json` file and add your plexToken, plexMachineId and plexServerName, similar to:
```
{
  "debug": true,
  "port": 389,
  "host": "0.0.0.0",
  "rootDN": "ou=users,o=plex.tv",
  "plexToken": "ABCDEFGHIJKLM",
  "plexMachineID": "123abc456def",
  "plexServerName": "My Plex Server"
}
```

## LDAP Search
A quick way to know it's working is to use `curl` ([reference](https://docs.oracle.com/cd/E19396-01/817-7616/ldurl.html)):
- `curl ldap://ldapforplex/ou=users,o=plex.tv?*?sub?(objectClass=*)`

## TODO
1. Figure out how to use password authentication ([PlexAuth](https://github.com/hjone72/PlexAuth)?)
2. Persist the uid generated for each record so that it can be used as a consistent identifier since username and user email can change. (Use a db a store the user list? Make sure to reconcile the differences by username or user email)
