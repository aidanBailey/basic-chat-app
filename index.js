let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let nicknames = [
    "Seahorse",
    "Octopus",
    "Squid",
    "Tuna",
    "Carp",
    "Great White",
    "Hammerhead",
    "Starfish",
    "Pufferfish",
    "Swordfish",
    "Sea Snake",
    "Angler",
    "Sea Turtle",
    "Rainbow Trout",
    "Eel",
    "Clown Fish",
    "Blue Tang",
    "Beserker Minnow",
    "Salmon",
    "Trout"
];

let usedNicknames = [];

app.use(express.static(__dirname + "/client"));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
    let nickname;
    let color;

    // This color generator function based on code written by StackOverflow user "Anatoliy"
    // https://stackoverflow.com/questions/1484506/random-color-generator
    function getRandomColor(){
        let letters = '0123456789ABCDEF';
        let tempColor = '#';
        for (var i = 0; i < 6; i++)
            tempColor += letters[Math.floor(Math.random() * 16)];
        return tempColor;
    }

    socket.on('nicknameAndColorRequest', function(){
        console.log("nickname and color requested");
        nickname = "tasty boi!"; // TODO Replace this with a nickname generator 
        color = getRandomColor();
        socket.emit('nicknameAndColor', nickname, color);
        console.log("Nickname sent: " + nickname);
    });

    socket.on('colorRequest', function(clientNickname){
        console.log("received nickname from client; nickname = " + clientNickname);
        nickname = clientNickname;
        console.log("color requested");
        color = getRandomColor();
        socket.emit('color', color);
        console.log("Color Sent: " + color);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});