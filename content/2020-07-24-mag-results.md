Title: MinHashing all the things: a quick analysis of MAG search results
Date: 2020-07-24 12:00
Author: luizirber
Category: science
Tags: bioinformatics, rust
Slug: mag-results

[Last time] I described a way to search MAGs in metagenomes, 
and teased about interesting results.
Let's dig in some of them!

[Last time]: {filename}/2020-07-22-mag-search.md

I prepared a [repo] with the data and a notebook with the analysis I did in this
post.
You can also follow along in [Binder](https://mybinder.org),
as well as do your own analysis =]

[repo]: https://github.com/luizirber/2020-07-22-mag-search/
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/luizirber/2020-07-22-mag-search/master) for the interactive notebook.

## Preparing some metadata

The supplemental materials for [Tully et al] include more details about each MAG,
so let's download them.
I prepared a small snakemake workflow to do that,
as well as downloading information about the SRA datasets from Tara Oceans
(the dataset used to generate the MAGs),
as well as from [Parks et al],
which also generated MAGs from Tara Oceans.
Feel free to include them in your analysis,
but I was curious to find matches in other metagenomes.

[Tully et al]: https://www.nature.com/articles/sdata2017203
[Parks et al]: https://www.nature.com/articles/s41564-017-0012-7

## Loading the data

The results from the MAG search are in a CSV file,
with a column for the MAG name,
another for the SRA dataset ID for the metagenome and a third column for the
containment of the MAG in the metagenome.
I also fixed the names to make it easier to query,
and finally removed the Tara and Parks metagenomes
(because we already knew they contained these MAGs).

This left us with 23,644 SRA metagenomes with matches,
covering 2,291 of the 2,631 MAGs.
These are results for a fairly low containment (10%),
so if we limit to MAGs with more than 50% containment we still have 1,407 MAGs and 2,938 metagenomes left.

## TOBG_NP-110, I choose you!

That's still a lot,
so I decided to pick a candidate to check before doing any large scale analysis.
I chose TOBG_NP-110 because there were many matches above 50% containment,
and even some at 99%.
Turns out it is also an Archaeal MAG that failed to be classified further than Phylum level (Euryarchaeota),
with a 70.3% complete score in the original analysis.
Oh, let me dissect the name a bit:
TOBG is "Tara Ocean Binned Genome" and "NP" is North Pacific.

And so I went checking where the other metagenome matches came from.
5 of the 12 matches above 50% containment come from one study,
[SRP044185](https://trace.ncbi.nlm.nih.gov/Traces/sra/?study=SRP044185),
with samples collected from a column of water in a station in Manzanillo, Mexico.
Other 3 matches come from 
[https://trace.ncbi.nlm.nih.gov/Traces/sra/?study=SRP003331](https://trace.ncbi.nlm.nih.gov/Traces/sra/?study=SRP003331),
in the South Pacific ocean (in northern Chile).
Another match,
[ERR3256923](https://trace.ncbi.nlm.nih.gov/Traces/sra/?run=ERR3256923),
also comes from the South Pacific.

## What else can I do?

I'm curious to follow [the refining MAGs] tutorial from the Meren Lab and see where this goes,
and especially in using [`spacegraphcats`](https://genomebiology.biomedcentral.com/articles/10.1186/s13059-020-02066-4)
to extract neighborhoods from the MAG and better evaluate what is missing or if there are other interesting bits that
the MAG generation methods ended up discarding.

[the refining MAGs]: http://merenlab.org/data/refining-mags/

So, for now that's it.
But more important,
I didn't want to sit on these results until there is a publication in press,
especially when there are people that can do so much more with these them,
so I decided to make it all public.
It is way more exciting to see this being used to know more about these
organisms than me being the only one with access to this info.

And yesterday I saw [this tweet] by
[@DrJonathanRosa](https://twitter.com/DrJonathanRosa/status/1286381346605027328),
saying:

> I don’t know who told students that the goal of research is to find some
> previously undiscovered research topic, claim individual ownership over it,
> & fiercely protect it from theft, but that almost sounds like, well,
> colonialism, capitalism, & policing 

Amen.

[this tweet]: https://twitter.com/DrJonathanRosa/status/1286381346605027328

## I want to run this with my data!

Next time. But we will have a discussion about scientific infrastructure and
sustainability first =]

## Comments?

- [Thread on Twitter][101]

[101]: https://twitter.com/luizirber/status/TODO
