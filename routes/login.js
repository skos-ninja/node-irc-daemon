var express = require('express');
var user = require('../lib/user.js');
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
    });}

/* GET home page. */
router.get('/', function(req, res) {
    if(req.signedCookies['authkey']){
        if(!user.checkcookie(req, res, req.signedCookies['authkey'])) {
            if (!req.get('Referer')) {
                res.redirect('/');
                return
            }
        }
        res.send(req.get('Referer'));
        res.redirect(req.get('Referer'));
    }
    else {
        renderlogin(res);
    }
});

router.get('/failed', function(req, res) {
    if(req.signedCookies['authkey']){
        if(!user.checkcookie(req, res, req.signedCookies['authkey'])){
            if (!req.get('Referer')){
                res.redirect('/');
                return;
            }
            res.redirect(req.get('Referer'));
            return;
        }
        renderlogin(res, true);
    }
    else {
        renderlogin(res, true);
    }
});


router.post('/', function(req, res) {
    if(!req.body.password){
        res.setHeader('method', 'GET');
        res.redirect("/login/failed");
        return;
    }
    if(req.signedCookies['authkey']){
        if(!user.checkcookie(req, res, req.signedCookies['authkey'])) {
            res.setHeader('method', 'GET');
            res.redirect("/login");
            return;
        }
    }
    password = req.body.password;
    user.checklogin(req, res, password);

    res.setHeader('method', 'GET');
    res.redirect("/");
});

module.exports = router;