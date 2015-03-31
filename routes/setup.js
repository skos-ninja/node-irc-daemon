var express = require('express');
var files = require('../lib/files.js');
var server = require('../lib/servers.js');
var bcrypt = require('bcrypt-nodejs');
var router = express.Router();

function rendersetup(res){
    res.render('setup', {
        title : 'Setup',
        partials:
        {
            header: 'header',
            footer: 'footer',
            error: false
        }
    });
}

function rendererror(res){
    res.render('setup', {
        title : 'Setup',
        partials:
        {
            header: 'header',
            footer: 'footer',
            error: true
        }
    });
}

/* GET home page. */
router.get('/', function(req, res) {
    if (files.setup == true){
        rendersetup(res);
    }
    else {
        res.redirect('/');
    }
});

router.get('/failed', function(req, res) {
    if (files.setup == true){
        rendersetup(res);
    }
    else {
        res.redirect('/');
    }
});

router.post('/submit', function(req, res) {
    if (files.setup == true) {
        var password = bcrypt.hashSync(req.body.password, files.cfg['settings']['secretkey']);
        files.cfg['settings'] = {
            "realname": req.body.realname,
            "username": req.body.username,
            "password": password,
            "secretkey": files.cfg['settings']['secretkey'],
            "port": req.body.port,
            "scrollback": 1000,
            "logmsg": false,
            "highlights": []
        };

        server.addServer(req.body.server_name, req.body.server_address, req.body.server_port, req.body.server_username, req.body.server_password, req.body.server_channel, function (err, result) {
            if (err) {
                rendererror(res);
                console.error(err);
            }
            console.log(result);
        });

        files.setup = false;

        req.method = 'get';
        res.redirect('/');
    }
    else {
        req.method = 'get';
        res.redirect('/')
    }
});

module.exports = router;