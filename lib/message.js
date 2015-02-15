var cfg = require('../config.json');
var channel = require('./channels.js');
var user = require('./user.js');

exports.onMessage = function(channel, message, socket){
    channel.sendFromChannel(channel, message, function(err) {
        if(err) socket.emit('error', err);
    });
};

exports.getMessage = function(channel, number, message, socket){
    socket.emit('getMessage', channel, number, message);
};

exports.receiveMessage = function(from, to, message){
};
