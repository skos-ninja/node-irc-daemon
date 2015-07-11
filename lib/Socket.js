/*
This is the implementation of the socket system that the client can talk to.
This should always be required otherwise the Server has no use.
This should only ever have listen events and emit events. It should never perform any functions.
 */
var Network = require('./Network');
var Main = require('./Main');
var User = require('./User').User;
var DB = require('./DB');
var io = require('socket.io').listen(global.Config['socket_port']);
var EventEmitter = require('events').EventEmitter;
var rooms = {};
global.io = io;

console.log('Socket.io now listening on port ' + global.Config['socket_port']);

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
    global.io.in(this.name).emit('server_connect', this.name);
};

Room.prototype.sendDisconnect = function(){
    global.io.in(this.name).emit('server_disconnect', this.name);
};

Room.prototype.joinInfo = function(obj){
    global.io.in(this.name).emit('network_info', this.name, obj);
};

Room.prototype.sendBacklog = function(channel, indent, amount, messages){
    global.io.in(this.name).emit('backlog', this.name, channel, indent, amount, messages);
};

Room.prototype.sendServerMessage = function(message, time){
    global.io.in(this.name).emit('server_message', this.name, message, time);
};

Room.prototype.sendMessage = function(channel, message, from, time){
    global.io.in(this.name).emit('message', this.name, channel, message, from, time);
};

Room.prototype.sendPrivateMessage = function(from, message, time){
    global.io.in(this.name).emit('private_message', this.name, from, message, time);
};

Room.prototype.sendRaw = function(type, message, from, time){
    global.io.in(this.name).emit('raw', this.name, type, message, from, time);
};

Room.prototype.sendAction = function(message, from, time){
    global.io.in(this.name).emit('action', this.name, message, from, time);
};

Room.prototype.sendNotice = function(message, from, time){
    global.io.in(this.name).emit('notice', this.name, message, from, time);
};

Room.prototype.sendPart = function(channel, message, user, time){
    global.io.in(this.name).emit('part', this.name, channel, message, user, time);
};

Room.prototype.sendJoin = function(channel, from, time){
    global.io.in(this.name).emit('join', this.name, channel, from, time);
};

Room.prototype.sendCTCP = function(type, message, from, time){
    global.io.in(this.name).emit('ctcp', this.name, type, message, from, time);
};

Room.prototype.sendKick = function(channel, reason, to, from, time){
    global.io.in(this.name).emit('kick', this.name, reason, to, from, time);
};

Room.prototype.sendQuit = function(channel, nick, reason){
    global.io.in(this.name).emit('quit', this.name, channel, nick, reason);
};

Room.prototype.sendInvite = function(channel, from, time){
   global.io.in(this.name).emit('invite', this.name, channel, from, time);
};

Room.prototype.sendTopic = function(channel, topic, from, time){
    global.io.in(this.name).emit('topic', this.name, channel, topic, from, time);
};

Room.prototype.sendUsers = function(channel, users){
    global.io.in(this.name).emit('users', this.name, channel, users);
};

Room.prototype.sendNick = function(channel, oldNick, newNick){
    global.io.in(this.name).emit('nick', this.name, channel, oldNick, newNick);
};

Room.prototype.sendMode = function(mode, user, by, channel, time){
    global.io.in(this.name).emit('mode', this.name, channel, mode, user, by, time);
};

Room.prototype.sendChannelMode = function(channel, mode, by, time){
    global.io.in(this.name).emit('channel_mode', this.name, channel, mode, by, time);
};

Room.prototype.sendWhois = function(user, data){
    global.io.in(this.name).emit('whois', this.name, user, data);
};

Room.prototype.remove = function(){
    global.io.in(this.name).emit('roomRemoved', this.name);
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
    global.io.in(this.name).emit('giveInfo', this.name, info);
};

UserRoom.prototype.giveNetworks = function(networks){
    global.io.in(this.name).emit('giveNetworks', this.name, networks);
};

UserRoom.prototype.giveSettings = function(settings){
    global.io.in(this.name).emit('giveSettings', this.name, settings);
};

exports.UserRoom = UserRoom;
//</editor-fold>

global.io.on('connection', function(socket){

    socket.identified = false;

    if(global.Config['development']){
        console.log( new Date() + ' - User has connected');
    }

    global.process.once('exiting', function(){
        io.emit('exiting');
    });

    socket.on('message', function(obj){
        if(socket.identified){
            if(rooms[obj['room']].user == socket.identified){
                rooms[obj['room']].client.emit(obj['type'], obj['data']);
                return
            }
        }
        socket.emit('ident_err', 'not_logged_in');
    });

    socket.on('identify', function(obj){
        DB.identify(obj['ident'], obj['pass'], function(result, user){
            if(result){
                socket.identified = user['_id'];
                socket.emit('ident_confirm', user['networksList']);
                socket.join(user['username']);
                for(var a in user['networks']){
                    socket.join(user['networks'][a].id);
		            socket.emit('room_join', user['networks'][a].id, user['networks'][a].name, user['networks'][a].nick);
                }
            }
            else{
                socket.emit('ident_error', result);
            }
        });
    });

    socket.on('loaduser', function(pid, username){
        if(!Main.Users[username]){
            if(pid == global.process.pid) {
                DB.getUser(username, function (user) {
                    Main.Users[username] = new User(user);
                });
            }
        }
    });

    socket.on('unloaduser', function(pid, username){
        if(Main.Users[username]){
            if(pid == global.process.pid){
                Main.Users[username].remove();
            }
        }
    });

    socket.on('logout', function(ident){
        socket.disconnect();
        socket.leaveAll();
    });

    socket.on('disconnect', function(){
        if(global.Config['development']){
            console.log(new Date() + ' - User has disconnected');
        }
    })
});