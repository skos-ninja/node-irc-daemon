var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');
var date = require('strftime');
var config;
try{
    if(process.argv[2] === '--setup'){
        console.warn('Rerunning setup. This will override your current config');
        exports.setup = true;
    }
    else {
        config = require('../config.json');
        exports.setup = false;
    }
}
catch(e) {
    config = require('../config_example.json');
    console.log('No config so running setup');
    exports.setup = true;
}

exports.cfg = config;

exports.authkey = "";

exports.saveConfig = function() {
    fs.writeFile('./config.json', JSON.stringify(exports.cfg), function (err) {
        if (err) throw err;
        console.log('Config Saved!');
    });

};

exports.compileDate = function(fn){
    fn(date('%H:%M:%S %d %B, %Y'));
};

if (exports.cfg['settings']['secretkey'] === ''){
    console.log('Generating Secret Key');
    exports.cfg['settings']['secretkey'] = bcrypt.genSaltSync(10000);
    console.log('Your secret key is as follows: ' + exports.cfg['settings']['secretkey']);
    exports.saveConfig();
}