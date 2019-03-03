$(function (){
    let socket = io();
    let nickname;
    let color;

    function setCredentials() {
        // TODO Create entry in the list with nickname and color
        $("#activeUsers").append("<li id='myNickname' class='list-group-item d-flex justify-content-between align-items-center' style='border-color:" 
            + color +"'>" + nickname + "<span class='badge badge-secondary badge-pill'>You</span></li>");
    }

    /*
    * Setup Function: Configure the user interface upon the page load
    */
    $(function(){
        // Check if there is a Browser Cookie with nickname
        console.log("Checking for browser cookie");
        if (document.cookie.split(';').filter(function(item) {
            return item.trim().indexOf('nickname=') == 0
        }).length) {
            // Cookie exists (and therefore client has a pre-existing nickname)
            nickname = document.cookie.replace(/(?:(?:^|.*;\s*)nickname\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            console.log("Browser cookie found; nickname = " + nickname);
            console.log("request color from server");
            socket.emit('colorRequest', nickname);
        }
        else {
            // No cookie (or pre-existing nickname) 
            console.log("No Browser Cookie found; requesting nickname and color from server");
            socket.emit('nicknameAndColorRequest');
        }
    });

    socket.on('nicknameAndColor', function(sentNickname, sentColor){
        // Set Nickname
        console.log("Nickname received from server; nickname = " + sentNickname);
        nickname = sentNickname;

        // Set Cookie for Nickname
        let date = new Date();
        date.setTime(date.getTime() + (60*60*1000));
        document.cookie = "nickname=" + nickname + ";" + date;

        // Set Color
        console.log("Color received from server; color = " + sentColor);
        color = sentColor;

        // Set Color and Nickname in the GUI
        setCredentials();
    });

    socket.on('color', function(sentColor){
        console.log("Color received from server; color = " + sentColor);
        color = sentColor;

        // Set Color and Nickname in the GUI
        setCredentials(); 
    });

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    
    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
    });
});