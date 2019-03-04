$(function (){
    let socket = io();
    let nickname;
    let color;

    function setupClient(setupColor, activeUsers, messageHistory){
        // Set client's nickname and color
        color = setupColor;
        $("#activeUsers").append("<li id='myNickname' class='list-group-item d-flex justify-content-between align-items-center' style='border-color:" 
            + color +"'>" + nickname + "<span class='badge badge-secondary badge-pill'>You</span></li>");

        // Set Active Users
        for(let nickname in activeUsers){
            setUser(nickname, activeUsers[nickname]);
        }

        // Set Message History
        for(let message of messageHistory){
            console.log("Message from message history; messageID: " 
            + message.messageID + ", nickname: " + message.nickname 
            + ", color: " + message.color + ", message: " + message.message 
            + ", timestamp: " + message.timestamp); 
            setMessage(message);
        }
    }

    function setUser(userNickname, userColor){
        $("#activeUsers").append("<li id='" + userNickname + "_activeUser' class='list-group-item' style='border-color:" 
            + userColor +"'>" + userNickname + "</li>");
    }

    function setMessage(message){
        if(message.nickname === nickname){
            // Append message to the right
            let messageDiv = $('<div></div>');
            $("#messages").append(messageDiv);
            messageDiv.attr('id', message.messageID);
            messageDiv.addClass('message text-right');

            let textContainerDiv = $('<div></div>');
            messageDiv.append(textContainerDiv);
            textContainerDiv.addClass('textContainer');
            textContainerDiv.css('background', message.color);
            textContainerDiv.append('<span class="timestamp">' + message.timestamp + '</span>');
            textContainerDiv.append('<span class="messageText">' + message.message +'</span>');
        }
        else{
            // Append message to the right
            let messageDiv = $('<div></div>');
            $("#messages").append(messageDiv);
            messageDiv.attr('id', message.messageID);
            messageDiv.addClass('message text-left');

            let textContainerDiv = $('<div></div>');
            messageDiv.append(textContainerDiv);
            textContainerDiv.addClass('textContainer');
            textContainerDiv.css('background', message.color);
            textContainerDiv.append('<span class="name">'+ message.nickname +'</span>');
            textContainerDiv.append('<span class="messageText">' + message.message +'</span>');
            textContainerDiv.append('<span class="timestamp">' + message.timestamp + '</span>');
        }
        
        // $("#elementID").scrollDown
    }

    /*
    * Upon Startup: Determine if cookie exists and make an appropriate setup request to the server
    */
    $(function(){
        // Set Nickname and Color
        console.log("Checking for browser cookie");
        if (document.cookie.split(';').filter(function(item) {
            return item.trim().indexOf('nickname=') == 0
        }).length) {
            // Cookie exists (and therefore client has a pre-existing nickname)
            nickname = document.cookie.replace(/(?:(?:^|.*;\s*)nickname\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            console.log("Browser cookie found; nickname = " + nickname);
            console.log("Sending setup request with existing nickname");
            socket.emit('setupRequestExistingNickname', nickname);
        }
        else {
            // No cookie (or pre-existing nickname) 
            console.log("No Browser Cookie found");
            console.log("Sending setup request");
            socket.emit('setupRequest');
        }
    });

    socket.on('setupMessageWithNickname', function(sentNickname, sentColor, currentUsers, messageHistory){
        // Set Nickname
        console.log("Nickname received from server; nickname = " + sentNickname);
        nickname = sentNickname;

        // Set Cookie for Nickname
        let date = new Date();
        date.setTime(date.getTime() + (60*60*1000));
        document.cookie = "nickname=" + nickname + ";" + date;

        setupClient(sentColor, currentUsers, messageHistory);
    });

    socket.on('setupMessageNoNickname', function(sentColor, currentUsers, messageHistory){
        // TODO Update Expiry Date for existing cookie
        setupClient(sentColor, currentUsers, messageHistory);
    });

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    
    socket.on('chat message', function(message){
        console.log("Received message from the server; messageID: " 
            + message.messageID + ", nickname: " + message.nickname 
            + ", color: " + message.color + ", message: " + message.message 
            + ", timestamp: " + message.timestamp);
        setMessage(message);
    });
});