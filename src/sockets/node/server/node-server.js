var io = require('socket.io')(da);

io.on('connection', function(socket){
    socket.emit('request', /* */); // emit an event to the socket
    io.emit('broadcast', /* */); // emit an event to all connected sockets
    socket.on('reply', function(){ /* */ }); // listen to the event
});

io.listen(8320);

exports = {server: io};