{

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";

    mach-nix = {
      url = "github:DavHau/mach-nix/3.5.0";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "utils";
      inputs.pypi-deps-db.follows = "pypi-deps-db";
    };

    pypi-deps-db = {
      url = "github:DavHau/mach-nix/3.5.0";
    };
  };

  outputs = { self, nixpkgs, mach-nix, pypi-deps-db, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        python = "python37";
        mach-nix-wrapper = import mach-nix { inherit pkgs python; };

        customPython = mach-nix-wrapper.mkPython {
          requirements = ''
            ipython==7.18.1
            jupyter-core==4.6.3
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

      with pkgs;
      {
        devShell = mkShell {
          buildInputs = [
            gnumake
            customPython
            pandoc
          ];
        };
      });
}
