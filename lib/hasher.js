var bcrypt = require('bcrypt-nodejs');
var files = require('./files.js');

exports.hash = function (pass, fn) {
  bcrypt.hash(pass, files.cfg['settings']['secretkey'], function(err, result){
      fn(err, result);
  })
};

exports.hashSync = function(pass) {
    return bcrypt.hashSync(pass, files.cfg['settings']['secretkey']);
};

exports.compare = function(pass, fn) {
    var password = bcrypt.hashSync(pass, files.cfg['settings']['secretkey']);
    if (password === files.cfg['settings']['password']) {
        fn(true);
    }
    else {
        fn(false);
    }
};