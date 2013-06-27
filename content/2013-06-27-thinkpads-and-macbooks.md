Title: Of ThinkPads and MacBooks
Date: 2013-06-27 12:00
Author: luizirber
Category: a day in the life
Slug: thinkpad

Since 2009 I was a Mac user. I was working with iOS development, and it made
sense to have a MacBook for the SDK. I was curious too, because I've been
using Linux distros (Debian, then Ubuntu, then Gentoo when Ubuntu was getting
too heavy for my old laptop) for some time and was a bit tired of making
everything work. Losing control was discomfortable at first, but so many
things working out of the box (like sleep and hibernation!) was worth it. And
Mac apps were much more polished (oh, Garageband).

When I arrived at INPE I got a Linux workstation, the mighty Papera (all the
computers there have Tupi names, Tupi being a language spoken by native
indians here in Brazil). And I tested some new things, like using Awesome[1]
as a window manager, and love it. But it lasted just for some months, because
the machines were swapped for some iMacs and Papera was assigned for other
person. I missed a tiling manager, but I also found Homebrew[2] and it helped
a lot setting up a dev environment in OSX (I know macports and fink existed,
but writing a Homebrew formula is pretty easy, I even contributed one back),
so no big problems in the transition.

But after some time I was getting uneasy. New OSX versions seemed to remove
features instead of adding then (sigh, matrix-organized Spaces...). Lack of
expansibility on new laptops (despite MacBook Air being an awesome computer)
was pushing me back too, because a maxed one would cost way more than I was
willing to pay. And I was spending most of my time in SSH sessions to other
computers or using web apps, so why not go back to Linux?

At the end of 2012 I bought a used ThinkPad X220 with the dock and everything.
When I was younger I always liked the visual, with its black and red look, and
the durability (MacBooks are pretty, but they are easy to scratch and bend).
And the X220 was cheap and in perfect state, and with a small upgrade when I
went to PyCon (ahem, 16 GB RAM and a 128 GB SSD) it is a BEAST now. And all
these benefits too:

  * I have Awesome again!

  * Updated packages thanks to pacman (I installed Arch Linux and I'm loving
    it)

  * When I need a new package it is as easy to write a PKGBUILD file as it was
    to write a Homebrew formula. I wrote some Debian packages in the past and
    they worked, but there were so many rules and parts that I don't think I
    want to write one again. I recognize that a lot of the rules and parts make
    sense with a project as big as Debian (and Ubuntu and everyone else), but
    it could be simpler.

  * Sleep works! Hibernation works! [Except when it doesn't because your EFI
    is half full after the kernel wrote some stacktraces and the chip refuses
    to wake up.][3]

It isn't for those faint of heart, but I'm happy to be back =]


[1]: http://awesome.naquadah.org/
[2]: http://mxcl.github.io/homebrew/
[3]: http://forums.lenovo.com/t5/X-Series-ThinkPad-Laptops/x220-does-not-resume-from-sleep/m-p/1083233/highlight/false#M48825
