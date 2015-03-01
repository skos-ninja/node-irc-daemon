var irc = require('irc');
var channels = require('./channels.js');
var sockets = require('./sockets.js');
var cfg = require('../config.json');
exports.servers = {};
var msg_id = {};
var pmsg_id = {};
var scrollback = cfg['settings']['scrollback'];
var date = new Date();
exports.message = msg_id;
exports.pmessage = pmsg_id;

function addMessageToLog(from, to, network, s_message){
    if (msg_id[network][to] == null){
        msg_id[network][to] = {
            id: 0,
            msg: {}
        };
    }
    msg_id[network][to]['id']++;
    if(msg_id[network][to]['id'] - scrollback > 0){
        msg_id[network][to]['msg'][msg_id[network][to]['id'] - scrollback] = null;
    }
    msg_id[network][to]['msg'][msg_id[network][to]['id']] = {
        from: from,
        message: s_message,
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
}

function addPrivateMessageToLog(from, network, s_message){
    if (pmsg_id[network][from] == null){
        pmsg_id[network][from] = {
            id: 0,
            msg: {}
        };
    }
    pmsg_id[network][from]['id']++;
    if(pmsg_id[network][from]['id'] - scrollback > 0){
        pmsg_id[network][from]['msg'][pmsg_id[network][from]['id'] - scrollback] = null;
    }
    pmsg_id[network][from]['msg'][pmsg_id[network][from]['id']] = {
        from: from,
        message: s_message,
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
}

// Should only be used when only two args exist and the first only consists of one word
function splitCommand(message, fn) {
    var first = message.substring(0, message.indexOf(' '));
}

for(var a in cfg['servers']){
    var name = cfg['servers'][a]['name'];
    console.log("Joining: "+name);
    exports.servers[name] = new irc.Client(cfg['servers'][a]['address'], cfg['servers'][a]['username'], {
        channels: cfg['servers'][a]['channels'],
        debug: cfg['servers'][a]['debug'],
        password: cfg['servers'][a]['password']
    });
    exports.message[cfg['servers'][a]['name']] = {
        name: cfg['servers'][a]['name'],
        pm: {}
    };
    msg_id[cfg['servers'][a]['name']] = {};
    pmsg_id[cfg['servers'][a]['name']] = {};
    for(var b in cfg['servers'][a]['channels']){
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]] = {};
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]]['settings'] = {};
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]]['settings']['topic'] = "";
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]]['settings']['users'] = [];
        msg_id[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]] = {
            id: 0,
            topic: "",
            msg: {}
        };
    }
    exports.servers[name].addListener('message#', function(from, to , s_message){
        for (var b in cfg['servers']){
            if (cfg['servers'][b]['address'] === this.opt.server){
                addMessageToLog(from, to, cfg['servers'][b]['name'], s_message);
                if(sockets.receive) {
                    sockets.receive(from, cfg['servers'][b]['name'], to, s_message);
                }
            }
        }
    });

    exports.servers[name].addListener('action', function(from, to, action) {
        for (var b in cfg['servers']){
            if (cfg['servers'][b]['address'] === this.opt.server){
                addMessageToLog('action', to, cfg['servers'][b]['name'], action);
                if(sockets.receive) {
                    sockets.receive('action:'+ from, cfg['servers'][b]['name'], to, action);
                }
            }
        }
    });


    exports.servers[name].addListener('pm', function (from, s_message) {
        for (var b in cfg['servers']){
            if (cfg['servers'][b]['address'] === this.opt.server){
                addPrivateMessageToLog(from, cfg['servers'][b]['name'], s_message);
                if(sockets.receive) {
                    sockets.PMreceive(from, cfg['servers'][b]['name'], s_message);
                }
            }
        }
    });

    exports.servers[name].addListener('notice', function (nick, to, text, s_message) {
        for (var b in cfg['servers']){
            if (cfg['servers'][b]['address'] === this.opt.server){
                addMessageToLog(nick, to, cfg['servers'][b]['name'], text);
                if(sockets.receive) {
                }
            }
        }
    });

    exports.servers[name].addListener('topic', function(channel, topic, nick, message) {
        for (var b in cfg['servers']){
            if (cfg['servers'][b]['address'] === this.opt.server) {
                msg_id[cfg['servers'][b]['name']][channel]['topic'] = topic;
                if (sockets.receive) {
                    sockets.topic(channel, cfg['servers'][b]['name'], topic);
                }
            }
        }
    });

    exports.servers[name].addListener('join', function(channel, nick, message) {
        for (var b in cfg['servers']){
            if (cfg['servers'][b]['address'] === this.opt.server) {
                addMessageToLog('server', channel, cfg['servers'][b]['name'], nick + " has joined");
                if (sockets.receive) {
                    sockets.receive('server', cfg['servers'][b]['name'], channel, nick + " has joined");
                }
            }
        }
    });

    exports.servers[name].addListener('part', function(channel, nick, reason, message) {
       for (var b in cfg['servers']){
           if (cfg['servers'][b]['address'] === this.opt.server) {
               if (reason == null){reason = "No reason given";};
                addMessageToLog('server', channel, cfg['servers'][b]['name'], nick + " has left (" + reason + ")");
                if (sockets.receive) {
                    sockets.receive('server', cfg['servers'][b]['name'], channel, nick + " has left (" + reason + ")");
                }
           }
       }
    });

    exports.servers[name].addListener('kick', function(channel, nick, by, reason, message) {
        for (var b in cfg['servers']){
            if (cfg['servers'][b]['address'] === this.opt.server) {
                addMessageToLog('server', channel, cfg['servers'][b]['name'], nick + " has been kicked by " + by + "(" + reason + ")");
                if (sockets.receive) {
                    sockets.receive('server', cfg['servers'][b]['name'], channel, nick + " has been kicked by " + by + "(" + reason + ")");
                }
            }
        }
    });

    exports.servers[name].addListener('error', function(message) {
        console.warn('Error: ' + message);
        throw message;
    });

}
exports.sendMessage = function(channel, network, s_message){
    if (s_message.substring(0, 3) === '/me'){
        exports.sendAction(channel, network, s_message.substring(4));
        return;
    }
    if(channel.indexOf('#') != -1) {
        addMessageToLog(cfg['servers'][network]['username'], channel, network, s_message);
    }
    else {
        addPrivateMessageToLog(cfg['servers'][network]['username'], network, s_message);
    }
    exports.servers[network].say(channel, s_message);
};

exports.sendAction = function(channel, network, action){
    exports.servers[network].action(channel, action);
};

exports.joinChannel = function(channel, network){
    exports.servers[network].join(channel);
    cfg['servers'][network][channel] = {};
    exports.message[network][channel] = {};
};

exports.partChannel = function(channel, network){
    exports.servers[network].part(channel);
    cfg['servers'][network][channel] = null;
    exports.message[network][channel] = null;
};

exports.sendCommand = function(network, channel, message){
    if(message.substring(0, 5) === '/kick'){
        var new_message = message.substring(6);
        exports.servers[network].say('ChanServ', 'KICK ' + channel + ' ' + new_message);
    }
};
exports.getChannelList = function(fn){
    var channels = {};
  for(var b in cfg['servers']){
      channels[cfg['servers'][b]['name']] = {
          name: cfg['servers'][b]['name'],
          username: cfg['servers'][b]['username'],
          channels: []
      };
      channels[cfg['servers'][b]['name']]['channels'] = cfg['servers'][b]['channels'];
  }
    fn(channels);
};