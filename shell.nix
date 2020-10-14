let
  nixpkgs = import <nixpkgs> {};

  mach-nix = import (
    builtins.fetchGit {
      url = "https://github.com/DavHau/mach-nix/";
      ref = "2.0.0";
    }
  );

  customPython = mach-nix.mkPython {
    python = nixpkgs.python37;
    requirements = ''
      ghp-import==0.5.5
      jupyter==1.0.0
      livereload==2.5.2
      nbconvert==5.3.1
      pandocfilters==1.4.2
      pelican==4.2.0
      mistune==0.8.4
      Markdown==2.6.11
      tornado<6
      html5lib==1.0.1
    '';
  };

in
  with nixpkgs;

  nixpkgs.mkShell {
    buildInputs = [
      customPython
      nixpkgs.pandoc
   ];
}
