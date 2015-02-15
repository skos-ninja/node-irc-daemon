var fs = require('fs');
var cfg = require('../config.json');

exports.writeCfg = function(data){
    if(data != cfg) {
        fs.writeFile("../config.json", data, function (err) {
            if (err) throw err
        });
    }
};

exports.writeLog = function(filename, data){
    fs.write("../logs/"+ filename +".log", data, function(err){
        if(err) throw err
    });
};