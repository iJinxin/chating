/**
 * Created by jinxin on 2018/3/19.
 */
let socketio = require('socket.io');

let io = null,
    guestNumber = {},
    nickNames = {},
    namesUsed = [],
    currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connections', function (socket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket, 'Lobby');
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('room', function () {
            socket.emit('room', function () {
                socket.emit('rooms', io.sockets.manager.rooms);
            });

            handleClientDisconnection(socket, nickNames, namesUsed);
        })
    })
};

/*
* 分配昵称
* 用户昵称存放在NickNames中，并且跟内部socket.io相关联
* */
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    let name = "Guest" + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room:room});
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + 'has joined ' + room + '.'
    });

    let usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length > 1){
        let userInRoomSummary = 'Users currently in ' + room + ': ';
        for(let index in usersInRoom){
            let userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index > 0){
                    userInRoomSummary += ', ';
                }
            }
        }
    }
}


