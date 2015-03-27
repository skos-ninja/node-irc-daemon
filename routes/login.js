var express = require('express');
var files = require('../lib/files.js');
var hasher = require('../lib/hasher.js');
var router = express.Router();

function renderlogin(res, error){
    res.render('login', {
        title : 'Login',
        error : error,
        partials:
        {
            header: 'header',
            footer: 'footer'
        }
    });
}

router.get('/', function(req, res) {
    if (files.setup == true){
        res.redirect('/setup');
        return;
    }
    if (req.signedCookies['authkey']) {
        if (req.signedCookies['authkey'] != files.authkey) {
            res.clearCookie('authkey');
            renderlogin(res, false);
            return;
        }
    }
    else {
        renderlogin(res, false);
        return;
    }
    res.redirect('/');
});

router.get('/error', function(req, res) {
    if (files.setup == true){
        res.redirect('/setup');
        return;
    }
    if (req.signedCookies['authkey']) {
        if (req.signedCookies['authkey'] != files.authkey) {
            res.clearCookie('authkey');
            renderlogin(res, true);
            return;
        }
    }
    else {
        renderlogin(res, true);
        return;
    }
    res.redirect('/');
});

router.post('/', function(req, res) {
    if (files.setup == true) {
        res.redirect('/setup');
        return;
    }
    if (req.signedCookies['authkey']) {
        if (req.signedCookies['authkey'] != files.authkey) {
            res.clearCookie('authkey');
            res.render('login', {
                title: 'Login',
                error: error,
                partials: {
                    header: 'header',
                    footer: 'footer'
                }
            });
            return;
        }
    }
    else {
        res.render('login', {
            title: 'Login',
            error: error,
            partials: {
                header: 'header',
                footer: 'footer'
            }
        });
        return;
    }
    hasher.compare(req.body.password, function (err, result) {
        if (result == true) {
            if (files.authkey != '') {
                res.cookie('authkey', files.authkey, {signed: true});
                res.redirect('/');
            }
            hasher.hash(new Date().getTime(), function (err, authtoken) {
                if (err) throw err;
                files.authkey = authtoken;
                res.cookie('authkey', authtoken, {signed: true});
                res.redirect('/');
            })
        }
        else {
            res.redirect('/login/error');
        }
    });
});

module.exports = router;