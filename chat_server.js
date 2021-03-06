/**
 * Created by coofly on 2014/7/12.
 */
var io = require('socket.io')();
var xssEscape = require('xss-escape');
var chat_db = require('./chat_db');

var nickname_list = [];

function HasNickname(_nickname) {
    for (var i = 0; i < nickname_list.length; i++) {
        if (nickname_list[i] == _nickname) {
            return true;
        }
    }
    return false;
}

function RemoveNickname(_nickname) {
    for (var i = 0; i < nickname_list.length; i++) {
        if (nickname_list[i] == _nickname)
            nickname_list.splice(i, 1);
    }
}

io.on('connection', function (_socket) {
    console.log(_socket.id + ': connection');
    _socket.emit('user_list', nickname_list);
    _socket.emit('need_nickname');
    _socket.emit('server_message', 'Welcome<br/>' +
        'Chatroom<a href="https://coding.net/u/coofly/p/qx-chat/git" target="_blank">' +
        'https://coding.net/u/coofly/p/qx-chat/git</a>，Welcome Star！');

    _socket.on('disconnect', function () {
        console.log(_socket.id + ': disconnect');
        if (_socket.nickname != null && _socket.nickname != "") {
            _socket.broadcast.emit('user_quit', _socket.nickname);
            RemoveNickname(_socket.nickname);
        }
    });

    _socket.on('change_nickname', function (_nickname) {
        _nickname = xssEscape(_nickname.trim());
        console.log(_socket.id + ': change_nickname(' + _nickname + ')');
        var name_len = _nickname.replace(/[^\u0000-\u00ff]/g, "tt").length;
        if (name_len < 4 || name_len > 16) {
            return _socket.emit('change_nickname_error', 'Your Nickname，4 to 16 chars');
        }

        if (_socket.nickname == _nickname) {
            return _socket.emit('change_nickname_error', 'Error。');
        }

        if (HasNickname(_nickname)) {
            return _socket.emit('change_nickname_error', 'Name in used already');
        }

        var old_name = "";
        if (_socket.nickname != "" && _socket.nickname != null) {
            old_name = _socket.nickname;
            RemoveNickname(old_name);
        }

        nickname_list.push(_nickname);
        _socket.nickname = _nickname;

        console.log(nickname_list);

        _socket.emit('change_nickname_done', old_name, _nickname);
        if (old_name == "") {
            return _socket.broadcast.emit('user_join', _nickname)
        } else {
            return _socket.broadcast.emit('user_change_nickname', old_name, _nickname)
        }
    });

    _socket.on('say', function (_content) {
        if ("" == _socket.nickname || null == _socket.nickname) {
            return _socket.emit('need_nickname');
        }
        _content = _content.trim();
        console.log(_socket.nickname + ': say(' + _content + ')');
	    chat_db.execQuery({
			    "sql":"INSERT INTO `chat_logs` (`id`, `name`, `content`, `time`) VALUES (NULL, ?, ?, NOW());",
			    "args":[_socket.nickname, _content],
			    "handler": function (_result) {}
		    });

        _socket.broadcast.emit('user_say', _socket.nickname, xssEscape(_content));
        return _socket.emit('say_done', _socket.nickname, xssEscape(_content));
    });
});

exports.listen = function (_server) {
    return io.listen(_server);
};