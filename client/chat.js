$(function (){
    let socket = io();
    let nickname;
    let color;

    function setupClient(setupColor, activeUsers, messageHistory){
        // Set client's nickname and color
        color = setupColor;
        $("#activeUsers").append("<li id='" + nickname + "_activeUser' class='list-group-item d-flex justify-content-between align-items-center' style='border-color:" 
            + color +"'>" + nickname + "<span class='badge badge-secondary badge-pill'>You</span></li>");

        // Set Active Users
        for(let userNickname in activeUsers){
            setUser(userNickname, activeUsers[userNickname]);
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
        if(userNickname === nickname)
            return;

        $("#activeUsers").append("<li id='" + userNickname + "_activeUser' class='list-group-item' style='border-color:" 
            + userColor +"'>" + userNickname + "</li>");
    }

    function setMessage(message){
        let messageDiv = $('<div></div>');
        $("#messages").append(messageDiv);
        messageDiv.attr('id', message.messageID);
        messageDiv.addClass(message.nickname + 'Message');

        if(message.nickname === nickname){
            // Append message to the right
            messageDiv.addClass('message text-right');

            let textContainerDiv = $('<div></div>');
            messageDiv.append(textContainerDiv);
            textContainerDiv.addClass('textContainer');
            textContainerDiv.css('background', message.color);
            textContainerDiv.append('<span class="timestamp">' + message.timestamp + '</span>');
            textContainerDiv.append('<span class="messageText">' + message.message +'</span>');
        }
        else{
            // Append message to the left
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

    function handleAlert(alertMessage) {
        $(".alert").append('<p class="alertMessageString">' + alertMessage + '</p>');
        $(".alert").fadeIn('fast');
        setTimeout(function(){
            $(".alert").fadeOut('slow', function(){
                $('.alertMessageString').remove();
            });
        }, 4000);
    }

    function changePrevMessages(oldNickname, newNickname, newColor){
        let messagesToChangeColor = $('.' + oldNickname + 'Message');
        let textContainers = messagesToChangeColor.find('.textContainer');
        textContainers.css('background', newColor);

        let messagesToChangeName = $('.text-left.'+ oldNickname + 'Message');
        messagesToChangeName.find('.textContainer').find('.name').html(newNickname);
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

    socket.on('chat message', function(message){
        console.log("Received message from the server; messageID: " 
            + message.messageID + ", nickname: " + message.nickname 
            + ", color: " + message.color + ", message: " + message.message 
            + ", timestamp: " + message.timestamp);
        setMessage(message);
    });

    socket.on('new user', function(userNickname, userColor){
        setUser(userNickname, userColor);
    });

    socket.on('user disconnect', function(userNickname){
        $('#' + userNickname + '_activeUser').remove();
    });

    socket.on('user change', function(oldNickname, newNickname, newColor){
        console.log("User Change Request; oldNickname: " + oldNickname + ", newNickname: " + newNickname + ", newColor: " + newColor );

        // Change Active Users List entry
        $("#" + oldNickname + '_activeUser').html(newNickname);
        $("#" + oldNickname + '_activeUser').css('border-color', newColor);
        $("#" + oldNickname + '_activeUser').attr('id', newNickname + '_activeUser');

        // Change old messages
        changePrevMessages(oldNickname, newNickname, newColor);
    });

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        if($('#m').val().slice(0, '/nick '.length).includes('/nick ')){
            // Verify that nickname is acceptable 
            let newNickname = $('#m').val().slice('/nick '.length);
            if(newNickname.length > 20)
                handleAlert("Specified nickname is too long... please try again");
            else if (newNickname.length === 0)
                handleAlert("Specified nickname is empty... please try again");
            else {
                socket.emit('user change', newNickname, color);
                nickname = newNickname;
            }
        }
        else if ($('#m').val().slice(0,'/nickcolor '.length).includes('/nickcolor ')){
            // Verify nickname color is valid
            let newColor = $('#m').val().slice('/nickcolor '.length);
            if(newColor.length > 6 || newColor.length === 0)
                handleAlert("Specified hex color is an invalid length... please try again");
            else if (!(/[0-9A-Fa-f]{6}/g.test(newColor)))
                handleAlert("Specified color is not in a valid hex format... please try again");
            else {
                socket.emit('user change', nickname, '#' + newColor);
                color = '#' + newColor;
            }
        }
        else{
            socket.emit('chat message', $('#m').val());
        }     
        $('#m').val('');
        return false;   
    });
});