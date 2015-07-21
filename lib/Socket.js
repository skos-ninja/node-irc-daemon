/*
This is the implementation of the socket system that the client can talk to.
This should always be required otherwise the Server has no use.
This should only ever have listen events and emit events. It should never perform any functions.
 */
var Main = require('./Main');
var User = require('./User').User;
var DB = require('./DB');
var EventEmitter = require('events').EventEmitter;
var rooms = {};

//<editor-fold desc="Room">

var Room = function(user, name, network_id) {
    var self = this;

    self.name = name;

    self.user = user;

    self.networkId = network_id;

    self.event = new EventEmitter();

    self.client = new EventEmitter();

    rooms[self.name] = self;

    self.client.on('join', function(){
       self.event.emit('network_info');
    });

    self.client.on('server_message', function(message){
        self.event.emit('server_message', message);
    });

    self.client.on('sever_connect', function(){
        self.event.emit('server_connect');
    });

    self.client.on('server_disconnect', function(){
        self.event.emit('server_disconnect');
    });

    self.client.on('getUsers', function(channel){
        self.event.emit('getUsers', channel);
    });

    self.client.on('getBacklog', function(obj){
        self.event.emit('getBacklog', obj['channel'], obj['indent'], obj['amount']);
    });

    self.client.on('nick', function (obj) {
        self.event.emit('nick', obj['nick']);
    });

    self.client.on('message', function (obj) {
        self.event.emit('message', obj['channel'], obj['message']);
    });

    self.client.on('action', function (obj) {
        self.event.emit('action', obj['channel'], obj['message']);
    });

    self.client.on('part', function (obj) {
        self.event.emit('part', obj['channel'], obj['message']);
    });

    self.client.on('topic', function (obj) {
        self.event.emit('topic', obj['channel'], obj['topic']);
    });

    self.client.on('ban', function (obj) {
        self.event.emit('ban', obj['to'], obj['channel'], obj['reason']);
    });

    self.client.on('kick', function (obj) {
        self.event.emit('kick', obj['channel'], obj['to'], obj['reason']);
    });

    self.client.on('ctcp', function (obj) {
        self.event.emit('ctcp', obj['channel'], obj['type'], obj['to'], obj['message']);
    });

    self.client.on('whois', function (user) {
        self.event.emit('whois', user);
    });

};

Room.prototype.sendConnected = function(){
    Main.Handler.emit(this.name, this.user, 'server_connect', this.name);
};

Room.prototype.sendDisconnect = function(){
    Main.Handler.emit(this.name, this.user, 'server_disconnect', this.name);
};

Room.prototype.joinInfo = function(obj){
    Main.Handler.emit(this.name, this.user, 'network_info', {room:this.name, obj:obj});
};

Room.prototype.sendBacklog = function(channel, indent, amount, messages){
    Main.Handler.emit(this.name, this.user, 'backlog', {room:this.name, channel:channel, indent:indent, amount:amount, messages:messages});
};

Room.prototype.sendServerMessage = function(message, time){
    Main.Handler.emit(this.name, this.user, 'server_message', {room:this.name, message:message, time:time});
};

Room.prototype.sendMessage = function(channel, message, from, time){
    Main.Handler.emit(this.name, this.user, 'message', {room:this.name, channel:channel, message:message, from:from, time:time});
};

Room.prototype.sendPrivateMessage = function(from, message, time){
    Main.Handler.emit(this.name, this.user, 'private_message', {room:this.name, from:from, message:message, time:time});
};

Room.prototype.sendRaw = function(type, message, from, time){
    Main.Handler.emit(this.name, this.user, 'raw', {room:this.name, type:type, message:message, from:from, time:time});
};

Room.prototype.sendAction = function(message, from, time){
    Main.Handler.emit(this.name, this.user, 'action', {room:this.name, message:message, from:from, time:time});
};

Room.prototype.sendNotice = function(message, from, time){
    Main.Handler.emit(this.name, this.user, 'notice', {room:this.name, message:message, from:from, time:time});
};

Room.prototype.sendPart = function(channel, message, user, time){
    Main.Handler.emit(this.name, this.user, 'part', {room:this.name, channel:channel, message:message, user:user, time:time});
};

Room.prototype.sendJoin = function(channel, from, time){
    Main.Handler.emit(this.name, this.user, 'join', {room:this.name, channel:channel, from:from, time:time});
};

Room.prototype.sendCTCP = function(type, message, from, time){
    Main.Handler.emit(this.name, this.user, 'ctcp', {room:this.name, type:type, message:message, from:from, time:time});
};

Room.prototype.sendKick = function(channel, reason, to, from, time){
    Main.Handler.emit(this.name, this.user, 'kick', {room:this.name, reason:reason, to:to, from:from, time:time});
};

Room.prototype.sendQuit = function(channel, nick, reason){
    Main.Handler.emit(this.name, this.user, 'quit', {room:this.name, channel:channel, nick:nick, reason:reason});
};

Room.prototype.sendInvite = function(channel, from, time){
   Main.Handler.emit(this.name, this.user, 'invite', {room:this.name, channel:channel, from:from, time:time});
};

Room.prototype.sendTopic = function(channel, topic, from, time){
    Main.Handler.emit(this.name, this.user, 'topic', {room:this.name, channel:channel, topic:topic, from:from, time:time});
};

Room.prototype.sendUsers = function(channel, users){
    Main.Handler.emit(this.name, this.user, 'users', {room:this.name, channel:channel, users:users});
};

Room.prototype.sendNick = function(channel, oldNick, newNick){
    Main.Handler.emit(this.name, this.user, 'nick', {room:this.name, channel:channel, oldNick:oldNick, newNick:newNick});
};

Room.prototype.sendMode = function(mode, user, by, channel, time){
    Main.Handler.emit(this.name, this.user, 'mode', {room:this.name, channel:channel, mode:mode, user:user, by:by, time:time});
};

Room.prototype.sendChannelMode = function(channel, mode, by, time){
    Main.Handler.emit(this.name, this.user, 'channel_mode', {room:this.name, channel:channel, mode:mode, by:by, time:time});
};

Room.prototype.sendWhois = function(user, data){
    Main.Handler.emit(this.name, this.user, 'whois', {room:this.name, user:user, data:data});
};

Room.prototype.remove = function(){
    Main.Handler.emit(this.name, this.user, 'roomRemoved', this.name);
    this.destroy();
};

exports.Room = Room;

//</editor-fold>

//<editor-fold desc="UserRoom">

var UserRoom = function(user, name){
    var self = this;

    self.user = user;

    self.name = name;

    self.event = new EventEmitter();

    self.client = new EventEmitter();

    rooms[self.name] = self;

    self.client.on('update_info', function(obj){
        self.event.emit('update_info', obj);
    });

    self.client.on('getNetworks', function(){
       self.event.emit('getNetworks');
    });

    self.client.on('update_settings', function(settings){
        self.event.emit('update_settings', settings);
    });

};

UserRoom.prototype.giveInfo = function(info){
    Main.Handler.emit(this.name, this.user, 'giveInfo', {room: this.name, info: info});
};

UserRoom.prototype.giveNetworks = function(networks){
    Main.Handler.emit(this.name, this.user, 'giveNetworks', {room: this.name, networks:networks});
};

UserRoom.prototype.giveSettings = function(settings){
    Main.Handler.emit(this.name, this.user, 'giveSettings', {room:this.name, settings:settings});
};

exports.UserRoom = UserRoom;
//</editor-fold>

//<editor-fold desc="WebSocket">
var Socket = function(address, port) {
    if (global.Config['websocket']) {
        var io = require('socket.io').listen(port);
        var self = this;
        self.io = io;
        self.io.on('connection', function (socket) {

            socket.identified = false;

            if (global.Config['development']) {
                console.log('[Websocket] Connection: ' + socket.remoteAddress + ':' + socket.remotePort);
            }

            global.process.once('exiting', function () {
                io.emit('exiting');
            });

            socket.on('message', function (obj) {
                if (socket.identified) {
                    handler.clientEmit(obj['room'], socket.identified, obj['type'], obj['data']);
                }
                else{
                    socket.emit('ident_err', 'not_logged_in');
                }
            });

            socket.on('identify', function (obj) {
                DB.identify(obj['ident'], obj['pass'], function (result, user) {
                    if (result) {
                        socket.identified = user['_id'];
                        socket.emit('ident_confirm', user['networksList']);
                        socket.join(user['username']);
                        for (var a in user['networks']) {
                            socket.join(user['networks'][a].id);
                            socket.emit('room_join', user['networks'][a].id, user['networks'][a].name, user['networks'][a].nick);
                        }
                    }
                    else {
                        socket.emit('ident_error', result);
                    }
                });
            });

            socket.on('loaduser', function (pid, username) {
                if (!Main.Users[username]) {
                    if (pid == global.process.pid) {
                        DB.getUser(username, function (user) {
                            Main.Users[username] = new User(user);
                        });
                    }
                }
            });

            socket.on('unloaduser', function (pid, username) {
                if (Main.Users[username]) {
                    if (pid == global.process.pid) {
                        Main.Users[username].remove();
                    }
                }
            });

            socket.on('logout', function (ident) {
                socket.disconnect();
                socket.leaveAll();
            });

            socket.on('disconnect', function () {
                if (global.Config['development']) {
                    console.log(new Date() + ' - User has disconnected');
                }
            });
        });
    }
};
//</editor-fold>

//<editor-fold desc="TCP">
var TCP = function(address, port) {
        var net = require('net');
        var self = this;
        self.users = {};
        self.identifiedClients = {};
        self.unidentifiedClients = {};
        self.net = net.createServer(function (socket) {

            socket.identified = false;

            self.unidentifiedClients[socket.remoteAddress + ':' + socket.remotePort] = {
                address: socket.remoteAddress,
                port: socket.remotePort,
                identified: null,
                rooms: []
            };

            if (global.Config['development']) {
                console.log('[TCP] Connection: ' + socket.remoteAddress + ':' + socket.remotePort);
                socket.write('ping');
            }

            global.process.once('exiting', function () {
                //socket.write('exiting');
            });

            socket.on('message', function (obj) {
                console.log(obj);
                if (socket.identified) {
                    Main.Handler.clientEmit(obj['room'], socket.identified, obj['type'], obj['data']);
                    return
                }
                socket.write('ident_err', 'not_logged_in');
            });

            socket.on('data', function(data){
                console.log(data);
                switch (data[0]){
                    case 'identify' :
                        var obj = data[1];
                        console.log(obj);
                        DB.identify(obj['ident'], obj['pass'], function (result, user) {
                            if (result) {
                                socket.identified = user['_id'];
                                socket.write(['ident_confirm', user['networksList']]);
                                if(!self.users[user['_id']]){
                                    self.users[user['_id']] = {
                                        id: user['_id'],
                                        clients: []
                                    };
                                }
                                self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort] = self.unidentifiedClients[socket.remoteAddress + ':' + socket.remotePort];
                                delete self.unidentifiedClients[socket.remoteAddress + ':' + socket.remotePort];
                                self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]['identified'] = user['_id'];
                                self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]['socket'] = socket;
                            }
                            else {
                                socket.write(['ident_error', result]);
                            }
                        });
                        break;
                    case 'logout' :
                        if(self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]){
                            self.users[self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]]['clients'] = self.users[self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]]['clients'].split(self.users[self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]]['clients'].indexOf(socket.remoteAddress + ':' + socket.remotePort), 1);
                            delete self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort];
                        }
                        else if(self.unidentifiedClients[socket.remoteAddress + ':' + socket.remotePort]){
                            delete self.unidentifiedClients[socket.remoteAddress + ':' + socket.remotePort];
                        }
                        break;
                    default :
                        if(data.length != 3){
                            socket.write(['error', 'Incorrect Object Length']);
                        }
                        else{
                            Main.Handler.clientEmit(data[0], data[1], data[2]);
                        }
                        break;
                }
            });

            socket.on('close', function () {
                if (global.Config['development']) {
                    console.log('[TCP] Disconnection: ' + socket.remoteAddress + ':' + socket.remotePort);
                }
                if(self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]){
                    self.users[self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]]['clients'] = self.users[self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]]['clients'].split(self.users[self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort]]['clients'].indexOf(socket.remoteAddress + ':' + socket.remotePort), 1);
                    delete self.identifiedClients[socket.remoteAddress + ':' + socket.remotePort];
                }
                else if(self.unidentifiedClients[socket.remoteAddress + ':' + socket.remotePort]){
                    delete self.unidentifiedClients[socket.remoteAddress + ':' + socket.remotePort];
                }
            });
        }).listen(port, address);
};
//</editor-fold>

//<editor-fold desc="Handler">
    var Handler = function(bind, websocket_port, tcp_port, websocket, tcp){
        if(websocket){
            this.websocket = new Socket(bind, websocket_port);
        }
        if(tcp){
            this.tcp = new TCP(bind, tcp_port);
        }
    };

    Handler.prototype.emit = function(room, user, event, data){
        if(this.websocket){
            if(!room){
                this.websocket.io.emit(event, data);
            }
            else{
                this.websocket.io.in(room).emit(event, data);
            }
        }
        if(this.tcp){
            if(this.tcp.users[user]) {
                for (var a in this.tcp.users[user]['clients']) {
                    this.tcp.identifiedClients[this.tcp.users[user]['clients'][a]]['socket'].write([room, event, data]);
                }
            }
        }
    };

    Handler.prototype.clientEmit = function(room, user, type, data){
        if (rooms[room].user == user) {
            rooms[room].client.emit(type, data);
        }
    };

    exports.Handler = Handler;
//</editor-fold>