Title: Minha (quase) vida bandida
Date: 2010-08-10 14:08
Author: luizirber
Category: Hacking
Tags: captcha, PIL, python, tesseract
Slug: minha-quase-vida-bandida

Blog juntando moscas, deixa eu ressucitar um projetinho de fim de semana
para ver se anima um pouco.

A ideia inicial desse post surgiu na [PythonBrasil][] do ano passado.
Pensei em fazer uma lightning talk, mas não ficou pronta a tempo (Nota:
sempre bom deixar alguma lightning talk preparada).

Como começou a história: recebi email de uma prima, pedindo para que os
amigos e parentes ajudassem a votar na filha dela em um site de roupas
infantis. A criança mais votada participaria de um comercial e ia
embolsar um monte de roupas.

Ok, ok. Odeio esse tipo de spam, mas também não custa ajudar, né? Fui na
página de votação. Votei uma vez, depois de preencher um captcha, e
tentei votar de novo para ver o que acontecia. "Você votou na última
hora, aguarde para votar novamente". Hmm. Como será que o controle disso
é feito?

Abri o código. Hmm, essa função em javascript aqui que processa o evento
do botão, ela chama uma URL...

{% include_code votoAprovar.js lang:js %}

Opa. E se eu tentar acessar essa URL direto?

    voto_v.php?votoStatus=1&cadastroId=98374&captcha=adb356

Tenho que acertar o captcha. Onde está o captcha? Ah, olha só, o link da
imagem é um arquivo captcha.php, será que dá para acessar direto? Deu.

{% img center /images/original1.png 173 A imagem original. %}

Resumindo, eu tinha a URL para votar, e atualizando o captcha eu
conseguia votar quantas vezes quisesse. Mas ficar fazendo isso na mão é
chato. Como será que funciona identificação de captcha? Uma pesquisa
rapidinha e caí [nesse site][]. E em Python, para facilitar ainda mais
minha vida.

Brinquei um pouco com o PIL, e consegui deixar a imagem com caracteres
bem definidos. Incrivelmente, só precisei converter para escala de
cinza, e aplicar um limiar.

{% include_code clean_captcha.py lang:python %}

{% img center /images/limpa1.png 173 Imagem, depois de processada pelo PIL. %}

E, conforme ia acumulando mais imagens, vi que a minha vida seria mais
fácil ainda: o captcha só tinha caracteres hexadecimais, então nem
precisaria mapear o alfabeto inteiro, só de zero a nove e de 'a' até
'f'. Depois de limpar algumas imagens e juntá-las numa pasta, rodei o
treinador do [tesseract-ocr][], e depois dos arquivos de treinos
prontos, tinha 100% de acerto nas imagens. Sigh, que maravilha de
captcha...

Agora, testar. Criei um perfil falso, e me assustei. Tentei rodar o
script para ver se contava um voto, e quando abri o perfil já tinha 5!
Aparentemente, as mães fazem um "vote-no-meu-filho-que-eu-voto-no-seu",
e como os perfis mais novos aparecem na página principal, me acharam
rapidinho. Ok, rodemos um loop então, cem votos. Yep, todos contados.

{% include_code break_captcha.py lang:python %}

Omiti o endereço do site, mas basicamente o script é esse.

Agora chega o grande momento, o clímax da história, onde o herói escolhe
entre a fama e fortuna ou o que parece moralmente certo. (Que
grandioso!). "Com grandes poderes vêm grandes responsabilidades!". E
todo esse lero-lero.

Apesar de o propósito inicial ter sido ajudar a minha prima, rodar o
script me pareceu uma ajuda grande demais. E meu objetivo era testar o
buraco no sistema de votação, não me aproveitar dele. Acabei deixando
pra lá, e o código ficou mofando no meu computador.

Hoje, quando fui escrever o post, vi que já aconteceu a segunda edição
do concurso, e miseravelmente o sistema é exatamente o mesmo. Vou mandar
esse post para a empresa, quem sabe para o próximo corrijam.

UPDATE: O [Lameiro][] deu a dica nos comentários: buscando no
google.com.br por "captcha PHP" temos, como primeiro hit,
[um tutorial ensinando a gerar o captcha][]
que esse site usa. E, como ele bem notou,
deve ter muitos sites no Brasil com esse mesmo problema.

Fica a dica: nunca confie no primeiro hit do google para implementar a
sua solução de segurança. Aliás, não confie em nenhuma, até saber como
ela funciona.

  [PythonBrasil]: http://www.pythonbrasil.org.br/
  [nesse site]: http://alwaysmovefast.com/2007/11/21/cracking-captchas-for-fun-and-profit/
  [tesseract-ocr]: http://code.google.com/p/tesseract-ocr/
  [Lameiro]: http://lameiro.wordpress.com
  [um tutorial ensinando a gerar o captcha]: http://www.numaboa.com/informatica/tutos/php/949-captcha
