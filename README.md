# LDAP-for-Plex
An LDAP server that uses Plex as the provider.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HPGZKEXQBULFY)

I've tested this using http://booksonic.org/ and JXPlorer. It is very basic at the moment but is working for basic things. I haven't got many LDAP supported services so haven't been able to test it any further.

If the project gets some traction more features could be added. Due to the way ldapjs works it should be possible to add support for changing passwords, usernames and various other things too.

# Warning
This LDAP server does not currently require authentication to preform queries so I suggest you don't expose the server externally.

## Installation
These steps assume you have NodeJS installed. https://nodejs.org/en/

1. Clone this GitHub project.
2. npm install uuid
3. npm install xml2js
4. npm install ldapjs

Once you've finished the above steps, edit the LDAPPlex.js file and set your configuration. Defaults should work for most things but you will need to change plexToken, plexMachineID, and plexServerName.

Now you should be able to run `node LDAPPlex.js` and your server will start.

## Booksonic settings
LDAP URL: ldap://localhost:2389/ou=users,o=plex.tv
LDAP Search Filter: (cn={0})
