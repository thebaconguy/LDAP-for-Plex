# LDAP-for-Plex
An LDAP server that uses Plex as the provider.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HPGZKEXQBULFY)

If the project gets some traction more features could be added. Due to the way ldapjs works it should be possible to add support for changing passwords, usernames and various other things too.

# Warning
This LDAP server does not currently require authentication to preform queries so I suggest you don't expose the server externally.

## Installation
These steps assume you have NodeJS and NPM installed.

1. Clone this GitHub project.
2. Run `npm install`

Once you've finished the above steps, run `npm start` and wait for the config to generate, edit the `config/options.json` file and add your plexToken, plexMachineId and plexServerName, you can change the rest if you want.

Now you should be able to run `npm start` and your server will start.