Title: Robô Shrek
Date: 2009-06-12 11:29
Author: luizirber
Category: Hacking, Projetos, universidade
Tags: arduino, FIA, gstreamer, N800, python, ufscar
Slug: robo-shrek

Na última quarta-feira aconteceu a Feira de Informática Aplicada, ligada
à Semana de Computação da UFSCar. Eu e Alphalpha resolvemos participar
para testar o Arduino que eu tinha comprado no começo do ano. O tempo
era curto, mas mesmo assim fomos em frente e juntamos algumas peças que
sobraram do [robô][] do [GEDAI][], um N800, um Arduino Duemilanove e
montamos nosso próprio robô, chamado de Shrek.

Por que Shrek? Porque Shrek é um ogro, ogros são como cebolas
(<span style="text-decoration:line-through;">fedem</span> são feitos de
camadas), e nosso robô é feito de várias camadas simples que, juntas,
fazem algo complexo.

Como funciona? O Arduino controla os motores, e recebe dados pelo USB
(como uma porta serial) vindos do N800. O N800 está conectado em uma
rede wifi, e recebe comandos via socket. Além disso, também envia vídeo
e áudio para a aplicação (que no momento roda em um PC), e a aplicação
envia os comandos e exibe o vídeo e o áudio.

Devido ao pouco tempo, apenas 3 comandos simples foram implementados
(frente, giro à esquerda, giro à direita), mas nosso objetivo estava
cumprido: a comunicação entre as partes estava funcionando direitinho, e
agora podemos partir para incrementá-lo.

Todo o código está disponível no [Google Code][], e queremos levá-lo
para o FISL (depois de arranjarmos motores melhores).

  [robô]: http://www.youtube.com/watch?v=4PPXEsENpCY
  [GEDAI]: http://www2.dc.ufscar.br/~gedai/
  [Google Code]: http://code.google.com/p/shrekenc
