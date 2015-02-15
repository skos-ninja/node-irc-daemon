var irc = require('irc');
var channels = require('./channels.js');
var sockets = require('./sockets.js');
var cfg = require('../config.json');
exports.servers = {};
exports.message = {};
var msg_id = 0;
var pmsg_id = 0;
var date = new Date();

function addMessageToLog(from, to, network, s_message){
    if (exports.message[network][to] == null){
        exports.message[network][to] = {};
    }
    msg_id++;
    exports.message[network][to][msg_id] = {
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
    if (exports.message[network]['pm'][from] == null){
        exports.message[network]['pm'][from] = {};
    }
    pmsg_id++;
    exports.message[network]['pm'][from][pmsg_id] = {
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
    for(var b in cfg['servers'][a]['channels']){
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]] = {};
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]]['settings'] = {};
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]]['settings']['topic'] = "";
        exports.message[cfg['servers'][a]['name']][cfg['servers'][a]['channels'][b]]['settings']['users'] = [];
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
                exports.message[cfg['servers'][b]['name']][channel]['settings']['topic'] = topic;
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
        for (var b in cfg['servers'][b]['address']){
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
    if(message.substring(0, ))
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