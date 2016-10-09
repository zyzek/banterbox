//set some fake data in the localStorage, so we can have some authorisation happening serverside

localStorage.setItem("token_id", "f2377398f2b241088ade0baf71b48212b9cdf93d");




////////////////////////////// ACTUAL CODE

//connect to the socket server
token_id = localStorage.getItem("token_id");
room_id = "roomy";
var socket = io('http://localhost:3000');

socket.on('connect', function() {

	//on connect, the socket will attempt to auth with the server using token stored in webpage
	socket.emit('auth', {token: token_id, room:room_id});

	//once authenticated, register all functions
})

socket.on('an event', console.log);

