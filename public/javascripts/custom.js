var socket = io.connect(window.location.protocol+"//"+window.location.host);
var network = {};
var topics = {};
var gotMsg = false;
var active_channel = null;
var alerted = false;

function changeChannel(element){
    var new_network = element.id.split(':')[0];
    var new_channel = element.id.split(':')[1];
    var new_username = network[new_network]['username'];
    var new_topic = topics[new_network]['#' + new_channel];
    $('#topic').html('Network: ' + new_network + ', Channel: #'+ new_channel + ', Topic: ' + new_topic);
    $(active_channel).hide(300);
    $('#' + new_network + '_' + new_channel).show(300);
    active_channel = '#' + new_network + '_' + new_channel;
    $('#network').val(new_network);
    $('#channel').val('#' + new_channel);
    $('#username').val(new_username);
}

function ping(channel, network, user, message) {
    if (!Notification) {
        if(!alerted) {
            alert('Notifications are supported in modern versions of Chrome, Firefox, Opera and Firefox.');
            alerted = true;
        }
        return;
    }
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    new Notification(user + ' : ' + channel, {
        icon: window.location.protocol+"//"+window.location.host+'/images/logo.png',
        body: message
    });
}

window.onload = function(){
    socket.emit('getChannelList');
};

socket.on('broadcast', function(data) {
   console.log(data)
});

socket.on('gotChannelList', function(list) {
    if(network === {}) return;
    network = list;
    for(var a in network){
        for(var b in network[a]['channels']){
            var channel_name = network[a]['channels'][b].split('#');
            $('#channels').append($('<li id="' + network[a]['name'] + ":" + channel_name[channel_name.length -1] + '" onclick="changeChannel(this)" title="Network: ' + network[a]['name'] + '" >').html('<a href="#" >' + network[a]['channels'][b] + '</a>'));
            $('#chat').append($('<ul id="' + network[a]['name'] + "_" + channel_name[channel_name.length -1] + '" style="display: none" class="messages" >'));
            $('#' + network[a]['name'] + ":" + channel_name[channel_name.length -1]).click(function() {
               changeChannel($('#' + network[a]['name'] + ":" + channel_name[channel_name.length -1]));
            });
        }
    }
    socket.emit('getMessages');
});

socket.on('gotMessages', function(messages) {
    if(gotMsg == false) {
        for(var a in messages){
            topics[a] = {};
            for (var b in messages[a]) {
                if (b.substring(0, 1) === "#") {
                    var topic = messages[a][b]['topic'];
                    if (topic == '') {
                        topic = 'No topic set'
                    }
                    topics[a][b] = topic;
                    for (var c in messages[a][b]['msg']) {
                        var channel_name = b.split('#');
                        var element = '#' + a + '_' + channel_name[channel_name.length - 1];
                        if (messages[a][b]['msg'][c]['from'] === 'server') {
                            $(element).append($('<li style="font-weight: bold">').text(messages[a][b]['msg'][c]['message']));
                        }
                        else if (messages[a][b]['msg'][c]['from'].substring(0, 6) == 'action') {
                            var username = messages[a][b]['msg'][c]['from'].split(':');
                            $(element).append($('<li>').html('<b>* ' + username[1] + '</b> ' + messages[a][b]['msg'][c]['message']));
                        }
                        else if (messages[a][b]['msg'][c]['highlight'] == true) {
                            $(element).append($('<li style="font-weight: bold; color: orange">').text(messages[a][b]['msg'][c]['from'] + ": " + messages[a][b]['msg'][c]['message']));
                        }
                        else {
                            $(element).append($('<li>').text(messages[a][b]['msg'][c]['from'] + ": " + messages[a][b]['msg'][c]['message']));
                        }
                    }
                }
            }
        }
        gotMsg = true;
    }
});

socket.on('receiveMessage', function(from, network, to, message, timestamp, highlight) {
    var channel_name = to.split('#');
    var element = '#' + network + '_' + channel_name[channel_name.length -1];
    if (from === 'server'){
        $(element).append($('<li style="font-weight: bold">').text(message));
    }
    else if(from.substring(0, 6) == 'action'){
        var username = from.split(':');
        $(element).append($('<li>').html('<b>* ' +username[1]+ '</b> ' + message));
    }
    else if (highlight == true){
        ping(to, network, from, message);
        $(element).append($('<li style="font-weight: bold; color: orange">').text(from + ": " + message));
    }
    else{
        $(element).append($('<li>').text(from + ": " + message));
    }
});

socket.on('receivePrivateMessage', function(from, network, to, message) {
    console.log(network + ": " + from + " => " + to + ": " + message);
});

$('form').submit(function(){
    var message_channel = '#' + $('#network').val() + "_" + $('#channel').val().substring(1);
    if ($('#message').val().substring(0, 3) === '/me'){
        if($('#message').val().substring(4) === ''){
            $(message_channel).append($('<li style="font-weight: bold; color: #ffa500">').text('Usage: /me <saying>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', $('#network').val(), $('#channel').val(),  $('#message').val());
        var new_message = $('#message').val().substring(4);
        $(message_channel).append($('<li>').html('<b>* ' +$('#username').val()+ '</b> ' + new_message));
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 5) === '/kick'){
        if($('#message').val().substring(6) === ''){
            $(message_channel).append($('<li style="font-weight: bold; color: #ffa500">').text('Usage: /kick <user> <reason (optional)>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', $('#network').val(), $('#channel').val(),  $('#message').val());
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 4) === '/ban'){
        if($('#message').val().substring(5) === ''){
            $(message_channel).append($('<li style="font-weight: bold; color: #ffa500">').text('Usage: /ban <user>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', $('#network').val(), $('#channel').val(),  $('#message').val());
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 6) === '/unban'){
        if($('#message').val().substring(7) === ''){
            $(message_channel).append($('<li style="font-weight: bold; color: #ffa500">').text('Usage: /unban <user>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', $('#network').val(), $('#channel').val(),  $('#message').val());
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 1) === '/'){
        $(message_channel).append($('<li style="font-weight: bold; color: #ff0000">').text('No command known by that name. If you feel this command should exist please make a github issue'));
        $('#message').val('');
        return false;
    }
    else{
        socket.emit('sendMessage', $('#network').val(), $('#channel').val(),  $('#message').val());
        $('#message').val('');
        return false;
    }
});