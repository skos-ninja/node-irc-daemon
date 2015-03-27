var files = require('./files.js');
var irc = require('./irc.js');
var irc_lib = require('irc');
var sockets = require('./sockets.js');

exports.addServer = function(name, address, port, username, password, channels, fn) {
  if(files.cfg['servers'][name] != null){
      fn("Server already exists", null);
  }
  else{
      files.cfg['servers'][name] = {
          name: name,
          address: address,
          port: port,
          username: username,
          password: password,
          reconnect: true,
          debug: false,
          channels: [
              channels
          ]
      };
      irc.servers[name] = new irc_lib.Client(files.cfg['servers'][name]['address'], files.cfg['servers'][name]['username'], {
          userName: files.cfg['settings']['username'],
          realName: files.cfg['settings']['realname'],
          channels: files.cfg['servers'][name]['channels'],
          debug: files.cfg['servers'][name]['debug'],
          password: files.cfg['servers'][name]['password']
      });

      irc.servers[name].name = name;

      irc.message[name] = {
          "irc-daemon-invited": {}
      };

      irc.pmessage[name] = {};

      for(var b in files.cfg['servers'][name]['channels']){
          irc.message[name][files.cfg['servers'][name]['channels'][b]] = {};
          irc.message[name][files.cfg['servers'][name]['channels'][b]]['settings'] = {};
          irc.message[name][files.cfg['servers'][name]['channels'][b]]['settings']['topic'] = "";
          irc.message[name][files.cfg['servers'][name]['channels'][b]]['settings']['users'] = [];
          irc.message[name][files.cfg['servers'][name]['channels'][b]] = {
              id: 0,
              topic: "",
              msg: {}
          };
      }


      irc.servers[name].addListener('message#', function(from, to , s_message) {
          var network = this.name;
          files.compileDate(function(date) {
              for (var h in files.cfg['settings']['highlights']) {
                  if (s_message.toLowerCase().search(files.cfg['settings']['highlights'][h].toString()) != -1) {
                      irc.addMessageToLog(from, to, network, s_message, true);
                      if (sockets.receive) {
                          sockets.receive(from, network, to, s_message, date, true);
                      }
                      return;
                  }
              }
              irc.addMessageToLog(from, to, network, s_message, false);
              if (sockets.receive) {
                  sockets.receive(from, network, to, s_message, date, false);
              }
          });
      });

      irc.servers[name].addListener('action', function(from, to, action) {
          var network = this.name;
          if (to.indexOf('#') != -1) {
              irc.addMessageToLog('action:' + from, to, network, action);
              if (sockets.receive) {
                  sockets.receive('action:' + from, network, to, action);
              }
          }
          else {
              irc.addPrivateMessageToLog('action:' + from, network, from, action);
              if (sockets.receive) {
                  sockets.PMreceive('action:' + from, network, from, action);
              }
          }
      });

      irc.servers[name].addListener('pm', function (from, s_message) {
          var network = this.name;
          irc.addPrivateMessageToLog(from, network, from, s_message);
          if (sockets.receive) {
              sockets.PMreceive(from, network, from, s_message);
          }
          files.compileDate(function(date) {

          });
      });

      irc.servers[name].addListener('notice', function (nick, to, text, s_message) {
          var network = this.name;
          irc.addMessageToLog(nick, to, network, text);
          if (sockets.receive) {
              // TODO Add a notice receiver
          }
      });

      irc.servers[name].addListener('topic', function(channel, topic, nick, message) {
          irc.message[this.name][channel]['topic'] = topic;
          if (sockets.receive) {
              sockets.topic(channel, this.name, topic);
          }
      });

      irc.servers[name].addListener('join', function(channel, nick, message) {
          irc.addMessageToLog('server', channel, this.name, nick + " has joined", false);
          if (sockets.receive) {
              sockets.receive('server', this.name, channel, nick + " has joined");
          }
      });

      irc.servers[name].addListener('part', function(channel, nick, reason, message) {
          if (reason == null) {
              reason = "No reason given";
          }
          irc.addMessageToLog('server', channel, this.name, nick + " has left (" + reason + ")");
          if (sockets.receive) {
              sockets.receive('server', this.name, channel, nick + " has left (" + reason + ")");
          }
      });

      irc.servers[name].addListener('kick', function(channel, nick, by, reason, message) {
          irc.addMessageToLog('server', channel, this.name, nick + " has been kicked by " + by + "(" + reason + ")");
          if (sockets.receive) {
              sockets.receive('server', this.name, channel, nick + " has been kicked by " + by + "(" + reason + ")");
          }
      });

      irc.servers[name].addListener('nick', function(oldnick, nick, channels, message) {
          var network = this.name;
          for (var h in channels){
              irc.addMessageToLog('server', channels[h], network, oldnick + " is now known as " + nick, false);
              if (sockets.receive) {
                  sockets.receive('server', network, channels[h], oldnick + " is now known as " + nick, false);
              }
          }
      });

      irc.servers[name].addListener('invite', function(channel, from, message) {
          irc.message[this.name]['irc-daemon-invited'][channel] = null;
          irc.addMessageToLog(from, '*', this.name, 'You have been invited to join ' + channel + ' by ' + from, true, true);
          if (sockets.receive) {
              sockets.receive(from, this.name, '*', 'You have been invited to join ' + channel + ' by ' + from, true);
              sockets.invite(from, this.name, channel);
          }
      });

      irc.servers[name].addListener('error', function(message) {
          console.warn('Error: ' + util.inspect(message));
          throw message;
      });
      files.saveConfig();
      fn(null, "Server added and connected to");
  }
};

exports.removeServer = function(name) {
    irc.servers[name].disconnect('Node IRC Daemon says good bye!');
    delete files.cfg['servers'][name];
    files.saveConfig();
};