Title: Oxidizing sourmash: PR walkthrough
Date: 2020-01-10 12:00
Author: luizirber
Category: science
Tags: bioinformatics, rust
Slug: sourmash-pr

sourmash 3 was released last week,
finally landing the Rust backend.
But, what changes when developing new features in sourmash?
I was thinking about how to best document this process,
and since [PR #826] is a short example touching all the layers I decided to do a
small walkthrough.

[PR #826]: https://github.com/dib-lab/sourmash/pull/826/files

Shall we?

## The problem

The first step is describing the problem,
and trying to convince reviewers (and yourself) that the changes bring enough benefits to justify a merge.
This is the description I put in the PR:

> Calling `.add_hash()` on a MinHash sketch is fine,
> but if you're calling it all the time it's better to pass a list of hashes and call `.add_many()` instead.
> Before this PR `add_many` just called `add_hash` for each hash it was passed,
> but now it will pass the full list to Rust (and that's way faster).
>
> No changes for public APIs,
> and I changed the `_signatures` method in LCA to accumulate hashes for each sig first,
> and then set them all at once.
> This is way faster,
> but might use more intermediate memory (I'll evaluate this now).

There are many details that sound like jargon for someone not familiar with the codebase,
but if I write something too long I'll probably be wasting the reviewers time too.
The benefit of a very detailed description is extending the knowledge for other people
(not necessarily the maintainers),
but that also takes effort that might be better allocated to solve other problems.
Or, more realistically, putting out other fires =P

Nonetheless,
some points I like to add in PR descriptions:
- why is there a problem with the current approach?
- is this the minimal viable change, or is it trying to change too many things
  at once? The former is way better, in general.
- what are the trade-offs? This PR is using more memory to lower the runtime,
  but I hadn't measure it yet when I opened it.
- Not changing public APIs is always good to convince reviewers.
  If the project follows a [semantic versioning] scheme,
  changes to the public APIs are major version bumps,
  and that can brings other consequences for users.

[semantic versioning]: https://semver.org/

## Setting up for changing code

If this was a bug fix PR,
the first thing I would do is write a new test triggering the bug,
and then proceed to fix it in the code
(Hmm, maybe that would be another good walkthrough?).
But this PR is making performance claims ("it's going to be faster"),
and that's a bit hard to codify in tests.
[ref]We do have https://asv.readthedocs.io/ set up for micro-benchmarks,
and now that I think about it...
I could have started by writing a benchmark for `add_many`,
and then showing that it is faster.
I will add this approach to the sourmash PR checklist =][/ref]
Since it's also proposing to change a method (`_signatures` in LCA indices) that is better to benchmark with a real index (and not a toy example),
I used the same data and command I run in [sourmash_resources] to check how memory consumption and runtime changed.
For reference, this is the command: 
```bash
sourmash search -o out.csv --scaled 2000 -k 51 HSMA33OT.fastq.gz.sig genbank-k51.lca.json.gz
```

[sourmash_resources]: https://github.com/luizirber/sourmash_resources

I'm using the `benchmark` feature from [snakemake] in [sourmash_resources][0] to
track how much memory, runtime and I/O is used for each command (and version) of sourmash,
and generate the plots in the README in that repo.
That is fine for a high-level view ("what's the maximum memory used?"),
but not so useful for digging into details ("what method is consuming most memory?").

Another additional problem is the dual[ref]or triple, if you count C[/ref] language nature of sourmash,
where we have Python calling into Rust code (via CFFI).
There are great tools for measuring and profiling Python code,
but they tend to not work with extension code...

So, let's bring two of my favorite tools to help!

[snakemake]: https://snakemake.readthedocs.io/
[0]: https://github.com/luizirber/sourmash_resources/blob/83ea237397d242e48c9d95eb0d9f50ceb4ad95c7/Snakefile#L99L114

### Memory profiling: heaptrack

[heaptrack] is a heap profiler, and I first heard about it from [Vincent Prouillet].
It's main advantage over other solutions (like valgrind's massif) is the low
overhead and... how easy it is to use:
just stick `heaptrack` in front of your command,
and you're good to go!

[Vincent Prouillet]: https://www.vincentprouillet.com/
[heaptrack]: https://github.com/KDE/heaptrack

Example output:
```shell
$ heaptrack sourmash search -o out.csv --scaled 2000 -k 51 HSMA33OT.fastq.gz.sig genbank-k51.lca.json.gz

heaptrack stats:
        allocations:            1379353
        leaked allocations:     1660
        temporary allocations:  168984
Heaptrack finished! Now run the following to investigate the data:

  heaptrack --analyze heaptrack.sourmash.66565.gz
```

`heaptrack --analyze` is a very nice graphical interface for analyzing the results,
but for this PR I'm mostly focusing on the Summary page (and overall memory consumption).
Tracking allocations in Python doesn't give many details,
because it shows the CPython functions being called,
but the ability to track into the extension code (Rust) allocations is amazing
for finding bottlenecks (and memory leaks =P).
[ref]It would be super cool to have the unwinding code from py-spy in heaptrack,
and be able to see exactly what Python methods/lines of code were calling the
Rust parts...[/ref]

### CPU profiling: py-spy

Just as other solutions exist for profiling memory,
there are many for profiling CPU usage in Python,
including `profile` and `cProfile` in the standard library.
Again, the issue is being able to analyze extension code,
and bringing the cannon (the `perf` command in Linux, for example) looses the
benefit of tracking Python code properly (because we get back the CPython
functions, not what you defined in your Python code).

Enters [py-spy] by [Ben Frederickson],
based on the [rbspy] project by [Julia Evans].
Both use a great idea:
read the process maps for the interpreters and resolve the full stack trace information,
with low overhead (because it uses sampling).
[py-spy] also goes further and resolves [native Python extensions] stack traces,
meaning we can get the complete picture all the way from the Python CLI to the
Rust core library![ref]Even if py-spy doesn't talk explicitly about Rust,
it works very very well, woohoo![/ref]

`py-spy` is also easy to use:
stick `py-spy record --output search.svg -n --` in front of the command, 
and it will generate a flamegraph in `search.svg`.
The full command for this PR is
```bash
py-spy record --output search.svg -n -- sourmash search -o out.csv --scaled 2000 -k 51 HSMA.fastq.sig genbank-k51.lca.json.gz
```

[py-spy]: https://github.com/benfred/py-spy
[Ben Frederickson]: https://www.benfrederickson.com
[rbspy]: https://github.com/rbspy/rbspy
[Julia Evans]: https://jvns.ca
[native]: https://www.benfrederickson.com/profiling-native-python-extensions-with-py-spy/

## Show me the code!

OK, OK, sheesh. But it's worth repeating: the code is important, but there are
many other aspects that are just as important =]

### Replacing `add_hash` calls with one `add_many`

Let's start at the [`_signatures()`][1] method on LCA indices.
This is the original method:
```python
@cached_property
def _signatures(self):
    "Create a _signatures member dictionary that contains {idx: minhash}."
    from .. import MinHash

    minhash = MinHash(n=0, ksize=self.ksize, scaled=self.scaled)

    debug('creating signatures for LCA DB...')
    sigd = defaultdict(minhash.copy_and_clear)

    for (k, v) in self.hashval_to_idx.items():
        for vv in v:
            sigd[vv].add_hash(k)

    debug('=> {} signatures!', len(sigd))
    return sigd
```

[1]: https://github.com/dib-lab/sourmash/pull/826/files#diff-adf06d14c535d5b22da9fb3862e4a487

`sigd[vv].add_hash(k)` is the culprit.
Each call to `.add_hash` has to go thru CFFI to reach the extension code,
and the overhead is significant.
It's similar situation to accessing array elements in NumPy:
it works,
but it is way slower than using operations that avoid crossing from Python to
the extension code.
What we want to do instead is call `.add_many(hashes)`,
which takes a list of hashes and process it entirely in Rust
(ideally. We will get there).

But, to have a list of hashes, there is another issue with this code.
```python
for (k, v) in self.hashval_to_idx.items():
    for vv in v:
        sigd[vv].add_hash(k)
```
There are two nested for loops,
and `add_hash` is being called with values from the inner loop.
So... we don't have the list of hashes beforehand.

But we can change the code a bit to save the hashes for each signature
in a temporary list,
and then call `add_many` on the temporary list.
Like this:
```python
temp_vals = defaultdict(list)

for (k, v) in self.hashval_to_idx.items():
    for vv in v:
        temp_vals[vv].append(k)

for sig, vals in temp_vals.items():
    sigd[sig].add_many(vals)
```
There is a trade-off here:
if we save the hashes in temporary lists,
will the memory consumption be so high that the runtime gains of calling
`add_many` in these temporary lists be cancelled?

Time to measure it =]

| version | mem | time |
| :-- | :-- | :-- |
|original|1.5 GB|160s|
|`list`|1.7GB|173s|

Wait, it got worse?!?! Building temporary lists only takes time and memory,
and bring no benefits!

This mystery goes away when you look at the [add_many method]:
```python
def add_many(self, hashes):
    "Add many hashes in at once."
    if isinstance(hashes, MinHash):
        self._methodcall(lib.kmerminhash_add_from, hashes._objptr)
    else:
        for hash in hashes:
            self._methodcall(lib.kmerminhash_add_hash, hash)
```
The first check in the `if` statement is a shortcut for adding hashes from
another `MinHash`, so let's focus on `else` part...
And turns out that `add_many` is lying!
It doesn't process the `hashes` in the Rust extension,
but just loops and call `add_hash` for each `hash` in the list.
That's not going to be any faster than what we were doing in `_signatures`.

[add_many method]: https://github.com/dib-lab/sourmash/pull/826/files#diff-2f53b2a5be4083c39a0275847c87f88fR190

Time to fix `add_many`!

### Oxidizing `add_many`

The idea is to change this loop in `add_many`:
```python
for hash in hashes:
    self._methodcall(lib.kmerminhash_add_hash, hash)
```
with a call to a Rust extension function:
```python
self._methodcall(lib.kmerminhash_add_many, list(hashes), len(hashes))
```

`self._methodcall` is a convenience method defined in [`RustObject`]
which translates a method-like call into a function call,
since our C layer only has functions.
This is the C prototype for this function:
```c
void kmerminhash_add_many(
    KmerMinHash *ptr,
    const uint64_t *hashes_ptr,
    uintptr_t insize
  );
```
You can almost read it as a Python method declaration,
where `KmerMinHash *ptr` means the same as the `self` in Python methods.
The other two arguments are a common idiom when passing pointers to data in C,
with `insize` being how many elements we have in the list.
[ref]Let's not talk about lack of array bounds checks in C...[/ref].
`CFFI` is very good at converting Python lists into pointers of a specific type,
as long as the type is of a primitive type
(`uint64_t` in our case, since each hash is a 64-bit unsigned integer number).

[`RustObject`]: https://github.com/dib-lab/sourmash/blob/c6cbdf0398ef836797492e13371a38373c544ae1/sourmash/utils.py#L24

And the Rust code with the implementation of the function:
```rust
ffi_fn! {
unsafe fn kmerminhash_add_many(
    ptr: *mut KmerMinHash,
    hashes_ptr: *const u64,
    insize: usize,
  ) -> Result<()> {
    let mh = {
        assert!(!ptr.is_null());
        &mut *ptr
    };

    let hashes = {
        assert!(!hashes_ptr.is_null());
        slice::from_raw_parts(hashes_ptr as *mut u64, insize)
    };

    for hash in hashes {
      mh.add_hash(*hash);
    }

    Ok(())
}
}
```
Let's break what's happening here into smaller pieces.
Starting with the function signature:
```rust
ffi_fn! {
unsafe fn kmerminhash_add_many(
    ptr: *mut KmerMinHash,
    hashes_ptr: *const u64,
    insize: usize,
  ) -> Result<()>
```
The weird `ffi_fn! {}` syntax around the function is a macro in Rust:
it changes the final generated code to convert the return value (`Result<()>`) into something that is valid C code (in this case, `void`).
What happens if there is an error, then?
The Rust extension has code for passing back an error code and message to Python,
as well as capturing panics (when things go horrible bad and the program can't recover)
in a way that Python can then deal with (raising exceptions and cleaning up).
It also sets the `#[no_mangle]` attribute in the function,
meaning that the final name of the function will follow C semantics (instead of Rust semantics),
and can be called more easily from C and other languages.
This `ffi_fn!` macro comes from [symbolic],
a big influence on the design of the Python/Rust bridge in sourmash.

[symbolic]: https://github.com/getsentry/symbolic

`unsafe` is the keyword in Rust to disable some checks in the code to allow
potentially dangerous things (like dereferencing a pointer),
and it is required to interact with C code.
`unsafe` doesn't mean that the code is always unsafe to use:
it's up to whoever is calling this to verify that valid data is being passed and invariants are being preserved.

If we remove the `ffi_fn!` macro and the `unsafe` keyword,
we have
```rust
fn kmerminhash_add_many(
    ptr: *mut KmerMinHash,
    hashes_ptr: *const u64,
    insize: usize
  );
```
At this point we can pretty much map between Rust and the C function prototype:
```c
void kmerminhash_add_many(
    KmerMinHash *ptr,
    const uint64_t *hashes_ptr,
    uintptr_t insize
  );
```
Some interesting points:
- We use `fn` to declare a function in Rust.
- The type of an argument comes after the name of the argument in Rust,
  while it's the other way around in C.
  Same for the return type (it is omitted in the Rust function, which means it
  is `-> ()`, equivalent to a `void` return type in C).
- In Rust everything is **immutable** by default, so we need to say that we want
  a mutable pointer to a `KmerMinHash` item: `*mut KmerMinHash`).
  In C everything is mutable by default.
- `u64` in Rust -> `uint64_t` in C
- `usize` in Rust -> `uintptr_t` in C

Let's check the implementation of the function now.
We start by converting the `ptr` argument (a raw pointer to a `KmerMinHash` struct)
into a regular Rust struct:
```rust
let mh = {
    assert!(!ptr.is_null());
    &mut *ptr
};
```
This block is asserting that `ptr` is not a null pointer,
and if so it dereferences it and store in a mutable reference.
If it was a null pointer the `assert!` would panic (which might sound extreme,
but is way better than continue running because dereferencing a null pointer is
BAD).
Note that functions always need all the types in arguments and return values,
but for variables in the body of the function
Rust can figure out types most of the time,
so no need to specify them.

The next block prepares our list of hashes for use:
```rust
let hashes = {
    assert!(!hashes_ptr.is_null());
    slice::from_raw_parts(hashes_ptr as *mut u64, insize)
};
```
We are again asserting that the `hashes_ptr` is not a null pointer,
but instead of dereferencing the pointer like before we use it to create a `slice`,
a dynamically-sized view into a contiguous sequence.
The list we got from Python is a contiguous sequence of size `insize`,
and the `slice::from_raw_parts` function creates a slice from a pointer to data and a size.

Oh, and can you spot the bug?
I created the slice using `*mut u64`,
but the data is declared as `*const u64`.
Because we are in an `unsafe` block Rust let me change the mutability,
but I shouldn't be doing that,
since we don't need to mutate the slice.
Oops.

Finally, let's add hashes to our MinHash!
We need a `for` loop, and call `add_hash` for each `hash`:
```rust
for hash in hashes {
  mh.add_hash(*hash);
}

Ok(())
```
We finish the function with `Ok(())` to indicate no errors occurred.

Why is calling `add_hash` here faster than what we were doing before in Python?
Rust can optimize these calls and generate very efficient native code,
while Python is an interpreted language and most of the time don't have the same
guarantees that Rust can leverage to generate the code.
And, again,
calling `add_hash` here doesn't need to cross FFI boundaries or,
in fact,
do any dynamic evaluation during runtime,
because it is all statically analyzed during compilation.

## Putting it all together

And... that's the PR code.
There are some other unrelated changes that should have been in new PRs,
but since they were so small it would be more work than necessary.
OK, that's a lame excuse:
it's confusing for reviewers to see these changes here,
so avoid doing that if possible!

But, did it work?

| version | mem | time |
| :-- | :-- | :-- |
|original|1.5 GB|160s|
|`list`|1.7GB|73s|

We are using 200 MB of extra memory,
but taking less than half the time it was taking before.
I think this is a good trade-off,
and so did the [reviewer] and the PR was approved.

[reviewer]: https://github.com/dib-lab/sourmash/pull/826#pullrequestreview-339020803

Hopefully this was useful, 'til next time!

## Comments?

- [Thread on Mastodon][100]
- [Thread on Twitter][101]

[100]: https://social.lasanha.org/@luizirber/103461534713587975
[101]: https://twitter.com/luizirber/status/1215772245928235008

## Bonus: `list` or `set`?

The first version of the PR used a `set` instead of a `list` to accumulate hashes.
Since a `set` doesn't have repeated elements,
this could potentially use less memory.
The code:
```python
temp_vals = defaultdict(set)

for (k, v) in self.hashval_to_idx.items():
    for vv in v:
        temp_vals[vv].add(k)

for sig, vals in temp_vals.items():
    sigd[sig].add_many(vals)
```
The runtime was again half of the original,
but...
| version | mem | time |
| :-- | :-- | :-- |
|original|1.5 GB|160s|
|`set`|3.8GB|80s|
|`list`|1.7GB|73s|
... memory consumption was almost 2.5 times the original! WAT

The culprit this time? The new `kmerminhash_add_many` call in the `add_many`
method.
This one:
```python
self._methodcall(lib.kmerminhash_add_many, list(hashes), len(hashes))
```
`CFFI` doesn't know how to convert a `set` into something that C understands,
so we need to call `list(hashes)` to convert it into a list.
Since Python (and `CFFI`) can't know if the data is going to be used later
[ref]something that the memory ownership model in Rust does, BTW[/ref]
it needs to keep it around
(and be eventually deallocated by the garbage collector).
And that's how we get at least double the memory being allocated...

There is another lesson here.
If we look at the `for` loop again:
```python
for (k, v) in self.hashval_to_idx.items():
    for vv in v:
        temp_vals[vv].add(k)
```
each `k` is already unique because they are keys in the `hashval_to_idx` dictionary,
so the initial assumption
(that a `set` might save memory because it doesn't have repeated elements)
is... irrelevant for the problem =]
