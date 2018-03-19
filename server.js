/**
 * Created by jinxin on 2018/3/19.
 */
let http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    socketio = require('socket.io');

let cache = {};

let server = http.createServer(function (request, response) {
    let filePath = false;

    if(request.url == '/'){
        filePath = 'public/index.html';
    }else {
        filePath = 'public' + request.url;
    }

    let absPath = './' + filePath;
    serverStatic(response, cache, absPath);
});

server.listen(3000, function () {
    console.log("server listening on port 3000.");
});

function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

//文件数据服务
function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {"content-Type": mime.getType(path.basename(filePath))});
    response.end(fileContents);
}
/*
* node程序通常把常用的数据缓冲到内存中
* 第一次访问时从文件系统中读取
* */
function serverStatic(response, cache, absPath) {
    if(cache[absPath]){
        sendFile(response, absPath, cache[absPath]);
    }else {
        fs.exists(absPath, function (exists) {
            if(exists){
                fs.readFile(absPath, function (err, data) {
                    if(err){
                        send404(response);
                    }else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                });
            }else {
                send404(response);
            }
        })
    }
}


let chatServer = require('./lib/chat_server');
chatServer.listen(server);



