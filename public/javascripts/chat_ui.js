/**
 * Created by jinxin on 2018/3/19.
 */
let socket = io.connect();
$(document).ready(function () {
    let chatApp = new Chat(socket);

    socket.on('nameResult', function (result) {
        let message;
        if(result.success){
            message = "You are known as" + result.name + ".";
        }else {
            message = result.message;
        }
        $('#messages').append(divEscapedContentElement(message));
    });

    socket.on('joinResult', function (result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    socket.on('message', function (message) {
        let newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('room', function (rooms) {
        $('#room-list').empty();

        for(var room in rooms){
            room = room.substring(1, room.length);
            if(room != ''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }
        $('#room-list div').click(function () {
            chatApp.processCommand('/join' + $(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(function () {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();
    $('#send-form').submit(function () {
        processUserInput(chatApp, socket);
        return false;
    });
});



function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
    let messageDom = $('#send-message').val();
    let messageValue = messageDom.val();
    let systemMessage;

    if(messageValue.charAt(0) == '/'){
        systemMessage = chatApp.processCommand(messageValue);
        if(systemMessage){
            messageDom.append(divEscapedContentElement(systemMessage));
        }
    }else {
        chatApp.sendMessage($('room').text(), message);

        messageDom.append(divEscapedContentElement(message));
        messageDom.scrollTop(messageDom.prop('scrollHeight'));
    }
    messageDom.val('');
}