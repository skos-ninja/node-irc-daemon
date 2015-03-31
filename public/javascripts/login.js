function login(){
    if ($('#password').val() == ""){
        $('#password').val("").addClass('invalid');
        return false;
    }
    else{
        $('#password').removeClass('invalid');
        return true;
    }
}

$(document).ready(function(){
    $('#window-preload').show(300);
});