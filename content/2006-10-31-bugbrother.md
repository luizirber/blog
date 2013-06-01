Title: BugBrother
Date: 2006-10-31 22:44
Author: luizirber
Category: Projetos
Slug: bugbrother

[BugBrother][] é o protótipo (ou melhor, versão de desenvolvimento) do
programa que eu estou desenvolvendo na [Embrapa][], o [SACAM][], que
significa Sistema de Análise Comportamental de Animais em Movimento. Sua
função, agora que a sigla é conhecida, é um tanto óbvia: Consiste em
capturar imagens de uma entrada de vídeo e aplicar algoritmos de
detecção de movimento, a fim de guardar uma trilha do movimento
realizado pelo animal. A partir dessa trilha e após definir áreas numa
imagem de referência é possível reportar estatísticas úteis para
estudos, realizados geralmente por entomólogos. O experimento básico
feito por eles é realizado com o auxílio de um olfatômetro em forma de
Y, onde o inseto é liberado no pé do Y e nas outras duas extremidades
são liberados feromônios ou outras substâncias. As estatísticas geradas
são úteis no estudo de novas armadilhas químicas para insetos, muito
menos danosas do que agrotóxicos.O funcionamento básico do programa
passa por essas etapas:  

  - Capturar a imagem de uma entrada de vídeo (atualmente qualquer
dispositivo compatível com Video4Linux)  
  - Aplicar um algoritmo de detecção de movimento e guardar as
coordenadas (X,Y) geradas pelo movimento detectado.  
  - A partir dessas coordenadas calcular parâmetros como tortuosidade,
desvio angular e velocidade do inseto analisado.  
  - Gerar relatórios.  

Atualmente os dois primeiros itens estão funcionais, o terceiro está
próximo de ser terminado e o último começará a ser desenvolvido na
próxima semana.

Um ponto que possa ter causado interesse: digo que é o protótipo pois no
momento ele está sendo desenvolvido usando [Python][] + [PyGTK][] +
[GStreamer][]. Devido a problemas de desempenho (principalmente em
relação ao algoritmo de detecção) ele será implementado novamente, em C
+ [GTK+][] + [GStreamer][], após a conclusão e avaliação do protótipo. O
que é uma pena, pois do ponto de vista de clareza de código e
reaproveitamento será um retrocesso. Mas a vida não é sempre o que a
gente quer =D

  [BugBrother]: http://sourceforge.net/projects/bugbrother
  [Embrapa]: http://www.cnpdia.embrapa.br/
  [SACAM]: http://repositorio.agrolivre.gov.br/projects/sacam
  [Python]: http://www.python.org
  [PyGTK]: http://www.pygtk.org
  [GStreamer]: http://www.gstreamer.org
  [GTK+]: http://www.gtk.org
