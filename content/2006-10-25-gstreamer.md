Title: GStreamer
Date: 2006-10-25 02:11
Author: luizirber
Category: FLOSS
Slug: gstreamer

No ano passado eu descobri um dos melhores livros que eu li na minha
vida, [O Guia do Mochileiro das Galáxias][], de Douglas Adams. Pouco
depois de terminar de ler (duas vezes) eu fiz uma busca por Douglas
Adams no Google. E um dos links retornados foi uma sessão de perguntas e
respostas do [Ask Slashdot][], onde ele fala sobre [MAX][], uma
linguagem de programação musical de alto nível orientada a objetos,
quando perguntaram sobre a obsessão do personagem Richard McDuff, do
livro Dirk Gently's Holistic Detective Agency, de mapear processos
naturais em música. Eu comecei a procurar por MAX e acabei achando que
seu criador, [Miller Puckette][], criou também o PureData, que faz o
mesmo e é open source.  

Depois de algum tempo eu entendi como ele funcionava, e eu fiz algumas
coisinhas simples, mas eu não usei ele por muito tempo. E então eu
fiquei sabendo da existência do GStreamer. Apesar de algumas diferenças,
eu fiquei maravilhado com quão simples era fazer algumas coisas que eram
bem difíceis no PureData.  

De fato, eu não sei como as coisas funcionam dentro do PureData, mas eu
realmente gostei de como o GStreamer foi feito: existem Elements, que
tem uma função específica, como ler dados de um arquivo, decodificar
dados ou mandar dados para uma placa de som; existem Bins, um container
para uma coleção de elementos, e Pipelines, um tipo especial de Bin que
permite a execução dos elementos contidos; e existem Pads, que são
usadas para negociar ligações e fluxo de dados entre elementos. E é só
isso. Com essas partes simples, todas juntas, coisas muito complexas
podem ser feitas, como o [Flumotion][], um servidor de streaming, e o
[PITIVI][], um editor não-linear de vídeo.E, claro, o grande
[BugBrother][], o protótipo do programa que eu estou fazendo lá na
Embrapa. Mais sobre esse em outro post.

  [O Guia do Mochileiro das Galáxias]: http://fcpn.multiply.com/reviews/item/1
  [Ask Slashdot]: http://slashdot.org/interviews/00/06/21/1217242.shtml
  [MAX]: http://www.cycling74.com/twiki/bin/view/FAQs/MaxMSPHistory
  [Miller Puckette]: http://www.crca.ucsd.edu/%7Emsp/
  [Flumotion]: http://www.flumotion.net/
  [PITIVI]: http://pitivi.sourceforge.net/
  [BugBrother]: http://sourceforge.net/projects/bugbrother/
