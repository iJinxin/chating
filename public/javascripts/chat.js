/**
 * Created by jinxin on 2018/3/19.
 */
let Chat = function (socket) {
    this.socket = socket
};

// 发送消息
Chat.prototype.sendMessage = function (room, text) {
    let message = {
        room: room,
        text: text
    };
    this.socket.emit('message', message);
};

// 更变房间
Chat.prototype.changeRoom = function (room) {
    this.socket.emit('join', {
        newRoom: room
    });
};

// 处理聊天信息
Chat.prototype.processCommand = function (command) {
    let words = command.split(' ');
    let command = words[0].substring(1, word[0].length).toLowerCase();
    let message = false;

    switch (command) {
        case 'join':
            words.shift();
            let room = words.join(' ');
            break;
        case 'nick':
            words.shift();
            let name = words.join(' ');
            this.socket.emit('nameAttempt', name);
            break;
        default:
            message = 'Unrecognized command.';
            break;
    }

    return message;
};