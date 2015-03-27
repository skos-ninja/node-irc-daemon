var express = require('express');
var files = require('../lib/files.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    if (files.setup == true){
        res.redirect('/setup');
        return;
    }
    if (req.signedCookies['authkey']) {
        if (req.signedCookies['authkey'] != files.authkey) {
            res.clearCookie('authkey');
            res.redirect('/login');
            return;
        }
    }
    else {
        res.redirect('/login');
        return;
    }
  res.render('index', {
      title: 'Index',
      partials: {
          header: 'header',
          footer: 'footer'
      }
  });
});

module.exports = router;
