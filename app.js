var http = require('http');
var express = require('express');
var app = module.exports = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sockets = require('./lib/sockets.js');
var server = http.createServer(app);
var util = require('util');
var io = require('socket.io').listen(server);
var irc = require('./lib/irc.js');
var files = require('./lib/files');

// Routes
var routes = require('./routes/index');
var settings = require('./routes/settings');
var login = require('./routes/login');
var setup = require('./routes/setup');
var logout = require('./routes/logout');

try {
    server.listen(files.cfg['settings']['port']);
}
catch(e){
    if(files.setup == true){
        server.listen('500123');
        files.cfg['settings']['port'] = 500123;
    }
    else{
        console.error('Port is either in use or requires admin permissions to run!');
        exit();
    }
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(files.cfg['settings']['secretkey']));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// The routes that the app will use to display pages
app.use('/', routes);
app.use('/login', login);
app.use('/settings', settings);
app.use('/logout', logout);
if(files.setup == true){
    app.use('/setup', setup);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


sockets.connect(io);
console.log("The application has started on port: " + files.cfg['settings']['port']);
module.exports = app;
