$(function (){
    let socket = io();
    let nickname;
    let color;

    function setupClient(setupColor, activeUsers, messageHistory){
        // Set client's nickname and color
        color = setupColor;
        $("#activeUsers").append("<li id='" + nickname.replace(/\s/g, "_") + "_activeUser' class='list-group-item d-flex justify-content-between align-items-center' style='border-color:" 
            + color +"'>" + nickname + "<span class='badge badge-secondary badge-pill'>You</span></li>");

        // Set Active Users
        for(let userNickname in activeUsers){
            setUser(userNickname, activeUsers[userNickname]);
        }

        // Set Message History
        for(let message of messageHistory)
            setMessage(message);
    }

    function setUser(userNickname, userColor){
        if(userNickname === nickname)
            return;

        $("#activeUsers").append("<li id='" + userNickname.replace(/\s/g, "_") + "_activeUser' class='list-group-item' style='border-color:" 
            + userColor +"'>" + userNickname + "</li>");
    }

    function setMessage(message){
        let messageDiv = $('<div></div>');
        $("#messages").append(messageDiv);
        messageDiv.attr('id', message.messageID);
        messageDiv.addClass(message.nickname.replace(/\s/g, "_") + 'Message');

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
        
        $("#messages").scrollTop($('#messages').prop("scrollHeight"));
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
        let messagesToChange = $('.' + oldNickname.replace(/\s/g, "_") + 'Message');
        let textContainers = messagesToChange.find('.textContainer');
        textContainers.css('background', newColor);

        let messagesToChangeName = $('.text-left.' + oldNickname.replace(/\s/g, "_") + 'Message');
        messagesToChangeName.find('.textContainer').find('.name').html(newNickname);
        
        messagesToChange.removeClass(oldNickname.replace(/\s/g, "_") + 'Message');
        messagesToChange.addClass(newNickname.replace(/\s/g, "_") + 'Message');
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
            socket.emit('setupRequestExistingNickname', nickname);
        }
        else {
            // No cookie (or pre-existing nickname) 
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
        document.cookie = "nickname=" + nickname + ";expires=" + date.toUTCString();

        setupClient(sentColor, currentUsers, messageHistory);
    });

    socket.on('setupMessageNoNickname', function(sentColor, currentUsers, messageHistory){
        setupClient(sentColor, currentUsers, messageHistory);
    });

    socket.on('chat message', function(message){
        setMessage(message);
    });

    socket.on('new user', function(userNickname, userColor){
        setUser(userNickname, userColor);
    });

    socket.on('user disconnect', function(userNickname){
        $('#' + userNickname.replace(/\s/g, "_") + '_activeUser').remove();
    });

    socket.on('user change', function(oldNickname, newNickname, newColor){
        // Change Active Users List entry
        if(oldNickname === nickname){
            nickname = newNickname;
            $("#" + oldNickname.replace(/\s/g, "_") + '_activeUser').html(newNickname 
                + "<span class='badge badge-secondary badge-pill'>You</span>");
            let date = new Date();
            date.setTime(date.getTime() + (60*60*1000));
            document.cookie = "nickname=" + newNickname + ";expires=" + date.toUTCString();
            socket.emit('nickname changed', newNickname);
        }
        else{
            $("#" + oldNickname.replace(/\s/g, "_") + '_activeUser').html(newNickname);
        }
        $("#" + oldNickname.replace(/\s/g, "_") + '_activeUser').css('border-color', newColor);
        $("#" + oldNickname.replace(/\s/g, "_") + '_activeUser').attr('id', newNickname.replace(/\s/g, "_") + '_activeUser');

        // Change old messages
        changePrevMessages(oldNickname, newNickname, newColor);
    });

    socket.on('user change denied', function(serverMessage){
        handleAlert(serverMessage);
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
            }
        }
        else if ($('#m').val().slice(0,'/nickcolor '.length).includes('/nickcolor ')){
            // Verify nickname color is valid
            let newColor = $('#m').val().slice('/nickcolor '.length);
            if(newColor.length > 8 || newColor.length === 0)
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