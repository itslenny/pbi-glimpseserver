var path = require('path');
var port = process.env.PORT || 3000;
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var middleware = require('socketio-wildcard')();
io.use(middleware);

var glimpses = {};

//connect to glimpse (client)
app.get('/glimpse/:id', function(req, res, next){
    if(!glimpses[req.params.id]) return next();
    res.sendFile(path.join(__dirname, 'glimpse.html'));
});

//catch-all error page
app.get('*', function(req, res){
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', function(socket){  
    console.log('connection!!');
    
    socket.on('glimpse:load', function(data) {
        if(joinGlimpse(data, socket)) {
            socket.emit('glimpse:start', {impl: glimpses[data.id].impl});
        }
    });
    
    socket.on('glimpse:rejoin', function(data) {
        joinGlimpse(data, socket)
    });
    
    socket.on('glimpse:create', function(data) {
        if(data && data.impl && data.id) {
            data.socket = socket;
            var glimpse = data;
            glimpses[data.id] = glimpse;
            socket.on('disconnect', function() {
                console.log('IoT Disconnect!!', glimpse.id);
                glimpse.socket = undefined;
            });
            socket.on('*',function(contents) {
                console.log('wildcard relay from IoT', contents);
                if(!contents || !Array.isArray(contents.data)) return;
                var event = contents.data[0];
                var data = contents.data[1];
                
                io.to(glimpse.id).emit(event, data);
            });
            socket.emit('glimpse:created');                
        } else {
            socket.emit('glimpse:error', {error: "Invalid glimpse data. Required fields: impl, id"});
        }
    });
});

http.listen(port, function(){
  console.log('Glimpse Bot is listening on port ' + port + '... always listening.');
});

function joinGlimpse(data, socket) {
    if(data && data.id && glimpses[data.id]){
        var glimpseId = data.id;
        socket.join(data.id);
        
        socket.on('*',function(contents) {
            console.log('wildcard relay from client',contents);
            if(!contents || !Array.isArray(contents.data)) return;
            var event = contents.data[0];
            var data = contents.data[1];
            
            if(glimpses[glimpseId].socket) {
                glimpses[glimpseId].socket.emit(event,data);
            }
        });
        return true;
    } else {
        socket.emit('glimpse:error', {error: "Invalid Gimpse Id"});
        return false;
    }
}