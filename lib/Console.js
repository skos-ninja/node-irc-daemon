var assert = require('assert');
var readline = require('readline');
var DB = require('./DB');
var Main = require('./Main');
var User = require('./User').User;

var rl = readline.createInterface({
    input: global.process.stdin,
    output: global.process.stdout
});

global.process.on('db_ready', function() {
    rl.on('line', function (line) {
        switch (line.split(' ')[0]) {
            case 'adduser':
                if (line.split(' ').length != 3) {
                    console.log('The usage for adduser is as follows: adduser <username> <password>');
                    return;
                }
                if (Main.Users[line.split(' ')[1]]) {
                    console.log('A user already exists by this username.');
                    return;
                }
                DB.genHash(line.split(' ')[2], function (hash) {
                    var opt = {
                        "username": line.split(' ')[1],
                        "name": null,
                        "login_token": null,
                        "hash": hash,
                        "salt": null
                    };
                    DB.createUser(opt, function (err, r) {
                        Main.Users[r['_id']] = new User(r);
                    });
                });
                break;

            case 'deluser':
                if (line.split(' ').length != 2) {
                    console.log('The usage for deluser is as follows: deluser <username>');
                    return;
                }
                break;

            case 'changepass':
                if (line.split(' ').length != 3) {
                    console.log('The usage for changepass is as follows: changepass <username> <password>');
                    return;
                }
                break;

            case 'identify':
                if(line.split(' ').length != 3){
                    console.log('The usage for identify is as follows: identify <username> <password>');
                    return;
                }
                DB.identify(line.split(' ')[1], line.split(' ')[2], function(vaild, user){
                    console.log('Correct: '+ vaild);
                });
                break;

            case 'loaduser':
                if(line.split(' ').length != 2){
                    console.log('The usage for loaduser is as follows: loaduser <username>');
                    return;
                }
                if(!Main.Users[line.split(' ')[1]]){
                    DB.getUser(line.split(' ')[1], function(user){
                        Main.Users[user['username']] = new User(user);
                    });
                }
                break;

            case 'help':
                console.log('The current available commands are: adduser, deluser, changepass');
                break;
        }
    });
});