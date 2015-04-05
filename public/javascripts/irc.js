var socket = io.connect(window.location.protocol+"//"+window.location.host);
var network = {};
var topics = {};
var gotMsg = false;
var active_channel = null;
var user = false;
var alerted = false;
var username = "";
var channel = "";
var networks = "";
var pending_invite = null;
var new_server_selector = false;

function changeChannel(element){
    if(element.id.split(':')[0] === 'p'){
        var new_network = element.id.split(':')[1];
        var new_channel = element.id.split(':')[2];
        var new_username = network[new_network]['username'];
        $('#chat-title').fadeOut().text('Network: ' + new_network + ', User: ' + new_channel).fadeIn();
        if (active_channel == null) {
            $('#message').removeAttr("disabled");
            $('#message-submit').removeAttr("disabled");
        }
        $(active_channel).hide(300);
        $('#pc_' + new_network + '_' + new_channel).show(300);
        active_channel = '#pc_' + new_network + '_' + new_channel;
        networks = new_network;
        channel = new_channel;
        username = new_username;
        user = true;
        $('html, body').animate({scrollTop: $('#chat-scroll').height()}, 'slow');
    }
    else {
        var new_network = element.id.split(':')[0];
        var new_channel = element.id.split(':')[1];
        var new_username = network[new_network]['username'];
        if (active_channel == null) {
            $('#message').removeAttr("disabled");
            $('#message-submit').removeAttr("disabled");
        }
        $(active_channel).hide(300);
        $('#chat-title').fadeOut().text('Network: ' + new_network + ', Channel: #' + new_channel + ', Topic: ' + topics[new_network]['#' + new_channel]).fadeIn();
        $('#' + new_network + '_' + new_channel).show(300);
        active_channel = '#' + new_network + '_' + new_channel;
        networks = new_network;
        channel = '#' + new_channel;
        username = new_username;
        user = false;
        $('html, body').animate({scrollTop: $('#chat-scroll').height()}, 'slow');
    }
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
    if(channel === 'pm'){
        new Notification(user, {
            icon: window.location.protocol+"//"+window.location.host+'/images/logo.png',
            body: message
        });
        toast(user, 4000);
    }
    else {
        new Notification(user + ' : ' + channel, {
            icon: window.location.protocol + "//" + window.location.host + '/images/logo.png',
            body: message
        });
        toast(user + ' : ' + channel, 4000);
    }
}

function modalChosen(){
    if($('#new_selector').val() === 'channel'){
        $('#new').closeModal({
            complete: function(){
                console.log(network);
                if(new_server_selector == false){
                    for( var a in network){
                        $('#new_channel_server_selector').append('<option value="' + network[a]['name'] + '">' + network[a]['name'] +'</option>');
                        $('#new_pm_server_selector').append('<option value="' + network[a]['name'] + '">' + network[a]['name'] +'</option>');
                    }
                    $('#new_channel_server_selector').material_select();
                    $('#new_pm_server_selector').material_select();
                }
                $('#new_channel').openModal();
            }
        });
    }
    if($('#new_selector').val() === 'pm'){
        $('#new').closeModal({
            complete: function(){
                if(new_server_selector == false){
                    for( var a in network){
                        $('#new_channel_server_selector').append('<option value="' + network[a]['name'] + '">' + network[a]['name'] +'</option>');
                        $('#new_pm_server_selector').append('<option value="' + network[a]['name'] + '">' + network[a]['name'] +'</option>');
                    }
                    $('#new_channel_server_selector').material_select();
                    $('#new_pm_server_selector').material_select();
                }
                $('#new_pm').openModal();
            }
        });
    }
    if($('#new_selector').val() === 'server'){
        $('#new').closeModal({
            complete: function(){
                $('#new_network').openModal();
            }
        });
    }
    return false;
}

$(document).ready(function(){
    $('#window-preload').show(300);
    socket.emit('getChannelList');
    $('#new_selector').material_select();
    $('.modal-trigger').leanModal();
    $('.dropdown-button').dropdown({
            inDuration: 300,
            outDuration: 225,
            constrain_width: true, // Does not change width of dropdown to that of the activator
            hover: false, // Activate on click
            alignment: 'left', // Aligns dropdown to left or right edge (works with constrain_width)
            gutter: 0, // Spacing from edge
            belowOrigin: true // Displays dropdown below the button
        }
    );
});

socket.on('broadcast', function(data) {
    console.log(data)
});

socket.on('gotChannelList', function(list) {
    if(network == {}) return;
    network = list;
    for(var a in network){
        $('#channels').append($('<div class="divider"></div>'));
        $('#channels').append($('<li class="collection-item network" style="font-weight: bold" id="network:' + network[a]['name'] + '" title="Network" >').text(network[a]['name']));
        for(var b in network[a]['channels']) {
            if (network[a]['channels'][b].toString().substring(0, 1) === '#') {
                var channel_name = network[a]['channels'][b].split('#');
                $('#channels').append($('<li class="collection-item" id="' + network[a]['name'] + ":" + channel_name[channel_name.length - 1] + '" onclick="changeChannel(this)" title="Network: ' + network[a]['name'] + '" >').html('<a href="#" >' + network[a]['channels'][b] + '</a>'));
                $('#chat').append($('<ul id="' + network[a]['name'] + "_" + channel_name[channel_name.length - 1] + '" style="display: none" class="collection" >'));
                $('#' + network[a]['name'] + ":" + channel_name[channel_name.length - 1]).click(function () {
                    changeChannel($('#' + network[a]['name'] + ":" + channel_name[channel_name.length - 1]));
                });
            }
        }
    }
    socket.emit('getMessages');
});

socket.on('gotMessages', function(messages, pmessages) {
    if(gotMsg == false) {
        for(var a in messages){
            topics[a] = {};
            for (var b in messages[a]) {
                if (messages[a][b]['topic'] === ''){
                    topics[a][b] = 'No topic set';
                }
                else {
                    topics[a][b] = messages[a][b]['topic'];
                }
                if (b.substring(0, 1) === "#") {
                    for (var c in messages[a][b]['msg']) {
                        var channel_name = b.split('#');
                        var element = '#' + a + '_' + channel_name[channel_name.length - 1];
                        if (messages[a][b]['msg'][c]['from'] === 'server') {
                            $(element).append($('<li class="collection-item" style="font-weight: bold">').text(messages[a][b]['msg'][c]['message']));
                        }
                        else if (messages[a][b]['msg'][c]['from'].substring(0, 7) == 'action:') {
                            var username = messages[a][b]['msg'][c]['from'].split(':');
                            $(element).append($('<li class="collection-item" >').html('<b>* ' + username[1] + '</b> ' + messages[a][b]['msg'][c]['message']));
                        }
                        else if (messages[a][b]['msg'][c]['highlight'] == true) {
                            $(element).append($('<li class="collection-item" style="font-weight: bold; color: orange">').text(messages[a][b]['msg'][c]['from'] + ": " + messages[a][b]['msg'][c]['message']));
                        }
                        else {
                            $(element).append($('<li class="collection-item" >').text(messages[a][b]['msg'][c]['from'] + ": " + messages[a][b]['msg'][c]['message']));
                        }
                    }
                }
            }
        }
        for(var a in pmessages){
            $('#pm').append($('<div class="divider"></div>'));
            $('#pm').append($('<li class="collection-item network" style="font-weight: bold" id="pmnetwork:' + a + '" title="Network" >').text(a));
            for(var b in pmessages[a]){
                $('#pm').append($('<li class="collection-item" id="p:' + a + ":" + b + '" onclick="changeChannel(this)" title="Network: ' + a + '" >').html('<a href="#" >' + b + '</a>'));
                $('#chat').append($('<ul id="pc_' + a + "_" + b + '" style="display: none" class="collection" >'));
                $('#p:' + a + ":" + b).click(function () {
                    changeChannel($('#pc:' + a + ":" + b));
                });
                for(var c in pmessages[a][b]['msg']){
                    if (pmessages[a][b]['msg'][c]['to'] === 'server'){
                        $('#pc_' + a + '_' + b).append($('<li class="collection-item" style="font-weight: bold">').text(pmessages[a][b]['msg'][c]['message']));
                    }
                    else if(pmessages[a][b]['msg'][c]['to'].substring(0, 7) == 'action:'){
                        var username = pmessages[a][b]['msg'][c]['to'].split(':');
                        $('#pc_' + a + '_' + b).append($('<li class="collection-item" >').html('<b>* ' +username[1]+ '</b> ' + pmessages[a][b]['msg'][c]['message']));
                    }
                    else {
                        $('#pc_' + a + '_' + b).append($('<li class="collection-item" >').text(pmessages[a][b]['msg'][c]['to'] + ": " + pmessages[a][b]['msg'][c]['message']));
                    }
                }
            }
        }
        gotMsg = true;
        $('#window-selector').show(300);
        $('#chat-title').fadeOut().text('No Chat Window Selected').fadeIn();
    }
});

socket.on('receiveMessage', function(from, network, to, message, timestamp, highlight) {
    var channel_name = to.split('#');
    var element = '#' + network + '_' + channel_name[channel_name.length -1];
    if (from === 'server'){
        $(element).append($('<li class="collection-item tooltiped" style="font-weight: bold;" data-position="bottom" data-tooltip="' + timestamp +'" >').text(message));
    }
    else if(from.substring(0, 7) == 'action:'){
        var username = from.split(':');
        $(element).append($('<li class="collection-item tooltiped" data-position="bottom" data-tooltip="' + timestamp +'" >').html('<b>* ' +username[1]+ '</b> ' + message));
        if (highlight == true){
            ping(to, network, username[1], message);
        }
    }
    else if (highlight == true){
        ping(to, network, from, message);
        $(element).append($('<li class="collection-item tooltiped" style="font-weight: bold; color: orange;" data-position="bottom" data-tooltip="' + timestamp +'" >').text(from + ": " + message));
    }
    else{
        $(element).append($('<li class="collection-item" >').text(from + ": " + message));
    }
    $('html, body').animate({scrollTop:$('#chat-scroll').height()}, 'slow');
    $('.tooltipped').tooltip({delay: 50});
});

socket.on('receivePrivateMessage', function(from, network, to, message, timestamp, self) {
    var element = '#pc_' + network + '_' + to;
    if (from === 'server'){
        $(element).append($('<li class="collection-item" style="font-weight: bold">').text(message));
        var username = 'Server';
    }
    else if(from.substring(0, 7) == 'action:'){
        var username = from.split(':')[1];
        $(element).append($('<li class="collection-item tooltiped" data-position="bottom" data-tooltip="' + timestamp +'" >').html('<b>* ' + username + '</b> ' + message));
    }
    else{
        $(element).append($('<li class="collection-item tooltiped" data-position="bottom" data-tooltip="' + timestamp +'" >').text(from + ": " + message));
        var username = from;
    }
    if (!self) {
        ping('pm', network, username, message);
    }
    $('html, body').animate({scrollTop:$('#chat-scroll').height() + 800}, 'slow');
    $('.tooltipped').tooltip({delay: 50});
});

socket.on('topic', function(Network, Channel, new_topic) {
    topics[Network][Channel] = new_topic;
    if(Network === networks){
        if(Channel === channel){
            $('#chat-title').fadeOut().text('Network: ' + Network + ', Channel: ' + Channel + ', Topic: ' + topics[Network][Channel]).fadeIn();
        }
    }
});

socket.on('invite', function(from, network, channel) {
    ping(channel, network, from, "You have been invited to join " + channel + ". Type /invite accept to join the channel!");
    $(active_channel).append($('<li class="collection-item" style="font-weight: bold">').text("You have been invited to join " + channel + ". Type /invite accept to join!"));
    pending_invite = true;
});

socket.on('disconnect', function(){
   toast('You have lost connection to the server!', 4000);
});

socket.on('reconnect', function(){
   toast('You have regained connection! ' +
   'You may have to refresh to see missed messages', 4000);
});

socket.on('server_error', function(error_message){
   console.log('Server Error: ' + error_message);
   toast('Server Error: ' + error_message, 10000);
});

$('form').submit(function(){
    var message_channel = '#' + networks + "_" + channel.substring(1);
    if (user == true){
        if ($('#message').val().substring(0, 7) === '/invite'){
            if ($('#message').val().substring(8, 14) === ' accept'){

            }
        }
        if ($('#message').val().substring(0, 3) === '/me'){
            if($('#message').val().substring(4) === ''){
                $(message_channel).append($('<li class="collection-item" style="font-weight: bold; color: #ffa500">').text('Usage: /me <saying>'));
                $('#message').val('');
                return false;
            }
            socket.emit('sendMessage', networks, channel,  $('#message').val());
            $('#message').val('');
            return false;
        }
        else if($('#message').val().substring(0, 1) === '/'){
            $(message_channel).append($('<li class="collection-item" style="font-weight: bold; color: #ff0000">').text('No command known by that name. If you feel this command should exist please make a github issue'));
            $('#message').val('');
            return false;
        }
        else{
            socket.emit('sendMessage', networks, channel,  $('#message').val());
            $('#message').val('');
            return false;
        }
    }
    if ($('#message').val().substring(0, 3) === '/me'){
        if($('#message').val().substring(4) === ''){
            $(message_channel).append($('<li class="collection-item" style="font-weight: bold; color: #ffa500">').text('Usage: /me <saying>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', networks, channel,  $('#message').val());
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 5) === '/kick'){
        if($('#message').val().substring(6) === ''){
            $(message_channel).append($('<li class="collection-item" style="font-weight: bold; color: #ffa500">').text('Usage: /kick <user> <reason (optional)>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', networks, channel,  $('#message').val());
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 4) === '/ban'){
        if($('#message').val().substring(5) === ''){
            $(message_channel).append($('<li class="collection-item" style="font-weight: bold; color: #ffa500">').text('Usage: /ban <user>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', networks, channel,  $('#message').val());
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 6) === '/unban'){
        if($('#message').val().substring(7) === ''){
            $(message_channel).append($('<li class="collection-item" style="font-weight: bold; color: #ffa500">').text('Usage: /unban <user>'));
            $('#message').val('');
            return false;
        }
        socket.emit('sendMessage', $('#network').val(), $('#channel').val(),  $('#message').val());
        $('#message').val('');
        return false;
    }
    else if($('#message').val().substring(0, 1) === '/'){
        $(message_channel).append($('<li class="collection-item" style="font-weight: bold; color: #ff0000">').text('No command known by that name. If you feel this command should exist please make a github issue'));
        $('#message').val('');
        return false;
    }
    else{
        socket.emit('sendMessage', networks, channel,  $('#message').val());
        $('#message').val('');
        return false;
    }
});