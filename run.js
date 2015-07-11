/*
This is the main run process. This will get rarely updated.
This allows for the server and client process to run separately so not to get congested.
This means upon the client crashing due to an error the server end will not be forced to stop too.
Each process will auto restart upon it crashing, this is to minimise down time along with an easier end user experience.

TODO Make the user saving remove the networks from the obj before saving.
TODO Make FrontEnd talk with BackEnd.
 */
var Config = require('./config.json');
var version = require('./package.json')['version'];
var util = require('util');
var program = require('commander');
var fs = require('fs');
var daemon = true;
console.log('Welcome to node-irc-daemon');
console.log('Running version ' + version);

global.Version = version;
global.Config = Config;
global.process = process;

global.process.on('uncaughtException', function(err){
    global.process.emit('exiting');
    console.log('Error: ' + util.inspect(err));
    console.log(err.stack);
    setTimeout(function () {
        global.process.exit();
    }, 10000);
});

global.process.on('beforeExit', function(){
    global.process.emit('exiting');
    setTimeout(function () {
        global.process.exit();
    }, 100000);
});

global.process.on('exiting', function(){
    fs.rmdirSync('./this.pid');
});

program.command('adduser <username> <password>')
    .description('Add a user to the mongo database.')
    .action(function(username, password){
        daemon = false;
        var DB = require('./lib/DB');
        DB.genHash(password, function(hash){
            var opt = {
                "username": username,
                "name": null,
                "hash": hash
            };
            global.process.on('db_ready', function() {
                DB.createUser(opt, function (err, r) {
                    var config = require('./config.json');
                    var socket = require('socket.io-client')('http://localhost:' + config['socket_port']);
                    socket.emit('loaduser', fs.readFileSync('./this.pid', {'encoding': 'utf-8'}), username);
                    process.exit(0);
                });
            });
        });
    });

program.command('changepass <username> <password>')
    .description('Change the password of a user.')
    .action(function(username, password){
        daemon = false;
        var DB = require('./lib/DB');
        DB.genHash(password, function(hash) {
            DB.changePass(username, hash, function (result) {
                process.exit(0);
            });
        });
    });

program.command('deluser <username>')
    .description('Delete a user.')
    .action(function(username){
        daemon = false;
        var DB = require('./lib/DB');
        var socket = require('socket.io-client')('http://localhost:' + config['socket_port']);
        DB.removeUser(username, function(result){
            socket.emit('unloaduser', fs.readFileSync('./this.pid', {'encoding': 'utf-8'}), username);
            process.exit(0);
        });
    });

program.parse(process.argv);

if(daemon){
    fs.writeFileSync('./this.pid', process.pid);
    require('./lib/Main');
}