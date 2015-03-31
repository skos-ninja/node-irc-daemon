function login(){
    if ($('#password').val() == ""){
        console.log('Missing Fields!!');
        $('#password').val("").addClass('invalid');
        return false;
    }
    else{
        console.log('All fields valid!!');
        $('#password').removeClass('invalid');
        return true;
    }
}

$(document).ready(function(){
    $('#window-preload').show(300);
});