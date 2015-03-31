var error_visible = false;

function validate(){
    if($('#username').val() == ""){
        return false;
    }
    if($('#password').val() == ""){
        return false;
    }
    if($('#port').val() == ""){
        return false;
    }
    try{
      parseInt($('#port').val());
    }
    catch(e){
        return false;
    }
    if($('#server-name').val() == ""){
        return false;
    }
    if($('#server-address').val() == ""){
        return false;
    }
    if($('#server-port').val() == ""){
        return false;
    }
    try{
        parseInt($('#server-port').val())
    }
    catch(e){
        return false;
    }
    if($('#server-username').val() == ""){
        return false;
    }
    if($('#server-password').val() == ""){
        return false;
    }
    if($('#server-channel').val() == ""){
        return false;
    }
    return true;
}

function error(){
    if(error_visible == true){
        return;
    }
    else{
        $('#error').fadeIn();
        error_visible = true;
    }
}

function submitform(){
    if (validate() == true){
        console.log('Form is valid!!');
        $('#setup').submit();
        return true;
    }
    else{
        error();
        $('html, body').animate({scrollTop: '0px'}, 800);
        console.log('Invalid Form!!');
        return false;
    }
}

function resetform(){
    $('#realname').val('');
    $('#username').val('');
    $('#password').val('');
    $('#port').val('5000');
    $('#server-name').val('');
    $('#server-address').val('');
    $('#server-port').val('6697');
    $('#server-username').val('');
    $('#server-password').val('');
    $('#server-channel').val('');
}

$(document).ready(function(){
    $('#window-preload').show(300);
});