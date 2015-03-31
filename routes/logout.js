var express = require('express');
var files = require('../lib/files.js');
var router = express.Router();

router.get('/', function(req, res) {
    res.clearCookie('authkey');
    res.redirect('/');
});

module.exports = router;