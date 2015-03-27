var bcrypt = require('bcrypt-nodejs');
var files = require('./files.js');

exports.hash = function (pass, fn) {
  bcrypt.hash(pass, files.cfg['settings']['secretkey'], function(err, result){
      fn(err, result);
  })
};

exports.compare = function(pass, fn) {
  bcrypt.hash(pass, files.cfg['settings']['secretkey'], function(err, result) {
      if(result === files.cfg['settings']['password']){
          fn(err, true);
      }
      else{
          fn(err, false);
      }
  })
};