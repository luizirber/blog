Title: Feeds de quadrinhos
Date: 2009-01-20 17:29
Author: luizirber
Category: Hacking
Tags: adao, beautifulsoup, feed, fsp, laerte, malvados, python
Slug: feeds-de-quadrinhos

Infelizmente a [Folha de São Paulo][] não disponibiliza feeds dos
quadrinhos diários dela. Isso significa privar-nos de [Laerte][] e
[Adão][], mas não temam! Caso queiram tirinhas frescas toda a manhã no
seu leitor de feeds favorito, basta usar o que [eu fiz][].

A idéia (sim, sou antigo, meus netos ainda vão dizer 'meu vô é do tempo
que se escrevia ideia com acento') é simples, e foi baseada na do
[Leandro Siqueira][]: apesar do conteúdo da Folha ser exclusivo para
assinantes, as imagens das tirinhas são acessíveis. Basta descobrir o
padrão do nome delas. Mas percebi que as tirinhas de domingo não estavam
aparecendo, pois existem autores diferentes nesse dia (Allan Sieber e
irmãos Bá, atualmente). Então resolvi fazer um que fosse um pouquinho
mais dinâmico, e deu certo, porque quando houve a transição das
dominicais o feed continuou funcionando sem modificações.

Como foi feito? [Python][], [Beautiful Soup][] e [Mechanize][]. O script
autentica no site, busca o índice dos quadrinhos, e acha o link das
imagens para gerar o feed. Aliás, Beautiful Soup é uma das bibliotecas
mais úteis que já usei, para mexer com HTML não tem nada melhor.

E, como o mais complicado já estava feito, semana passada fiz rapidinho
um [feed][] para os [Malvados][] também. Até tem um feed lá, mas é só
para o blog. Ainda não resolvi como fazer para mostrar as séries, mas as
normais aparecem sem problemas no feed (acho, eu uso Google Reader e
aparece. Por favor, testem em outros readers e me avisem).

Ando pensando em generalizar um pouco os dois scripts, para facilitar a
escrita de [screen scrapers][], mas não sei se vale a pena, já que eles
são extremamente dependentes da estrutura da página. Mas vamos ver o que
sai =D

  [Folha de São Paulo]: http://www1.folha.uol.com.br/fsp/
  [Laerte]: http://www.laerte.com.br
  [Adão]: http://www2.uol.com.br/adaoonline/
  [eu fiz]: http://luizirber.org/rss/fsp.xml
  [Leandro Siqueira]: http://leandrosiqueira.com/quadrinhos/
  [Python]: http://www.python.org
  [Beautiful Soup]: http://www.crummy.com/software/BeautifulSoup/
  [Mechanize]: http://wwwsearch.sourceforge.net/mechanize/
  [feed]: http://luizirber.org/rss/malvados.xml
  [Malvados]: http://www.malvados.com.br
  [screen scrapers]: http://en.wikipedia.org/wiki/Screen_scraping
