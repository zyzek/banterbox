var io = require('socket.io')();

io.on('connection', function(client) {
	console.log(client);
	client.emit('an event', {'some': 'data'});
});

io.listen(3000);
