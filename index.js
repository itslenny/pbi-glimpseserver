var port = process.env.PORT || 3000;

var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var middleware = require('socketio-wildcard')();
var socket = require('./lib/socket.js');
var GlimpseManager = require('./lib/GlimpseManager.js');
var Db = require('./lib/Db.js');

var manager = new GlimpseManager(new Db(process.env.DOCDB_HOST, process.env.DOCDB_KEY));

io.use(middleware);

//connect to glimpse (client)
app.get('/glimpse/:id', function(req, res, next){
    if(!manager.exists(req.params.id)) return next();
    res.sendFile(path.join(__dirname, 'views', 'glimpse.html'));
});

//catch-all error page
app.get('*', function(req, res){
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

//init socket
socket(io, manager);

//start listening for connections
http.listen(port, function(){
  console.log('Glimpse Bot is listening on port ' + port + '... always listening.');
});
