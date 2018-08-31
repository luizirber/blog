Title: Oxidizing sourmash: WebAssembly
Date: 2018-08-27 15:30
Author: luizirber
Category: science
Tags: rust, webassembly
Slug: sourmash-wasm

sourmash calculates MinHash signatures for genomic datasets,
meaning we are reducing the data (via subsampling) to a small
representative subset (a signature) capable of answering one question:
how similar is this dataset to another one? The key here is that a dataset with
10-100 GB will be reduced to something in the megabytes range, and two approaches
for doing that are:

- The user install our software in their computer.
  This is not so bad anymore (yay bioconda!), but still requires knowledge
  about command line interfaces and how to install all this stuff. The user
  data never leaves their computer, and they can share the signatures later
  if they want to.
- Provide a web service to calculate signatures. In this case no software
  need to be installed, but it's up to someone (me?) to maintain a server running with
  an API and frontend to interact with the users. On top of requiring more
  maintenance, another drawback is that
  the user need to send me the data, which is very inefficient network-wise
  and lead to questions about what I can do with their raw data (and I'm not
  into surveillance capitalism, TYVM).

## But... what if there is a third way?

What if we could keep the frontend code from the web service (very
user-friendly) but do all the calculations client-side (and avoid the network
bottleneck)? The main hurdle
here is that our software is implemented in Python (and C++), which are not
supported in browsers. My first solution was to write the core features of
[sourmash in JavaScript][0], but that quickly started hitting annoying things
like JavaScript not supporting 64-bit integers. There is also the issue of
having another codebase to maintain and keep in sync with the original sourmash,
which would be a relevant burden for us. I gave a [lab meeting][1] about this
approach, using a [drag-and-drop UI as proof of concept][11]. It did work but it
was finicky (dealing with the 64-bit integer hashes is not fun). The good thing
is that at least I had a working UI for further testing[ref]even if horrible, I
need to get some design classes =P[/ref]

In "[Oxidizing sourmash: Python and FFI][19]" I described my road to learn Rust,
but something that I omitted was that around the same time the `WebAssembly`
support in Rust started to look better and better and was a huge influence in 
my decision to learn Rust. Reimplementing the sourmash C++ extension in Rust and
use the same codebase in the browser sounded very attractive,
and now that it was working I started looking into how to use the WebAssembly
target in Rust.

## WebAssembly?

From the [official site][22],

    WebAssembly (abbreviated Wasm) is a binary
    instruction format for a stack-based
    virtual machine. Wasm is designed as a
    portable target for compilation of high-level
    languages like C/C++/Rust, enabling deployment
    on the web for client and server applications.

You can write WebAssembly by hand, but the goal is to have it as lower level
target for other languages. For me the obvious benefit is being able to use
something that is not JavaScript in the browser, even though the goal is not to replace
JS completely but complement it in a big pain point: performance. This also
frees JavaScript from being the target language for other toolchains,
allowing it to grow into other important areas (like language ergonomics).

Rust is not the only language targeting WebAssembly: Go 1.11 includes
[experimental support for WebAssembly][23], and there are even projects bringing
the [scientific Python to the web][21] using WebAssembly. 

## But does it work?

With the [Rust implementation in place][15] and with all tests working on sourmash, I 
added the finishing touches using [`wasm-bindgen`][30] and built an NPM package using
[`wasm-pack`][31]: [sourmash][10] is a Rust codebase compiled to WebAssembly and ready
to use in JavaScript projects.

[30]: https://github.com/rustwasm/wasm-bindgen
[31]: https://github.com/rustwasm/wasm-pack

(Many thanks to Madicken Munk, who also presented during SciPy about how they used
[Rust and WebAssembly to do interactive visualization in Jupyter][9]
and helped with a good example on how to do this properly =] )

Since I already had the working UI from the previous PoC, I [refactored the code][13]
to use the new WebAssembly module and voilà! [It works!][12][ref]the first version
of this demo only worked in Chrome because they implemented the [BigInt proposal][16],
which is not in the official language yet. The funny thing is that BigInt would
have made the JS implementation of sourmash viable, and I probably wouldn't have
written the Rust implementation =P.
Turns out that I didn't need the BigInt support if I didn't expose any 64-bit
integers to JS, and that is what I'm doing now.[/ref].
[ref]Along the way I ended up writing a new FASTQ parser... because it wouldn't
be bioinformatics if it didn't otherwise, right? =P[/ref]
But that was the demo from a year ago with updated code and I got a bit
better with frontend development since then, so here is the new demo:

<div id="files" class="box" ondragover="event.preventDefault()">
  <h2>sourmash + Wasm</h2>
  <div id="drag-container">
    <p><b>Drag &amp; drop</b> a FASTA or FASTQ file here to calculate the sourmash signature.</p>
  </div>

  <div id="progress-container">
    <div id="progress-bar"></div>
  </div>
  <div class="columns">
    <fieldset class="box input-button" id="params">
      <label for="ksize-input">k-mer size:</label>
      <input id="ksize-input" type="number" value=21 />
      <label for="scaled-input">scaled:</label>
      <input id="scaled-input" type="number" value=0 />
      <label for="num-input">number of hashes:</label>
      <input id="num-input" type="number" value=500 />
      <label for="dna-protein-group">Input type:</label>
      <div id="dna-protein-group">
        <input id="dna-input" name="dna-protein-input" type="radio" value="DNA/RNA" checked />
        <label for="dna-input">DNA/RNA</label>
        <input id="protein-input" name="dna-protein-input" type="radio" value="Protein" />
        <label for="protein-input">Protein</label>
      </div>
      <label for="track-abundance-input">Track abundance?</label>
      <input id="track-abundance-input" type="checkbox" checked />
    </fieldset>
    <div class="box" id="download">
      <button id='download_btn' type="button" disabled>Download</button>
    </div>
  </div>
</div>
<link rel="stylesheet" href="{filename}/static/sourmash-wasm/app.css">
<script src="{filename}/static/sourmash-wasm/dist/bundle.js"></script>

For the source code for this demo, check the [sourmash-wasm][42] directory.

[42]: {filename}/static/sourmash-wasm/index.html

## Next steps

The proof of concept works, but it is pretty useless right now.
I'm thinking about building it as a [Web Component][40] and making it really easy
to add to any webpage[ref]or maybe a React component? I really would like to
have something that works independent of framework, but not sure what is the
best option in this case...[/ref].

[40]: https://www.webcomponents.org/

Another interesting feature would be supporting more input formats (the GMOD
project implemented a lot of those!), but more features are probably better
after something simple but functional is released =P

[41]: https://github.com/gmod/

## Next time!

Where we will go next? Maybe explore some decentralized web technologies like
IPFS and dat, hmm? =]

## Comments?

- [Thread on Mastodon][112]
- [Thread on reddit][110]
- [Thread on Twitter][111]

## Updates

- 2018-08-30: Added a demo in the blog post.

[110]: https://www.reddit.com/r/rust/comments/9atie8/blog_post_clientside_bioinformatics_in_the/
[111]: https://twitter.com/luizirber/status/1034206952773935104
[112]: https://social.lasanha.org/@luizirber/100624574917435477

[0]: https://github.com/luizirber/sourmash-node
[1]: https://drive.google.com/open?id=1JvXiDaEA4J3hmEKw6sV-VHMpuHG_sxls3fLxJOht28E
[2]: https://blog.sentry.io/2017/11/14/evolving-our-rust-with-milksnake
[3]: https://github.com/frankmcsherry/differential-dataflow
[4]: https://github.com/frankmcsherry/timely-dataflow
[5]: https://github.com/dib-lab/sourmash/pull/424
[6]: https://github.com/luizirber/2018-python-rust
[7]: https://gccbosc2018.sched.com/event/FEWp/b23-oxidizing-python-writing-extensions-in-rust
[8]: https://scipy2018.scipy.org/ehome/index.php?eventid=299527&tabid=712461&cid=2233543&sessionid=21618890&sessionchoice=1&
[9]: https://munkm.github.io/2018-07-13-scipy/
[10]: https://www.npmjs.com/package/sourmash
[11]: https://soursigs-dnd-luizirber.hashbase.io/
[12]: https://wort-dnd.hashbase.io/
[13]: https://github.com/luizirber/wort-dnd
[14]: https://developers.google.com/web/updates/2018/05/bigint
[15]: https://github.com/luizirber/sourmash-rust
[16]: https://github.com/tc39/proposal-bigint
[19]: {filename}/2018-08-23-sourmash-rust.md

[20]: https://github.com/devosoft/Empirical/
[21]: https://github.com/iodide-project/pyodide
[22]: https://webassembly.org/
[23]: https://golang.org/doc/go1.11#wasm
