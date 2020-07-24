Title: MinHashing all the things: searching for MAGs in the SRA
Date: 2020-07-22 12:00
Author: luizirber
Category: science
Tags: bioinformatics, rust
Slug: mag-search

(or: Top-down and bottom-up approaches for working around sourmash limitations)

In the last month I updated [wort],
the system I developed for computing sourmash signature for public genomic databases,
and started calculating signatures
for the [metagenomes] in the [Sequence Read Archive].
This is a more challenging subset than the [microbial datasets] I was doing previously, 
since there are around 534k datasets from metagenomic sources in the SRA,
totalling 447 TB of data.
Another problem is the size of the datasets,
ranging from a couple of MB to 170 GB.
Turns out that the workers I have in `wort` are very good for small-ish datasets,
but I still need to figure out how to pull large datasets faster from the SRA,
because the large ones take forever to process...

The good news is that I managed to calculate signatures for almost 402k of them
[ref]pulling about a 100 TB in 3 days, which was pretty fun to see because I
ended up DDoS myself because I couldn't download the generated sigs fast enough
from the S3 bucket where they are temporarily stored =P[/ref],
which already let us work on some pretty exciting problems =]

[wort]: https://wort.oxli.org
[metagenomes]: https://www.ncbi.nlm.nih.gov/sra/?term=%22METAGENOMIC%22%5Bsource%5D+NOT+amplicon%5BAll+Fields%5D)
[Sequence Read Archive]: https://www.ncbi.nlm.nih.gov/sra/
[microbial datasets]: {filename}/2016-12-28-arch.md

## Looking for MAGs in the SRA

Metagenome-assembled genomes are essential for studying organisms that are hard to isolate and culture in lab,
especially for environmental metagenomes.
[Tully et al] published 2,631 draft MAGs from 234 samples collected during the Tara Oceans expedition,
and I wanted to check if they can also be found in other metagenomes besides the Tara Oceans ones.
The idea is to extract the reads from these other matches and evaluate how the MAG can be improved,
or at least evaluate what is missing in them.
I choose to use environmental samples under the assumption they are easier to deposit on the SRA and have public access,
but there are many human gut microbiomes in the SRA and this MAG search would work just fine with those too.

Moreover,
I want to search for containment,
and not similarity.
The distinction is subtle,
but similarity takes into account both datasets sizes
(well, the size of the union of all elements in both datasets),
while containment only considers the size of the query.
This is relevant because the similarity of a MAG and a metagenome is going to be very small (and is symmetrical),
but the containment of the MAG in the metagenome might be large
(and is asymmetrical, since the containment of the metagenome in the MAG is likely very small because the metagenome is so much larger than the MAG).

[Tully et al]: https://www.nature.com/articles/sdata2017203

## The computational challenge: indexing and searching

sourmash signatures are a small fraction of the original size of the datasets,
but when you have hundreds of thousands of them the collection ends up being pretty large too.
More precisely, 825 GB large.
That is way bigger than any index I ever built for sourmash,
and it would also have pretty distinct characteristics than what we usually do: 
we tend to index genomes and run `search` (to find similar genomes) or `gather`
(to decompose metagenomes into their constituent genomes),
but for this MAG search I want to find which metagenomes have my MAG query above a certain containment threshold.
Sort of a `sourmash search --containment`,
but over thousands of metagenome signatures.
The main benefit of an SBT index in this context is to avoid checking all signatures because we can prune the search early,
but currently SBT indices need to be totally loaded in memory during `sourmash index`.
I will have to do this in the medium term,
but I want a solution NOW! =]

[sourmash 3.4.0] introduced `--from-file` in many commands,
and since I can't build an index I decided to use it to load signatures for the metagenomes.
But... `sourmash search` tries to load all signatures in memory,
and while I might be able to find a cluster machine with hundreds of GBs of RAM available, 
that's not very practical.

[sourmash 3.4.0]: https://github.com/dib-lab/sourmash/releases/tag/v3.4.0

So, what to do?

## The top-down solution: a snakemake workflow

I don't want to modify sourmash now,
so why not make a workflow and use snakemake to run one `sourmash search --containment` for each metagenome?
That means 402k tasks,
but at least I can use [batches] and [SLURM job arrays] to submit reasonably-sized jobs to our HPC queue.
After running all batches I summarized results for each task,
and it worked well for a proof of concept.

[batches]: https://snakemake.readthedocs.io/en/stable/executing/cli.html#dealing-with-very-large-workflows
[SLURM job arrays]: https://slurm.schedmd.com/job_array.html

But... it was still pretty resource intensive:
each task was running one query MAG against one metagenome,
and so each task needed to do all the overhead of starting the Python interpreter and parsing the query signature,
which is exactly the same for all tasks.
Extending it to support multiple queries to the same metagenome would involve duplicating tasks,
and 402k metagenomes times 2,631 MAGs is...
a very large number of jobs.

I also wanted to avoid clogging the job queues,
which is not very nice to the other researchers using the cluster.
This limited how many batches I could run in parallel...

## The bottom-up solution: Rust to the rescue!

Thinking a bit more about the problem,
here is another solution:
what if we load all the MAGs in memory
(as they will be queried frequently and are not that large),
and then for each metagenome signature load it,
perform all MAG queries,
and then unload the metagenome signature from memory?
This way we can control memory consumption
(it's going to be proportional to all the MAG sizes plus the size of the largest metagenome)
and can also efficiently parallelize the code because each task/metagenome is independent
and the MAG signatures can be shared freely (since they are read-only).

This could be done with the sourmash Python API plus `multiprocessing` or some
other parallelization approach (maybe dask?),
but turns out that everything we need comes from the Rust API.
Why not enjoy a bit of the [fearless concurrency] that is one of the major Rust goals?

[fearless concurrency]: https://doc.rust-lang.org/stable/book/ch16-00-concurrency.html

[The whole code] ended up being 176 lines long,
including command line parsing using [strucopt] and parallelizing the search using [rayon]
and a [multiple-producer, single-consumer channel] to write results to an output
(either the terminal or a file).
This version took 11 hours to run,
using less than 5GB of RAM and 32 processors,
to search 2k MAGs against 402k metagenomes.
And, bonus! It can also be parallelized again if you have multiple machines,
so it potentially takes a bit more than an hour to run if you can allocate 10 batch jobs,
with each batch 1/10 of the metagenome signatures.

[The whole code]: https://github.com/luizirber/phd/blob/aa1ed9eb33ba71fdf9b3f2c92931701be6df00cd/experiments/wort/sra_search/src/main.rs
[strucopt]: https://docs.rs/structopt/latest/structopt/
[rayon]: https://docs.rs/rayon/latest/rayon/
[multiple-producer, single-consumer channel]: https://doc.rust-lang.org/std/sync/mpsc/fn.channel.html

## So, is bottom-up always the better choice?

I would like to answer "Yes!",
but bioinformatics software tends to be organized as command line interfaces,
not as libraries.
Libraries also tend to have even less documentation than CLIs,
and this particular case is not a fair comparison because...
Well, I wrote most of the library,
and the Rust API is not that well documented for general use.

But I'm pretty happy with how the sourmash CLI is viable both for the top-down approach
(and whatever workflow software you want to use) as well as how the Rust core worked for the bottom-up approach.
I think the most important is having the option to choose which way to go,
especially because now I can use the bottom-up approach to make the sourmash CLI
and Python API better.
The top-down approach is also way more accessible in general,
because you can pick your favorite workflow software and use all the tricks you're comfortable with.

## But, what about the results?!?!?!

Next time. But I did find MAGs with over 90% containment in very different locations,
which is pretty exciting!

I also need to find a better way of distributing all these signature,
because storing 4 TB of data in S3 is somewhat cheap,
but transferring data is very expensive.
All signatures are also available on IPFS,
but I need more people to host them and share.
Get in contact if you're interested in helping =]

And while I'm asking for help,
any tips on pulling data faster from the SRA are greatly appreciated!

## Comments?

- [Thread on Twitter][101]

[101]: https://twitter.com/luizirber/status/1285782732790849537
