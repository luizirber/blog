Title: Oxidizing sourmash: Python and FFI
Date: 2018-08-23 17:00
Author: luizirber
Category: universidade
Tags: rust, sourmash, python
Slug: sourmash-rust

I think the first time I heard about Rust was because Frank Mcsherry chose it to
write a [timely dataflow][55] implementation.
Since then it started showing more and more in my news sources,
leading to Armin Ronacher publishing a post in the Sentry blog last November about
writing [Python extensions in Rust][23].

Last December I decided to give it a run:
I spent some time porting the C++ bits of [sourmash][52]
to Rust.
The main advantage here is that it's a problem I know well,
so I know what the code is supposed to do and can focus on figuring out
syntax and the mental model for the language.
I started digging into the `symbolic` codebase and understanding what they did,
and tried to mirror or improve it for my use cases.

(About the post title: The process of converting a codebase to Rust is referred as ["Oxidation"][0] in
the Rust community, following the codename Mozilla chose for the process of
integrating Rust components into the Firefox codebase.
[ref]The creator of the language is known to keep making up different
explanations for the [name of the language][56],
but in this case "oxidation" refers to the chemical process that creates
rust, and rust is the closest thing to metal (metal being the hardware).
There are many terrible puns in the Rust community.[/ref]
Many of these components were tested and derived in Servo, an experimental
browser engine written in Rust, and are being integrated into Gecko,
the current browser engine (mostly written in C++).)

## Why Rust?

There are other programming languages more focused on scientific software
that could be used instead, like Julia[ref]Even more now that it hit 1.0,
it is a really nice language[/ref]. Many programming languages start from a
specific niche (like R and statistics,
or Maple and mathematics) and grow into larger languages over time.
While Rust goal is not to be a scientific language,
its focus on being a general purpose language allows a phenomenon similar
to what happened with Python, where people from many areas pushed the
language in different directions (system scripting, web development,
numerical programming...) allowing developers to combine all these things
in their systems.

But by far my interest in Rust is for the many best practices it brings to the default experience:
integrated package management (with Cargo),
documentation (with rustdoc), testing and benchmarking.
It's understandable that older languages like C/C++ need
more effort to support some of these features (like modules and an unified
build system), since they are designed by standard and need to keep backward
compatibility with codebases that already exist.
Nonetheless, the lack of features increase the effort needed to have good
software engineering practices, since you need to choose a solution that might
not be compatible with other similar but slightly different options,
leading to fragmentation and increasing the impedance to use these features.

Another big reason is that Rust doesn't aim to completely replace what already
exists, but complement and extend it. Two very good talks about how to do this,
one by [Ashley Williams][60], another by [E. Dunham][61].

## Converting from a C++ extension to Rust

The current implementation of the core data structures in sourmash is in a
C++ extension wrapped with Cython. My main goals for converting the code are:

- support additional languages and platforms. sourmash is available as a Python
  package and CLI, but we have R users in the lab that would benefit from having
  an R package, and ideally we wouldn't need to rewrite the software every time
  we want to support a new language.

- reducing the number of wheel packages necessary (one for each OS/platform).

- in the long run, use the Rust memory management concepts (lifetimes, borrowing)
to increase parallelism in the code.

Many of these goals are attainable with our current C++ codebase, and
"rewrite in a new language" is rarely the best way to solve a problem.
But the reduced burden in maintenance due to better tooling,
on top of features that would require careful planning to execute
(increasing the parallelism without data races) while maintaining compatibility
with the current codebase are promising enough to justify this experiment.
[{% img /images/arch_cpp.png "current implementation" %}][62]

Cython provides a nice gradual path to migrate code from Python to C++,
since it is a superset of the Python syntax. It also provides low overhead
for many C++ features, especially the STL containers, with makes it easier
to map C++ features to the Python equivalent.
For research software this also lead to faster exploration of solutions before
having to commit to lower level code, but without a good process it might also
lead to code never crossing into the C++ layer and being stuck in the Cython
layer. This doesn't make any difference for a Python user, but it becomes
harder from users from other languages to benefit from this code (since your
language would need some kind of support to calling Python code, which is not
as readily available as calling C code).

Depending on the requirements, a downside is that Cython is tied to the CPython API,
so generating the extension requires a development environment set up with
the appropriate headers and compiler. This also makes the extension specific
to a Python version: while this is not a problem for source distributions,
generating wheels lead to one wheel for each OS and Python version supported.

## The new implementation

This is the overall architecture of the Rust implementation:
[{% img /images/arch_rust.png "the Rust implementation" %}][63]
It is pretty close to what `symbolic` does,
so let's walk through it.

### The Rust code

If you take a look at my Rust code, you will see it is very... C++. A lot of the
code is very similar to the original implementation, which is both a curse and a
blessing: I'm pretty sure that are more idiomatic and performant ways of doing
things, but most of the time I could lean on my current mental model for C++ to
translate code. The biggest exception was the `merge` function, were I was doing
something on the C++ implementation that the borrow checker didn't like.
Eventually I found it was because it couldn't keep track of the lifetime
correctly and putting braces around it fixed the problem,
which was both an epiphany and a WTF moment. [Here][80] is an example that triggers
the problem, and the [solution][81].

"Fighting the borrow checker" seems to be a common theme while learning Rust,
but the compiler really tries to help you to understand what is happening and
(most times) how to fix it. A lot of people grow to hate the borrow checker,
but I see it more as a 'eat your vegetables' situation: you might not like it
at first, but it's better in the long run. Even though I don't have a big
codebase in Rust yet, it keeps you from doing things that will come back to bite
you hard later.

[80]: https://play.rust-lang.org/?gist=eae9de12950d1b2a7699cd49a3571c37&version=stable
[81]: https://play.rust-lang.org/?gist=c8733c5125766930a589c8d0412af99c&version=stable

### Generating C headers for Rust code: cbindgen

With the Rust library working, the next step was taking the Rust code and generate C headers describing the
functions and structs we expose with the `#[no_mangle]` attribute in Rust
(these are defined in the [`ffi.rs`][70] module in `sourmash-rust`).
This attribute tells the Rust compiler to generate names that are compatible
with the C ABI, and so can be called from other languages that implement FFI
mechanisms. FFI (the foreign function interface) is quite low-level,
and pretty much defines things that C can represent: integers, floats, pointers
and structs. It doesn't support higher level concepts like objects or generics,
so in a sense it looks like a feature funnel.
This might sound bad, but ends up being something that other languages can
understand without needing too much extra functionality in their runtimes,
which means that most languages have support to calling code through an FFI.

Writing the C header by hand is possible, but is very error prone.
A better solution is to use [`cbindgen`][71],
a program that takes Rust code and generate a C header file automatically.
`cbindgen` is developed primarily to generate the C headers for [webrender][72],
the GPU-based renderer for servo,
so it's pretty likely that if it can handle a complex codebase it will work
just fine for the majority of projects.

[70]: https://github.com/luizirber/sourmash-rust/blob/ead9ae0ed3b2d16c9e3b8379919f3bfd2efd21ae/src/ffi.rs
[71]: https://github.com/eqrion/cbindgen
[72]: https://github.com/servo/webrender/

### Interfacing with Python: CFFI and Milksnake

Once we have the C headers, we can use the FFI to
call Rust code in Python. Python has a FFI module in the standard library: `ctypes`,
but the Pypy developers also created CFFI, which has more features.

The C headers generated by cbindgen can be interpreted by CFFI to generate
a low-level Python interface for the code. This is the equivalent of declaring
the functions/methods and structs/classes in a `pxd` file (in the Cython
world): while the code is now usable in Python, it is not well adapted to
the features and idioms available in the language.

Milksnake is the package developed by Sentry that takes care of running cargo
for the Rust compilation and generating the CFFI boilerplate,
making it easy to load the low-level CFFI bindings in Python.
With this low-level binding available we can now write something more Pythonic
(the `pyx` file in Cython), and I ended up just renaming the `_minhash.pyx` file
back to `minhash.py` and doing one-line fixes to replace the Cython-style code
with the equivalent CFFI calls.

All of these changes should be transparent to the Python code, and to guarantee
that I made sure that all the current tests that we have (both for the Python
module and the command line interface) are still working after the changes.
It also led to finding some quirks in the implementation,
and even improvements in the current C++ code (because we were moving a lot of
data from C++ to Python).

## Where I see this going

It seems it worked as an experiment,
and I presented a [poster][90] at [GCCBOSC 2018][91] and [SciPy 2018][92] that
was met with excitement by many people.
Knowing that it is possible,
I want to reiterate some points why Rust is pretty exciting for bioinformatics
and science in general.

[90]: https://github.com/luizirber/2018-python-rust
[91]: https://gccbosc2018.sched.com/event/FEWp/b23-oxidizing-python-writing-extensions-in-rust
[92]: https://scipy2018.scipy.org/ehome/index.php?eventid=299527&tabid=712461&cid=2233543&sessionid=21618890&sessionchoice=1&

### Bioinformatics as libraries (and command line tools too!)

Bioinformatics is an umbrella term for many different methods, depending on
what analysis you want to do with your data (or model).
In this sense, it's distinct from other scientific areas where it is possible
to rely on a common set of libraries (numpy in linear algebra, for example), since a
library supporting many disjoint methods tend to grow too big and hard to
maintain.

The environment also tends to be very diverse, with different languages being
used to implement the software. Because it is hard to interoperate,
the methods tend to be implemented in command line programs that are stitched
together in pipelines, a workflow describing how to connect the input and output of many different tools to
generate results.
Because the basic unit is a command-line tool,
pipelines tend to rely on standard operating system abstractions like
files and pipes to make the tools communicate with each other. But since tools
might have input requirements distinct from what the previous tool provides,
many times it is necessary to do format conversion or other adaptations to make the
pipeline work.

Using tools as blackboxes, controllable through specific parameters at the
command-line level, make exploratory analysis and algorithm reuse harder:
if something needs to be investigated the user needs to resort to perturbations
of the parameters or the input data, without access to the more feature-rich and
meaningful abstraction happening inside the tool.

Even if many languages are used for writing the software, most of the time there
is some part written in C or C++ for performance reasons, and these tend to be
the core data structures of the computational method. Because it is not easy to
package your C/C++ code in a way that other people can readily use it,
most of this code is reinvented over and over again, or is copy and pasted into
codebases and start diverging over time. Rust helps solve this problem with the
integrated package management, and due to the FFI it can also be reused inside
other programs written in other languages.

sourmash is not going to be Rust-only and abandon Python,
and it would be crazy to do so when it has so many great exploratory tools
for scientific discovery. But now we can also use our method in other languages
and environment, instead of having our code stuck in one language.

### Don't rewrite it all!

I could have gone all the way and rewrite sourmash in Rust[ref]and risk
being kicked out of the lab =P[/ref], but it would be incredibly disruptive for
the current sourmash users and it would take way longer to pull off. Because
Rust is so focused in supporting existing code, you can do a slow transition and
reuse what you already have while moving into more and more Rust code.
A great example is this one-day effort by Rob Patro to bring [CQF][103] (a C
codebase) into Rust, using `bindgen` (a generator of C bindings for Rust).
Check [the Twitter thread][104] for more =]

[103]: https://github.com/COMBINE-lab/cqf-rust
[104]: https://twitter.com/nomad421/status/1025758568241422337

### Good scientific citizens

There is another MinHash implementation already written in Rust, [finch][100].
Early in my experiment I got an email from them asking if I wanted to work
together, but since I wanted to learn the language I kept doing my thing. (They
were totally cool with this, by the way). But the fun thing is that Rust has a
pair of traits called [`From` and `Into`][102] that you can implement for your
type, and so I [did that][101] and now we can have interoperable
implementations. This synergy allows `finch` to use `sourmash` methods,
and vice versa.

Maybe this sounds like a small thing, but I think it is really exciting. We can
stop having incompatible but very similar methods, and instead all benefit from
each other advances in a way that is supported by the language.

[100]: https://github.com/onecodex/finch-rs
[101]: https://github.com/luizirber/sourmash-rust/pull/1
[102]: https://doc.rust-lang.org/rust-by-example/conversion/from_into.html

## Next time!

Turns out Rust supports WebAssembly as a target,
so... what if we run sourmash in the browser?
That's what I'm covering in the [next blog post][104],
so stay tuned =]

[104]: {filename}/2018-08-27-sourmash-wasm.md

## Comments?

- [Thread on Mastodon][112]
- [Thread on reddit][110]
- [Thread on Twitter][111]

[110]: https://www.reddit.com/r/rust/comments/99vakd/blog_post_converting_c_to_rust_and_interoperate/
[111]: https://twitter.com/luizirber/status/1032779995129597952
[112]: https://social.lasanha.org/@luizirber/100602525575698239

[55]: https://github.com/frankmcsherry/timely-dataflow
[52]: https://github.com/dib-lab/sourmash
[56]: https://www.reddit.com/r/rust/comments/27jvdt/internet_archaeology_the_definitive_endall_source/

[0]: https://wiki.mozilla.org/Oxidation
[1]: https://blog.acolyer.org/2017/08/15/writing-parsers-like-it-is-2017/

[4]: https://github.com/PyO3/setuptools-rust/tree/master/example
[5]: https://github.com/PyO3/pyo3
[6]: http://softwaremaniacs.org/blog/2015/04/15/ijson-in-rust/en/
[7]: https://locka99.gitbooks.io/a-guide-to-porting-c-to-rust/content/memory_management/
[8]: https://thefullsnack.com/en/string-ffi-rust.html
[9]: https://github.com/neon-bindings/neon    (NodeJS bindings for rust)
[10]: https://zsiciarz.github.io/24daysofrust/

<!-- rust libs -->
[33]: https://github.com/alkis/ordslice-rs  (implement lower_bound)

<!-- why rust -->
[28]: https://blog.softwaremill.com/why-i-stepped-into-rust-ab093ff51cda
[40]: http://words.steveklabnik.com/rust-is-more-than-safety

<!-- WASM and demos -->
[11]: https://github.com/jdisanti/hassel_wasm_dbg
[12]: http://blog.scottlogic.com/2017/12/13/chip8-emulator-webassembly-rust.html
[13]: https://github.com/browserify/rustify
[14]: https://gist.github.com/kanaka/3c9caf38bc4da2ecec38f41ba24b77df   (Run webasm in node)
[15]: https://www.npmjs.com/package/rust-native-wasm-loader
[16]: https://github.com/rust-lang/rust/issues/44006   (wasm issue tracking in rust)
[42]: https://github.com/browserify/rustify/issues/5  (Map JS Types to Rust)
[43]: https://github.com/jamen/wasmify
[44]: https://github.com/rollup/rollup-plugin-wasm
[48]: https://github.com/nolanlawson/rollupify
[45]: https://stackoverflow.com/questions/47529643/how-to-return-a-string-or-similar-from-rust-in-webassembly
[47]: https://arkada38.github.io/2017/12/04/rust-wasm-string-to-uppercase/#rs
[49]: https://github.com/richardanaya/rust-roguelike/blob/master/index.html
[50]: https://github.com/alexcrichton/wasm-bindgen
[51]: https://tbfleming.github.io/cib/  (clang in browser)
[53]: https://hacks.mozilla.org/2018/01/oxidizing-source-maps-with-rust-and-webassembly/

<!-- python and FFI -->
[23]: https://blog.sentry.io/2017/11/14/evolving-our-rust-with-milksnake
[16]: https://stackoverflow.com/questions/32852863/buffer-protocol-using-cffi
[17]: https://bitbucket.org/cffi/cffi/issues/47/creating-a-cdata-from-a-buffer
[18]: https://github.com/jimfleming/rust-ffi-complex-types
[46]: https://medium.com/jim-fleming/complex-types-with-rust-s-ffi-315d14619479
[19]: https://stackoverflow.com/questions/24145823/how-do-i-convert-a-c-string-into-a-rust-string-and-back-via-ffi#24148033
[27]: http://jakegoulding.com/rust-ffi-omnibus/objects/
[36]: https://michael-f-bryan.github.io/rust-ffi-guide/overview.html
[37]: https://github.com/Michael-F-Bryan/ffi-helpers/blob/master/src/lib.rs  (inspiration for symbolic error management?)
[41]: https://bheisler.github.io/post/calling-rust-in-python/
[54]: https://github.com/rust-lang/rust/issues/36284#issuecomment-265456436

<!-- rust examples -->
[30]: https://people.gnome.org/~federico/blog/how-glib-rs-works-part-1.html
[39]: https://coaxion.net/blog/2017/12/a-gstreamer-plugin-like-the-rec-button-on-your-tape-recorder-a-multi-threaded-plugin-written-in-rust/

<!-- cbindgen -->
[20]: https://github.com/libpasta/libpasta/blob/master/libpasta-capi/build.rs
[24]: http://dreamingofbits.com/post/generating-c-bindings-for-rust-crates-with-cbindgen/
[26]: https://github.com/mozilla/mp4parse-rust/blob/master/mp4parse_capi/build.rs
[38]: https://searchfox.org/mozilla-central/rev/18c16ebf818abb86805ce08a6e537e4cd826f044/gfx/webrender_bindings/src/bindings.rs

<!-- rust for pythonistas -->
[21]: https://github.com/rochacbruno/py2rs#show-me-the-code

<!-- understanding rust -->
[29]: https://jvns.ca/blog/2017/11/27/rust-ref/
[35]: http://hermanradtke.com/2015/06/22/effectively-using-iterators-in-rust.html

<!-- rust and bio -->
[22]: https://github.com/onecodex/finch-rs
[31]: https://github.com/10XGenomics/rust-debruijn
[32]: https://github.com/onecodex/needletail
[34]: https://benchmarksgame.alioth.debian.org/u64q/program.php?test=revcomp&lang=rust&id=2

<!-- rust error handling -->
[25]: https://boats.gitlab.io/failure/intro.html

[60]: https://ashleygwilliams.github.io/rustfest-2017/#1
[61]: http://talks.edunham.net/lca2018/should-you-rewrite-in-rust/beamer.pdf
[62]: https://github.com/luizirber/2018-python-rust/blob/master/03.current_impl.md
[63]: https://github.com/luizirber/2018-python-rust/blob/master/04.rust_impl.md

<!-- other notes

- Implement Default trait for defaults (less verbose than ::new...)
  https://doc.rust-lang.org/std/default/trait.Default.html

-->
