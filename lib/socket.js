module.exports = function(io, glimpses) {
    io.on('connection', function(socket){  
        console.log('Socket Connection!!');
        
        socket.on('glimpse:load', function(data) {
            if(joinGlimpse(data, socket)) {
                socket.emit('glimpse:start', {impl: glimpses.get(data.id).impl});
            }
        });
        
        socket.on('glimpse:rejoin', function(data) {
            joinGlimpse(data, socket)
        });
        
        socket.on('glimpse:create', function(data) {
            if(data && data.impl && data.id) {
                data.socketId = socket.id;
                //io.sockets.connected[socketId]
                var glimpse = glimpses.set(data.id, data);
                socket.on('disconnect', function() {
                    console.log('IoT Disconnect!!', glimpse.id);
                    glimpse.socketId = undefined;
                });
                socket.on('*',function(contents) {
                    
                    if(!contents || !Array.isArray(contents.data)) return;
                    var event = contents.data[0];
                    var data = contents.data[1];
                    
                    io.to(glimpse.id).emit(event, data);

                    glimpse.persist(event, data, Date.now());

                    console.log('wildcard relay from IoT', event);
                });
                socket.emit('glimpse:created');                
            } else {
                socket.emit('glimpse:error', {error: "Invalid glimpse data. Required fields: impl, id"});
            }
        });
    });

    function joinGlimpse(data, socket) {
        if(data && data.id && glimpses.exists(data.id)){
            var glimpseId = data.id;
            socket.join(data.id);
            
            socket.on('*',function(contents) {
                if(!contents || !Array.isArray(contents.data)) return;
                var event = contents.data[0];
                var data = contents.data[1];
                var glimpse = glimpses.get(glimpseId);
                
                if(glimpse.connected()) {
                    io.to(glimpse.socketId).emit(event,data);
                }
                console.log('wildcard relay from client', event);
            });
            return true;
        } else {
            socket.emit('glimpse:error', {error: "Invalid Gimpse Id"});
            return false;
        }
    }
}