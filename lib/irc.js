var irc = require('irc');
var files = require('./files.js');
var sockets = require('./sockets.js');
var util = require('util');
exports.servers = {};
var msg_id = {};
var pmsg_id = {};
exports.message = msg_id;
exports.pmessage = pmsg_id;

exports.addMessageToLog = function(from, to, network, s_message, highlight){
    if (!msg_id[network][to]) {
        console.log("No log exists by that name so making a new one");
        msg_id[network][to] = {
            id: 0,
            topic: "",
            msg: {}
        };
    }
    files.compileDate(function (date) {
        msg_id[network][to]['msg'][msg_id[network][to]['id']] = {
            from: from,
            message: s_message,
            highlight: highlight,
            date: date
        };
    });
    msg_id[network][to]['id']++;
    if (msg_id[network][to]['id'] - files.cfg['settings']['scrollback'] > 0) {
        delete msg_id[network][to]['msg'][msg_id[network][to]['id'] - files.cfg['settings']['scrollback']];
    }
};

exports.addPrivateMessageToLog = function(from, network, to, s_message){
    if (pmsg_id[network][to] == null){
        pmsg_id[network][to] = {
            id: 0,
            msg: {}
        };
    }
    pmsg_id[network][to]['id']++;
    if(pmsg_id[network][to]['id'] - files.cfg['settings']['scrollback'] > 0){
        delete pmsg_id[network][to]['msg'][pmsg_id[network][to]['id'] - files.cfg['settings']['scrollback']];
    }
    files.compileDate(function(date){
        pmsg_id[network][to]['msg'][pmsg_id[network][to]['id']] = {
            to: from,
            message: s_message,
            date: date
        };
    });
};

for(var a in files.cfg['servers']){
    var name = files.cfg['servers'][a]['name'];

    console.log("Joining: "+ name);

    exports.servers[name] = new irc.Client(files.cfg['servers'][a]['address'], files.cfg['servers'][a]['username'], {
        userName: files.cfg['settings']['username'],
        realName: files.cfg['settings']['realname'],
        channels: files.cfg['servers'][a]['channels'],
        debug: files.cfg['servers'][a]['debug'],
        password: files.cfg['servers'][a]['password']
    });

    exports.servers[name].name = name;

    msg_id[name] = {
        "irc-daemon-invited": {}
    };

    pmsg_id[name] = {};

    for(var b in files.cfg['servers'][a]['channels']){
        exports.message[name][files.cfg['servers'][a]['channels'][b]] = {};
        exports.message[name][files.cfg['servers'][a]['channels'][b]]['settings'] = {};
        exports.message[name][files.cfg['servers'][a]['channels'][b]]['settings']['topic'] = "";
        exports.message[name][files.cfg['servers'][a]['channels'][b]]['settings']['users'] = [];
        msg_id[name][files.cfg['servers'][a]['channels'][b]] = {
            id: 0,
            topic: "",
            msg: {}
        };
    }


    exports.servers[name].addListener('message#', function(from, to , s_message) {
        // TODO add the server as a message channel.
        var network = this.name;
        files.compileDate(function(date) {
            for (var h in files.cfg['settings']['highlights']) {
                if (s_message.toLowerCase().search(files.cfg['settings']['highlights'][h].toString()) != -1) {
                    exports.addMessageToLog(from, to, network, s_message, true);
                    if (sockets.receive) {
                        sockets.receive(from, network, to, s_message, date, true);
                    }
                    return;
                }
            }
            exports.addMessageToLog(from, to, network, s_message, false);
            if (sockets.receive) {
                sockets.receive(from, network, to, s_message, date, false);
            }
        });
    });

    exports.servers[name].addListener('action', function(from, to, action) {
        var network = this.name;
        if (to.indexOf('#') != -1) {
            exports.addMessageToLog('action:' + from, to, network, action);
            if (sockets.receive) {
                sockets.receive('action:' + from, network, to, action);
            }
        }
        else {
            exports.addPrivateMessageToLog('action:' + from, network, from, action);
            if (sockets.receive) {
                sockets.PMreceive('action:' + from, network, from, action);
            }
        }
    });

    exports.servers[name].addListener('pm', function (from, s_message) {
        var network = this.name;
        exports.addPrivateMessageToLog(from, network, from, s_message);
        if (sockets.receive) {
            sockets.PMreceive(from, network, from, s_message);
        }
        files.compileDate(function(date) {

        });
    });

    exports.servers[name].addListener('notice', function (nick, to, text, s_message) {
        var network = this.name;
        exports.addMessageToLog(nick, to, network, text);
        if (sockets.receive) {
            // TODO Add a notice receiver
        }
    });

    exports.servers[name].addListener('topic', function(channel, topic, nick, message) {
        msg_id[this.name][channel]['topic'] = topic;
        if (sockets.receive) {
            sockets.topic(this.name, channel, topic);
        }
    });

    exports.servers[name].addListener('join', function(channel, nick, message) {
        exports.addMessageToLog('server', channel, this.name, nick + " has joined", false);
        if (sockets.receive) {
            sockets.receive('server', this.name, channel, nick + " has joined");
        }
    });

    exports.servers[name].addListener('part', function(channel, nick, reason, message) {
        if (reason == null) {
            reason = "No reason given";
        }
        exports.addMessageToLog('server', channel, this.name, nick + " has left (" + reason + ")");
        if (sockets.receive) {
            sockets.receive('server', this.name, channel, nick + " has left (" + reason + ")");
        }
    });

    exports.servers[name].addListener('kick', function(channel, nick, by, reason, message) {
        exports.addMessageToLog('server', channel, this.name, nick + " has been kicked by " + by + "(" + reason + ")");
        if (sockets.receive) {
            sockets.receive('server', this.name, channel, nick + " has been kicked by " + by + "(" + reason + ")");
        }
    });

    exports.servers[name].addListener('nick', function(oldnick, nick, channels, message) {
        var network = this.name;
        for (var h in channels){
            exports.addMessageToLog('server', channels[h], network, oldnick + " is now known as " + nick, false);
            if (sockets.receive) {
                sockets.receive('server', network, channels[h], oldnick + " is now known as " + nick, false);
            }
        }
    });

    exports.servers[name].addListener('invite', function(channel, from, message) {
        msg_id[this.name]['irc-daemon-invited'][channel] = null;
        exports.addMessageToLog(from, '*', this.name, 'You have been invited to join ' + channel + ' by ' + from, true, true);
        if (sockets.receive) {
            sockets.receive(from, this.name, '*', 'You have been invited to join ' + channel + ' by ' + from, true);
            sockets.invite(from, this.name, channel);
        }
    });

    exports.servers[name].addListener('error', function(message) {
        console.warn('Error: ' + util.inspect(message));
        if (sockets.receive) {
            sockets.error(util.inspect(message));
        }
        throw message;
    });

}

exports.sendMessage = function(channel, network, s_message){
    files.compileDate(function (date) {
        if (s_message.substring(0, 3) === '/me') {
            exports.sendAction(channel, network, s_message.substring(4));
            return;
        }
        if (s_message.substring(0, 7) === '/invite') {

        }
        if (channel.indexOf('#') != -1) {
            exports.addMessageToLog(files.cfg['servers'][network]['username'], channel, network, s_message, false);
            sockets.receive(files.cfg['servers'][network]['username'], network, channel, s_message, date, false);
        }
        else {
            exports.addPrivateMessageToLog(files.cfg['servers'][network]['username'], network, channel, s_message);
            sockets.PMreceive(files.cfg['servers'][network]['username'], network, channel, s_message, date, true);
        }
        exports.servers[network].say(channel, s_message);
    });
};

exports.sendAction = function(channel, network, action){
    files.compileDate(function(date) {
        if (channel.indexOf('#') != -1) {
            sockets.receive('action:' + files.cfg['servers'][network]['username'], network, channel, action, date, false);
            exports.addMessageToLog('action:' + files.cfg['servers'][network]['username'], channel, network, action, false);
        }
        else {
            exports.addPrivateMessageToLog('action:' + files.cfg['servers'][network]['username'], network, channel, action);
            sockets.PMreceive('action:' + files.cfg['servers'][network]['username'], network, channel, action, date, true);
        }
        exports.servers[network].action(channel, action);
    });
};

exports.joinChannel = function(channel, network){
    exports.servers[network].join(channel);
    files.cfg['servers'][network][channel] = {};
    exports.message[network][channel] = {
        id: 0,
        topic: "",
        msg: {}
    };
};

exports.partChannel = function(channel, network){
    exports.servers[network].part(channel);
    files.cfg['servers'][network][channel] = null;
    exports.message[network][channel] = null;
};

exports.changeNick = function(network, oldnick, newnick){

};

exports.sendCommand = function(network, channel, message){
    if(message.substring(0, 5) === '/kick'){
        var new_message = message.substring(6);
        exports.servers[network].say('ChanServ', 'KICK ' + channel + ' ' + new_message);
    }
};

exports.getChannelList = function(fn){
    var channels = {};
  for(var b in files.cfg['servers']){
      channels[files.cfg['servers'][b]['name']] = {
          name: files.cfg['servers'][b]['name'],
          username: files.cfg['servers'][b]['username'],
          channels: []
      };
      channels[files.cfg['servers'][b]['name']]['channels'] = files.cfg['servers'][b]['channels'];
  }
    fn(channels);
};

