/*
This is the connector that will allow users to connect to an irc server.
This can not be used separately as it is not made to be used without the globals
 */
var irc = require('irc');
var DB = require('./DB');
var Socket = require('./Socket');
var EventEmitter = require('events').EventEmitter;

var Network = function(opt){

    var self = this;

    self.id = opt['_id'];

    self.name = opt['name'];

    self.owner = {
        name: opt['owner']['name'],
        id: opt['owner']['id']
    };
    
    self.user = opt['user'];

    self.nick = opt['nick'];

    self.secure = opt['secure'];

    self.channels = {};

    for(var a in opt['channels']){
        self.channels[opt['channels'][a]] = { users: {}, topic: ''};
    }

    self.connected = false;

    self.event = new EventEmitter();

    self.socket = new Socket.Room(self.owner, self.id, self.id);

    self.opt = opt;

    self.client = new irc.Client(self.opt['network_address'], self.nick, {
        userName: self.user,
        realName: self.user + ' (http://github.com/madjake45/node-irc-daemon/)',
        port: self.opt['network_port'],
        localAddress: null,
        debug: global.Config['development'],
        showErrors: false,
        autoRejoin: true,
        autoConnect: true,
        channels: opt['channels'],
        secure: self.secure,
        selfSigned: false,
        certExpired: false,
        floodProtection: true,
        floodProtectionDelay: 1000,
        sasl: false,
        stripColors: false,
        channelPrefixes: "&#",
        messageSplit: 1024,
        encoding: ''
    });

    //<editor-fold desc="Client Events">

    self.client.on('registered', function(){
        self.nick = self.client.nick;
        self.connected = true;
        self.event.emit('connected', self.connected);
        self.socket.sendConnected(true);
    });

    self.client.on('names', function(channel, nicks){
        self.channels[channel]['users'] = nicks;
        self.event.emit('users', channel, nicks);
        self.socket.sendUsers(channel, nicks);
    });

    self.client.on('nick', function(oldNick, newNick, channels){
        console.log(oldNick, newNick, channels);
        console.log(self.channels[channels[0]]['users']);
        for(var a in channels){
            if(self.channels[channels[a]]){
                self.socket.sendNick(channels[a], oldNick, newNick);
                DB.inputMessage(self.owner.id, self.id, channels[a], 'nick', oldNick, newNick, new Date());
            }
        }
    });

    self.client.on('join', function(channel, nick){
        self.channels[channel]['users'][nick] = '';
        DB.inputMessage(self.owner.id, self.id, channel, 'join', null, nick, new Date());
        self.event.emit('join', channel, nick);
        self.socket.sendJoin(channel, nick, new Date());
    });

    self.client.on('+mode', function(channel, by, mode, argument){
        if(argument){
            switch (mode) {
                case 'v':
                    self.event.emit('+mode', channel, argument, '+v', by);
                    self.socket.sendMode('+v', argument, by, channel, new Date());
                    DB.inputMessage(self.owner.id, self.id, channel, '+mode', argument + ':+v', by, new Date());
                    if(self.channels[channel][argument] != 'o'){
                        self.channels[channel][argument] = '+';
                    }
                    break;

                case 'o':
                    self.event.emit('+mode', channel, argument, '+o', by);
                    self.socket.sendMode('+o', argument, by, channel, new Date());
                    DB.inputMessage(self.owner.id, self.id, channel, '+mode', argument + ':+o', by, new Date());
                    self.channels[channel][argument] = '@';
                    break;

                default :
                    self.event.emit('+mode', channel, argument, mode, by);
                    self.socket.sendMode(mode, argument, by, channel, new Date());
                    DB.inputMessage(self.owner.id, self.id, channel, '+mode', argument + ':' + mode, by, new Date());
                    break;
            }
        }
        else{
            self.event.emit('+mode_channel', channel, mode, by);
            DB.inputMessage(self.owner.id, self.id, channel, '+mode_channel', mode, by, new Date());
            self.socket.sendChannelMode(channel, mode, by, new Date());
        }
    });

    self.client.on('-mode', function(channel, by, mode, argument){
        if(argument){
            switch (mode) {
                case 'v':
                    self.event.emit('-mode', channel, argument, '-v', by);
                    self.socket.sendMode('-v', argument, by, channel, new Date());
                    DB.inputMessage(self.owner.id, self.id, channel, '+mode', argument + ':-v', by, new Date());
                    if(self.channels[channel][argument] != 'o'){
                        self.channels[channel][argument] = '';
                    }
                    break;

                case 'o':
                    self.event.emit('-mode', channel, argument, '-o', by);
                    self.socket.sendMode('-v', argument, by, channel, new Date());
                    DB.inputMessage(self.owner.id, self.id, channel, '-mode', argument + ':-o', by, new Date());
                    if(self.channels[channel][argument] != 'v'){
                        self.channels[channel][argument] = '';
                    }
                    break;

                default :
                    self.event.emit('-mode', channel, argument, mode, by);
                    self.socket.sendMode(mode, argument, by, channel, new Date());
                    DB.inputMessage(self.owner.id, self.id, channel, '-mode', argument + ':' + mode, by, new Date());
                    break;
            }
        }
        else{
            self.event.emit('-mode_channel', channel, mode, by);
            DB.inputMessage(self.owner.id, self.id, channel, '-mode_channel', mode, by, new Date());
            self.socket.sendChannelMode(channel, mode, by, new Date());
        }
    });

    self.client.on('part', function(channel, nick, reason){
        console.log(self.channels[channel]['users']);
        if(self.channels[channel]['users'][nick]) {
            delete self.channels[channel]['users'][nick];
            DB.inputMessage(self.owner.id, self.id, channel, 'part', reason, nick, new Date());
            self.event.emit('part', channel, nick, reason);
            self.socket.sendPart(channel, reason, nick, new Date());
        }
    });

    self.client.on('invite', function(channel, from){
        DB.inputMessage(self.owner.id, self.id, channel, 'invite', null, from, new Date());
        self.event.emit('invite', channel, from);
        self.socket.sendInvite(channel, from, new Date());
    });

    self.client.on('quit', function(nick, reason, channels){
       for(var a in channels){
           if(self.channels[channels[a]]){
               if(self.channels[channels[a]]['users'][nick]) {
                   delete self.channels[channels[a]]['users'][nick];
                   DB.inputMessage(self.owner.id, self.id, channels[a], 'quit', reason, nick, new Date());
                   self.event.emit('quit', channels[a], nick, reason);
                   self.socket.sendQuit(channels[a], nick, reason);
               }
           }
       }
    });

    self.client.on('kick', function(channel, nick, by, reason){
        if(self.channels[channel]['users'].indexOf(nick) > -1) {
            self.channels[channel]['users'].splice(self.channels[channel]['users'].indexOf(nick), 1);
            DB.inputMessage(self.owner.id, self.id, channel, 'kick', nick + '_' + reason, by, new Date());
            self.event.emit('kick', channel, nick, reason, by);
            self.socket.sendKick(channel, reason, nick, by, new Date());
        }
    });

    self.client.on('topic', function(channel, topic, nick) {
        self.channels[channel]['topic'] = topic;
        self.event.emit('topic', channel, topic, nick);
        self.socket.sendTopic(channel, topic, nick, new Date());
    });

    self.client.on('message#', function(nick, channel, text, message){
        DB.inputMessage(self.owner.id, self.id, channel, 'message', text, nick, new Date());
        self.event.emit('message', nick, channel, text);
        if(channel === '*'){
            self.socket.sendServerMessage(text, new Date());
        }
        else {
            self.socket.sendMessage(channel, text, nick, new Date());
        }
    });

    self.client.on('pm', function(nick, text){
        DB.inputMessage(self.owner.id, self.id, null, 'pm', text, nick, new Date());
        self.event.emit('pm', nick, text);
        self.socket.sendPrivateMessage(nick, text, new Date());
    });

    self.client.on('action', function(channel, nick, text){
       DB.inputMessage(self.owner.id, self.id, channel, 'action', text, nick, new Date());
    });

    //</editor-fold>

    //<editor-fold desc="Socket Events">

    self.socket.event.on('network_info', function(){

    });

    self.socket.event.on('server_message', function(message){
        self.client.say('*', message);
        DB.inputMessage(self.owner.id, self.id, '*', 'message', message, self.user, new Date());
    });

    self.socket.event.on('server_connect', function(){
        self.client.connect();
    });

    self.socket.event.on('server_disconnect', function(){
        self.client.disconnect();
    });

    self.socket.event.on('getUsers', function(channel){
        self.socket.sendUsers(channel, self.channels[channel]['users']);
    });

    self.socket.event.on('getBacklog', function(channel, indent, amount){
        DB.getMessages(self.owner.id, self.id, channel, indent, amount, function(docs){
            self.socket.sendBacklog(channel, indent, amount, docs);
        });
    });

    self.socket.event.on('message', function(channel, message){
        self.client.say(channel, message);
        DB.inputMessage(self.owner, self.id, channel, 'message', message, self.user, new Date());
    });

    self.socket.event.on('action', function(channel, message){
        self.client.action(channel, message);
        DB.inputMessage(self.owner, self.id, channel, 'action', message, self.user, new Date());
    });

    self.socket.event.on('part', function(channel, reason){
        self.client.part(channel, reason, function(){
            DB.inputMessage(self.owner, self.id, channel, 'part', reason, self.user, new Date());
        });
    });

    self.socket.event.on('topic', function(channel, topic){
        self.client.send('TOPIC', channel, topic);
        self.channels[channel]['topic'] = topic;
    });

    self.socket.event.on('ban', function(channel, user, reason){
        self.client.send('BAN', channel, user, reason);
        DB.inputMessage(self.owner, self.id, channel, 'ban', reason, self.user, new Date());
    });

    self.socket.event.on('kick', function(channel, user, reason){
        self.client.send('KICK', channel, user, reason);
    });

    self.socket.event.on('nick', function(nick){
        self.client.send('NICK', nick);
        self.nick = nick;
    });

    self.socket.event.on('ctcp', function(channel, type, to, message){
        self.client.ctcp(to, type, message);
    });

    self.socket.event.on('whois', function(user){
        self.client.whois(user, function(data){
            self.socket.sendWhois(data);
        })
    });

    //</editor-fold>

    global.process.once('exiting', function(){
        self.client.disconnect('Shutting Down');
    });
};

exports.Network = Network;