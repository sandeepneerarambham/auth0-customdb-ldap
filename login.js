function login(name, password, callback) {

  var ldap = require('ldapjs');

  if (!global.ldapClient) {

    console.log('Global Client not found');
    var LDAP_ENDPOINT = configuration.LDAP_ENDPOINT;
    var client = ldap.createClient({
      url: LDAP_ENDPOINT,
      idleTimeout: 30000
    });
      // Example LDAP_BIND_USER = CN=Mary Smith,CN=Users,DC=mycompany,DC=local
      // Example LDAP_BASE = DC=mycompany,DC=local
      var LDAP_BIND_USER = configuration.LDAP_BIND_USER;
      var LDAP_BIND_PASSWORD = configuration.LDAP_BIND_PASSWORD;
      var LDAP_BASE = configuration.LDAP_BASE;
      client.bind(LDAP_BIND_USER, LDAP_BIND_PASSWORD, function (err) {
      if (err) {
        return callback(new Error("Error while contacting the authentication source!"));
      }
      global.ldapClient = client;
      signInUser(name, password, callback, client);
    });
  } else {
    signInUser(name, password, callback, global.ldapClient);
  }

  function signInUser(name, password, cb, client) {
    // use mail or CN
    var opts = {
      filter: 'mail=' + name,
      scope:  'sub'
    };

    var userExists = false;
    client.search(LDAP_BASE, opts, function (err, res) {
      if (err) {
        return cb(new Error(err.Message));
      }
      res.on('searchEntry', function (entry) {
        userExists = true;
        client.bind(entry.object.dn, password, function (err) {
          if (err) {
            // return cb(new WrongUsernameOrPasswordError('Incorrect Username or Password'));
            return cb(new Error('Incorrect Username or Password'));
          } else {
            var profile = {};
            profile.id =  entry.object.objectGUID || entry.object.uid || entry.object.cn;
            profile.email = entry.object.mail;
            profile.email_verified = true;
            profile.family_name = entry.object.sn;
            profile.user_id = entry.object.uid;
            profile.given_name = entry.object.givenName;
            profile.name = entry.object.cn;
            profile.nickname = entry.object.uid;
            return cb(null, profile);
          }
        });

      });
      res.on('searchReference', function (referral) {

      });
      res.on('error', function (err) {
        return cb(new Error(err.Message));
      });
      res.on('end', function (result) {
        if (!userExists) {
          return cb(new Error(null, 'Incorrect Username or Password'));
        }
      });
    });

  }

}