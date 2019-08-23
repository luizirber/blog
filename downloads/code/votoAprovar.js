function votoAprovar(cadastroId){
  captcha = document.getElementById('cadastroCaptcha').value;
  window.location = 'voto_v.php?votoStatus=1&cadastroId='+cadastroId+"&captcha="+captcha;
}
