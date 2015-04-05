var irc = require('./irc.js');
exports.receive = null;


exports.connect = function(io) {
    io.sockets.on('connection', function (socket){

        socket.on('sendMessage', function(network, channel, message){
            if(network == ''){return;}
            if(channel == ''){return;}
            if(message == ''){return;}
            if(message.substring(0, 3) === '/me'){
                irc.sendMessage(channel, network, message);
                return;
            }
            else if(message.substring(0, 5) === '/kick'){
                console.log(message);
                irc.sendCommand(network, channel, message);
                return;
            }
            else if(message.substring(0, 4) === '/ban'){
                irc.sendCommand(network, channel, message);
                return;
            }
            else if(message.substring(0, 5) === '/unban'){
                irc.sendCommand(network, channel, message);
                return;
            }
            else if(message.substring(0, 1) === '/'){
                irc.sendCommand(network, channel, message);
                return;
            }
            irc.sendMessage(channel, network, message);
        });

        socket.on('getChannelList', function() {
            irc.getChannelList(function(channels) {
                socket.emit('gotChannelList', channels);
            });
        });

        socket.on('getMessages', function() {
            socket.emit('gotMessages', irc.message, irc.pmessage);
        });

        socket.on('getUsers', function(channel, network) {
        });

        exports.receive = function(from, network, to ,message, timestamp, highlight) {
            socket.emit('receiveMessage', from, network, to, message, timestamp, highlight);
        };

        exports.PMreceive = function(from, network, to, message, timestamp, self) {
            socket.emit('receivePrivateMessage', from, network, to, message, timestamp, self);
        };

        exports.topic = function(network, channel, topic) {
          socket.emit('topic', network, channel, topic);
        };

        exports.error = function(err) {
            socket.emit('server_error', err);
        };

        exports.invite = function(from, network, channel) {
            socket.emit('invited', from, network, channel);
        };

        socket.on('disconnect', function(){
        });
    });
};
