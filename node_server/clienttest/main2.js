//connect to the socket server
room_id = "roomy";
var socket = io('http://localhost:3002');

socket.on('message', console.log);

socket.on('data', console.log);
socket.on('step', console.log);