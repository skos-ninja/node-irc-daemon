var cfg = require('../config.json');
var message = require('./message.js');
var user = require('./user.js');
var irc = require('./irc.js');

exports.channel = cfg['channels'];

exports.addChannel = function(channel){
    irc.joinChannel(channel)
};

exports.removeChannel = function(channel){
  exports.channel[channel] = null;
};

exports.sendFromChannel = function(channel, message){
    irc.sendMessage(channel, message);
};