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

/*
* 让用户加入房间
* 告知其他用户该用户进入了房间
* 将房间里其他用户的汇总发送给这个用户
* */
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
                userInRoomSummary += nickNames[userSocketId];
            }
        }
        userInRoomSummary += '.';
        socket.emit('message', {text: userInRoomSummary});
    }
}

/*
* 处理用户更改用户名
* */
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function (name) {
        // 不能以Guest开头
        if(name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        }else {
            // 新昵称没被占用，更新并删除旧昵称
            if (namesUsed.indexOf(name) == -1){
                let previousName = nickNames[socket.id];
                let previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + 'is now known as ' + name + '.'
                });
            }else {
                // 昵称被占用，提示
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    })
}

/*
* 发送消息
* */
function handleMessageBroadcasting(socket) {
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

/*
* 创建房间
* */
function handleRoomJoining(socket) {
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

/*
* 用户离开聊天室
* */
function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}


