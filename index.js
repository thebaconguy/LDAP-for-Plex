// Imports
const request = require('request');
const uuid = require('uuid');
const parseString = require('xml2js').parseString;
const ldap = require('ldapjs');
const crypto = require('crypto');
const fs = require('fs');

const defaults = {
    debug: false, // Debug Logging
    port: 2389, // Port
    host: '0.0.0.0', // Hostname
    rootDN: 'ou=users, o=plex.tv', // Change if you want
    plexToken: '', // Plex Token https://support.plex.tv/hc/en-us/articles/204059436-Finding-your-account-token-X-Plex-Token
    plexMachineID: '', // Machine ID
    plexServerName: '' // Name for your server.
};

const optionsFile = 'config/options.json';

if (!fs.existsSync(optionsFile)) {
    var json = JSON.stringify(defaults, null, '\t');
    fs.writeFileSync(optionsFile, json);
    console.log("Please fill out config/options.json");
    process.exit();
} else if (!fs.existsSync(optionsFile)) {
    var json = JSON.stringify(defaults, null, '\t');
    fs.writeFileSync(optionsFile, json);
    console.log("Please fill out config/options.json");
    process.exit();
}

const config = require('./config/options.json');

// Configuration
const version = '0.3';
const debug = config.debug;
const ldapPort = config.port;
const ldapHostname = config.host;
const rootDN = config.rootDN; // This can be anything you like. It won't change anything though.
const plexToken = config.plexToken; // Your Plex token. This is used to get your friends list.
const plexMachineID = config.plexMachineID; // Only allow servers that have this MachineID.
const plexServerName = config.plexServerName; // The name of your server.

const plexUser = {};
const server = ldap.createServer();

const options = {
    url: 'https://plex.tv/users/sign_in.json',
    method: 'POST',
    headers: {}
};

options.headers = {
    'X-Plex-Client-Identifier': uuid.v4(),
    'X-Plex-Product': 'LDAP for Plex',
    'X-Plex-Device': 'LDAP for Plex',
    'X-Plex-Version': 'v' + version,
    'content-Type': 'application/xml; charset=utf-8',
    'Content-Length': 0
};

let db = {}; // In memory database. This also acts as a cache.

// Functions
const authHeaderVal = async (username, password) => {
    // Generate a value based on UN and PW to send with the header for authentication.
    let authString = username + ':' + password;
    let buffer = new Buffer(authString.toString(), 'binary');
    return 'Basic ' + buffer.toString('base64');
}

/*
 function hashServer(server) {
 // <Server name="!PlexyName!" machineIdentifier="abcd" createdAt="1234"/>
 var toMD5 = server.name + server.machineIdentifier + server.createdAt;
 var serverHash = crypto.createHash('md5').update(toMD5).digest("hex");
 serverDB[serverHash] = server.name;
 }
 */

const log = async msg => {
    if (debug) {
        console.log(msg);
    }
}

const loadPlexUser = async (username, password) => {
    const loginOptions = options;
    loginOptions.headers.Authorization = authHeaderVal(username, password);

    return new Promise((resolve, reject) => {
        request(loginOptions, (err, res, body) => {
            if (!err && (res.statusCode == 200 || res.statusCode == 201)) {
                plexUser = JSON.parse(body).user;
                plexUserToLDAP(plexUser);
                return resolve(plexUser);
            } else {
                return reject(body);
            }
        });
    });
}

const plexUserToLDAP = async (pUser, servers) => {
    let user = {
        attributes: {
            objectclass: ['Plex.tv user'],
            cn: pUser.username,
            uid: pUser.id,
            email: pUser.email,
            title: pUser.title,
            thumb: pUser.thumb,
            o: 'plex.tv'
        }
    };

    if (servers) {
        servers.forEach(server => {
            if (plexMachineID == server.$.machineIdentifier) {
                obj.attributes.groups = [server.$.name];
            }
        });
    }

    db['uid=' + pUser.id + ', ' + rootDN] = obj;
}

const loadPlexUsers = async token => {
    return new Promise((resolve, reject) => {
        const loadMe = callback => {
            request('https://plex.tv/users/account?X-Plex-Token=' + token, (err, res, body) => {
                // Load in the current user. You don't appear in your own friends list.
                if (!err && res.statusCode == 200) {
                    parseString(body, async (err, result) => {
                        let me = result.user.$;
                        me.username = result.user.username;
                        let server = { $: { machineIdentifier: plexMachineID, name: plexServerName } }; // You don't appear in your friends list. Build some information so that you can auth too.
                        await plexUserToLDAP(me, [server]);
                    });
                } else {
                    log(body);
                    return reject();
                }
            });
        };
        request('https://plex.tv/api/users?X-Plex-Token=' + token, (err, res, body) => {
            if (!err && res.statusCode == 200) {
                parseString(body, (err, result) => {
                    let users = result.MediaContainer.User;
                    users.forEach(user => {
                        plexUserToLDAP(user.$, user.Server);
                    });
                    return loadMe(resolve());
                });
            } else {
                log(body);
                return reject();
            }
        });
    });
}

// Start //
// LDAP Server //
if (typeof plexToken !== 'string') {
    console.log('A valid Plex token is required...');
    process.exit();
} else {
    // Preload database.
    console.log('Preloading Plex users...');
    await loadPlexUsers(plexToken).then(async () => {
        console.log('Database loaded.');
        server.listen(ldapPort, ldapHostname, async () => {
            console.log('LDAP for Plex server up at: %s', server.url);
        });
    }).catch();
}

server.bind(rootDN, (req, res, next) => {
    log('bindDN: ' + req.dn.toString());
    
    if (db[req.dn.toString()]) {
        var username = db[req.dn.toString()].attributes.cn;
    } else {
        return next(new ldap.NoSuchObjectError(dn));
    }

    loadPlexUser(username, req.credentials).then(user => {
        res.end();
        return next();
    }).catch(err => {
        console.log(err);
        return next(new ldap.InvalidCredentialsError());
    });
});

server.search(rootDN, (req, res, next) => {
    log('base object: ' + req.dn.toString());
    log('scope: ' + req.scope);
    log('filter: ' + req.filter.toString());

    var dn = req.dn.toString();
    var scopeCheck;
    var filled = false;

    var search = (req, res, next) => {
        switch (req.scope) {
            case 'base':
                if (rootDN !== dn) {
                    if (!db[dn]) {
                        return next(new ldap.NoSuchObjectError(dn));
                    }
                    if (req.filter.matches(db[dn].attributes)) {
                        filled = true;
                        res.send({
                            dn: dn,
                            attributes: db[dn].attributes
                        });
                    }

                    res.end();
                    return next();
                }

            case 'one':
                scopeCheck = k => {
                    if (req.dn.equals(k)) {
                        return true;
                    }

                    var parent = ldap.parseDN(k).parent();
                    return parent ? parent.equals(req.dn) : false;
                };
                if (req.filter.toString() == '(objectclass=*)' && req.dn.toString() !== rootDN) {
                    res.end();
                    return next();
                }
                break;

            case 'sub':
                scopeCheck = k => {
                    return req.dn.equals(k) || req.dn.parentOf(k);
                };

                break;
        }

        Object.keys(db).forEach(key => {
            if (!scopeCheck(key)) {
                log('Skipping this key as scopeCheck returned false. ' + key);
                return;
            }

            if (req.filter.matches(db[key].attributes)) {
                filled = true;
                res.send({
                    dn: 'uid=' + db[key].attributes.uid + ', ' + rootDN,
                    attributes: db[key].attributes
                });
            }
        });

        if (filled) {
            log('request is reported as filled.');
            res.end();
            return next();
        }
    };

    search(req, res, next);
    if (!filled) {
        // Load database again. There may have been changes.
        loadPlexUsers(plexToken).then(() => {
            log('Database reloaded.');
            filled = true;
            search(req, res, next);
        });
    }
});
