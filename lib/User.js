var Network = require('./Network').Network;
var Socket = require('./Socket');
var DB = require('./DB');


var User = function(opt){

    var self = this;

    self.name = opt['name'];

    self.username = opt['username'];

    self.id = opt['_id'];

    self.networks = {};

    self.room = new Socket.UserRoom(self.username, self.id);

    DB.getNetworks(self.username, function(networks){
        self.networksList = networks;
        console.log(self.networksList);
        var i = 0;
        for(var a in self.networksList){
            i++;
            self.networksList[a]['owner'] = {
                name: self.name,
                id: self.id
            };
            self.networks[self.networksList[a]['_id']] = new Network(self.networksList[a]);
        }
    });

    self.login_token = opt['login_token'];

    self.salt = opt['salt'];

    self.hash = opt['hash'];

    self.opt = opt;

    global.process.once('exiting', function(){
        self.save(function(err){
            if(err){
                throw err;
            }
        });
    });
};

User.prototype.logout = function(callback){
    this.login_token = null;
    callback(this.login_token);
};

User.prototype.listNetworks = function(callback){
    var networks = [];
    for(var a in this.networks){
        networks.push(this.networks[a].name);
    }
    callback(networks);
};

User.prototype.getNetwork = function(network, callback){
      callback(this.networks[network]);
};

User.prototype.createNetwork = function(opt, callback){
    if(this.networks[opt['name']]){
        callback(false);
    }
    else{
        var self = this;
        DB.createNetwork(opt, function(result){
           self.networks[result['_id']] = new Network(result);
        });
        callback(true);
    }
};

User.prototype.deleteNetwork = function(network, callback){
    if(this.networks[network]){
        callback(false);
        return
    }
    this.networks[network].disconnect();
    this.networks[network].destroy();
    DB.deleteNetwork(this.id, network);
    callback(true);
};

User.prototype.getBacklog = function(network, channel, amount, indent, callback){
    if(!this.networks[network]){
        callback('no_network', null);
    }
    DB.getMessages(this.id, network, channel, indent, amount, function(docs){
        callback(null, docs);
    });
};

User.prototype.save = function(callback){
    DB.saveUser(this, function(err){
        callback(err);
    });
};

User.prototype.remove = function(){
    for(var a in this.networks){
        this.networks[a].disconnect();
    }
    this.destroy();
};

exports.User = User;