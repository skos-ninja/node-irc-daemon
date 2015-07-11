var Socket = require('./Socket');
var Network = require('./Network');
var DB = require('./DB');
var User = require('./User').User;
var Console = require('./Console');

/*
Finished loading required libs.
Now will load each user as required. This is to make sure that after a restart the user will have it's irc auto connect.
 */

global.process.on('db_ready', function(){
    exports.DB = DB;
    if(!exports.Users) {
        exports.Users = {};
        DB.getUsers(function(users){
           for(var a in users){
               exports.Users[users[a]['username']] = new User(users[a]);
           }
        });
    }
});

console.log('[Server] Server Started');
