var cfg = require('../config.json');
var hash = require('./hash.js');

exports.checklogin = function(req, res, password) {
    if (cfg['settings']['password'] === password){
        hash.hash(req.connection.remoteAddress, function(err, hash){
            console.log(hash);
           exports.user['authkey'] = hash;
        });
        res.cookie('auth', exports.user['authkey'], {signed: true, maxAge: (60*60*60*60*60*60*60)});
        return true;
    }
    else {
     return false;
    }
};

exports.checkcookie = function(req, res, authcookie) {
    if(authcookie === exports.user['authkey']){
        return true;
    }
    else{
        res.cookies.authkey = null;
        return false;
    }
};

exports.logout = function(req, res) {

};

exports.user = {
    "name": "",
    "authkey": null
};