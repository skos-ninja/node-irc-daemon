var Socket = require('./Socket');
var DB = require('./DB');
var User = require('./User').User;
var Console = require('./Console');

/*
Finished loading required libs.
Now will load each user as required. This is to make sure that after a restart the user will have it's irc auto connect.
 */
exports.Handler = new Socket.Handler(global.Config['bind_address'], global.Config['bind_port_socket'], global.Config['bind_port_tcp'], global.Config['websocket'], global.Config['tcp']);

global.process.on('db_ready', function(){
    exports.DB = DB;
    if(!exports.Users) {
        exports.Users = {};
        DB.getUsers(function(users){
           for(var a in users){
               exports.Users[users[a]['_id']] = new User(users[a]);
           }
        });
    }
});

console.log('[Server] Server Started');
