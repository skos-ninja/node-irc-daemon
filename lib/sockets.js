var irc = require('./irc.js');
exports.receive = null;


exports.connect = function(io) {
    io.sockets.on('connection', function (socket){
        console.log("Client has connected");
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
            socket.emit('gotMessages', irc.message);
        });
        socket.on('getUsers', function(channel, network) {
        });
        exports.receive = function(from, network, to ,message, timestamp, highlight) {
            socket.emit('receiveMessage', from, network, to, message, timestamp, highlight);
        };
        exports.PMreceive = function(from, network, message, timestamp) {
            socket.emit('receivePrivateMessage', from, network, message);
        };
        exports.topic = function(channel, network, topic, timestamp) {
          socket.emit('topic', channel, network, topic);
        };
        exports.error = function(err) {
            socket.emit('error', err);
        };
        socket.on('disconnect', function(){
            console.log("Client has disconnected");
        });
    });
};
