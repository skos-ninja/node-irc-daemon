/*
This is the connection to the mongodb instance, this shouldn't be manually changed.
Upon a self contained mongo instance being stopped it will restart the instance.
A warning will be output when the server looses a db connection.
 */
var bcrypt = require('bcrypt-nodejs');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var assert = require('assert');
var child = require('child_process').spawn;
var Main = require('./Main');
var self = exports;

if(global.Config['mongo_self_start']){
    console.log('Starting mongod instance');
    var MongoInstance = child('mongod', ['--dbpath=./data', '--port', global.Config['mongo_port']]);
    MongoInstance.on('close', function(code){
        if(!MongoInstance.shuttingdown) {
            console.log('Mongod Instance has closed with the code: ' + code);
            console.log('Restarting the instance');
            MongoInstance.spawn();
        }
    });

    global.process.on('exit', function(){
        MongoInstance.shuttingdown = true;
        console.log('[Server] Stopping the mongod instance');
        MongoInstance.kill();
    })
}

var uri = 'mongodb://' + global.Config['mongo_address'] + ':' + global.Config['mongo_port'] + '/node-irc-daemon';

var connectDB = function(){
    MongoClient.connect(uri, function(err, db){
        console.log('Mongo Connected');

        self.db = db;

        self.getUsers = function(callback){
            db.collection('users').find({}).toArray(function(err, docs) {
                callback(docs);
            });
        };

        self.getUser = function(username, callback){
            db.collection('users').find({'username': username}).limit(1).toArray(function(err, docs){
                callback(docs[0]);
            });
        };

        self.inputMessage = function(user, network, channel, type, message, from, time){
            db.collection('messages').insertOne({
                "owner": user,
                "network": network,
                "channel": channel,
                "type": type,
                "message": message,
                "from": from,
                "time": time
            }, function(err, result) {
                assert.equal(err, null);
                if(global.Config['development']) {
                    console.log("Inserted a message into the messages collection.");
                }
            });
        };

        self.createUser = function(opt, callback){
            db.collection('users').insert([opt], function(err, r){
                console.log(r);
                db.collection('networks').insert([{username: r['_id'], networks:{}}], function(err, w){
                    callback(err, r);
                })
            });
        };

        self.createNetwork = function(username, opt, callback){
            db.collection('networks').findOneAndUpdate({ username: username }, { network: { $addToSet: opt['name'] = {
                "_id": ObjectId(), "name" : opt['name'] , "network_address" : opt['address'] , "network_port" : opt['port'] , "nick" : opt['nick'] , "user" : opt['username'] , "channels" : opt['channels'] , "secure" : opt['secure']
            }}}, function(err, doc){
                console.log(err);
                callback(err);
            });
        };

        self.updateNetwork = function(username, network, opt, callback){
            db.collection('networks').findOneAndUpdate({ username: username }, { network: {$set: opt['name'] = {
                "_id": opt['_id'], "name" : opt['name'] , "network_address" : opt['address'] , "network_port" : opt['port'] , "nick" : opt['nick'] , "user" : opt['username'] , "channels" : opt['channels'] , "secure" : opt['secure']
            }}}, function(err, doc){
                console.log(err);
                callback(err);
            });
        };

        self.saveUser = function(opt, callback){
            db.collection('users').findOneAndUpdate({ username: opt['username'] }, {$set: {
                "username" : opt['username'],
                "name": opt['name'],
                "login_token": opt['login_token'],
                "hash": opt['hash'],
                "salt": opt['salt']
            }}, function(err, doc){
                console.log(err);
                callback(err);
            });
        };

        self.getMessages = function(username, network, channel, indent, limit, callback){
            db.collection('messages').find({ id: {$gt: indent }, username: username, network: network, channel: channel }).sort({_id:-1}).skip(indent).limit(limit).toArray(function(err, docs){
                console.log(err);
                callback(docs);
            });
        };

        self.getNetworks = function(user, callback){
            db.collection('networks').find({ username: user}).limit(1).toArray(function(err, docs){
                callback(docs[0]['networks']);
            });
        };

        self.getNetwork = function(user, network){
            db.collection('networks').find( { username: user, networks: network }).limit(1).toArray(function(err, docs){
                return docs[0]['networks'][network];
            });
        };

        self.getId = function(user, callback){
            db.collection('users').find( { username: user}).limit(1).toArray(function(err, docs){
                callback(docs[0]['_id']);
            })
        };

        self.close = function(){
            db.close();
        };

        global.process.emit('db_ready');
    });
};

self.identify = function(username, key, callback){
    self.getUser(username, function(user){
        if(!bcrypt.compareSync(key, user['hash'])){
            callback(false, null);
        }
        else{
            self.getId(username, function(id){
                callback(true, Main.Users[id]);
            })
        }
    });
};

self.genHash = function(pass, callback){
    callback(bcrypt.hashSync(pass));
};

connectDB();