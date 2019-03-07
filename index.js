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
    let generateCount = 0;

    function transferNickname(){
        let name = 'Weird Fish';
        while(true){
            name = nicknames.pop();
            nicknamesInUse.push(name); 
            if(!(name in currentUsers)){
                break;
            }
            else if(generateCount > 20){
                name = 'Weird Fish' + String(Math.floor(Math.random() * (1 - 1000)) + 1);
            }
            else{
                generateCount++;
            }
        }
        generateCount = 0;
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
let instanceCounts = {};
let messageHistory = [];

/*
* Server Setup
*/

app.use(express.static(__dirname + "/client"));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

/*
* Websocket Communication and Server Logic
*/ 

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
        nickname = nicknameGenerator.generateNickname();
        let color = getRandomColor();
        socket.emit('setupMessageWithNickname', nickname, color, currentUsers, messageHistory);
        currentUsers[nickname] = color;
        instanceCounts[nickname] = 1;
        socket.broadcast.emit('new user', nickname, color);
        console.log("Setup Message sent; nickname = " + nickname + " , color = " + color);
    });

    socket.on('setupRequestExistingNickname', function(clientNickname){
        console.log(clientNickname + " has sent a setup request...");
        nickname = clientNickname;
        let color;
        if(clientNickname in currentUsers){
            color = currentUsers[clientNickname];
            instanceCounts[clientNickname]++;
        }
        else{
            color = getRandomColor();
            instanceCounts[nickname] = 1;
        }
        socket.emit('setupMessageNoNickname', color, currentUsers, messageHistory);
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
        if(newNickname !== nickname && (newNickname in currentUsers)){
            socket.emit('user change denied', 'New nickname already in use... please try again');
            return;
        }
        
        delete currentUsers[nickname];
        currentUsers[newNickname] = newColor;

        let instanceCount = instanceCounts[nickname];
        delete instanceCounts[nickname];
        instanceCounts[newNickname] = instanceCount;
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
        if(instanceCounts[nickname] <= 1){
            console.log(nickname + " has disconnected");
            delete currentUsers[nickname];
            delete instanceCounts[nickname];
            io.emit('user disconnect', nickname);
            return;
        }
        instanceCounts[nickname]--;
    });
});