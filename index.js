/*
* Server Setup Vars
*/
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

/*
* Program Variables
*/
let nicknameGenerator = function(){
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
    let nicknamesInUse = [];

    function transferNickname(){
        let name = nicknames.pop();
        nicknamesInUse.push(name);
        return name; 
    }

    return {
        generateNickname: function(){
            if(nicknames.length > 0){
                return transferNickname();
            }
            else{
                nicknames = nicknamesInUse.slice();
                nicknamesInUse = [];
                return transferNickname();
            }
        }
    }
}();
let currentUsers = {};
let messageHistory = [];

app.use(express.static(__dirname + "/client"));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
    let nickname;
    let messageCounter = 0;

    // This color generator function based on code written by StackOverflow user "Anatoliy"
    // https://stackoverflow.com/questions/1484506/random-color-generator
    function getRandomColor(){
        let letters = '0123456789ABCDEF';
        let tempColor = '#';
        for (var i = 0; i < 6; i++)
            tempColor += letters[Math.floor(Math.random() * 16)];
        return tempColor;
    }

    socket.on('setupRequest', function(){
        console.log("A new client has sent a setup request...");
        while(true){
            nickname = nicknameGenerator.generateNickname(); 
            if(!(nickname in currentUsers)){
                break;
            }
                
        }
        let color = getRandomColor();
        socket.emit('setupMessageWithNickname', nickname, color, currentUsers, messageHistory);
        currentUsers[nickname] = color;
        socket.broadcast.emit('new user', nickname, color);
        console.log("Setup Message sent; nickname = " + nickname + " , color = " + color);
    });

    socket.on('setupRequestExistingNickname', function(clientNickname){
        console.log(clientNickname + " has sent a setup request...");
        nickname = clientNickname;
        let color = getRandomColor();
        socket.emit('setupMessageNoNickname', color, currentUsers, messageHistory);
        console.log("messages sent to user");
        for(let message of messageHistory){
            console.log("messageID: " 
            + message.messageID + ", nickname: " + message.nickname 
            + ", color: " + message.color + ", message: " + message.message 
            + ", timestamp: " + message.timestamp);
        }
        currentUsers[nickname] = color;
        socket.broadcast.emit('new user', nickname, color);
        console.log("Setup Message sent; nickname = " + nickname + " , color = " + color);
    });

    socket.on('chat message', function(msg){
        // Create the message object and add it to the dictionary
        let message = {
            messageID: nickname + messageCounter++,
            nickname: nickname, 
            color: currentUsers[nickname], 
            message: msg, 
            timestamp: new Date().toLocaleTimeString()};
        messageHistory.push(message);
        
        console.log('Received message; nickname: ' + nickname + ', color: ' 
            + currentUsers[nickname] + ', messsage: ' + msg);
        
        console.log("messages in history");
        for(let message of messageHistory){
            
            console.log("messageID: " 
            + message.messageID + ", nickname: " + message.nickname 
            + ", color: " + message.color + ", message: " + message.message 
            + ", timestamp: " + message.timestamp);
        }
        io.emit('chat message', message);
    });

    socket.on('user change', function(newNickname, newColor) {
        delete currentUsers[nickname];
        currentUsers[newNickname] = newColor;
        for(let message of messageHistory){
            if(message.nickname === nickname){
                message.nickname = newNickname;
                message.color = newColor;
            }
        }
        io.emit('user change', nickname, newNickname, newColor);
        nickname = newNickname;
    });

    socket.on('disconnect', function(){
        console.log(nickname + " has disconnected");
        delete currentUsers[nickname];
        io.emit('user disconnect', nickname);
    });
});