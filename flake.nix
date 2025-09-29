{
  description = "Elytra Rides Backend";

  inputs = {
    nixpkgs.url      = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay.url = "github:oxalica/rust-overlay";
    flake-utils.url  = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
        
        rustToolchain = pkgs.rust-bin.stable."1.76.0".default;

        rustPlatform = pkgs.makeRustPlatform {
          cargo = rustToolchain;
          rustc = rustToolchain;
        };
      in
      {
        packages = {
          backend = rustPlatform.buildRustPackage {
            pname = "elytra-rides-backend";
            version = "0.1.0";
            src = ./backend;
            cargoHash = "sha256-Fd7ttVMn9SO5WLoGA9knGyA99C+YxidVEG7lCclqPG4=";
            nativeBuildInputs = with pkgs; [
              pkg-config
            ];
            buildInputs = with pkgs; [
              openssl
              postgresql
            ];
            postInstall = ''
              cp -r $src/migrations $out/migrations
            '';
            doCheck = false;
          };


          web = pkgs.buildNpmPackage rec {
            pname = "web";
            version = "0.1.0";
            buildInputs = with pkgs; [
              nodejs_20
              nodePackages_latest.pnpm
            ];
            npmDepsHash = "sha256-HVxTXJJ/w4OQpfAnBgcPiR8y6qrIS0o8Mx3Q8vepLgg=";
            nativeBuildInputs = buildInputs;
            npmFlags = [ "--legacy-peer-deps" ];

            src = ./web;
            postInstall = ''
              mkdir -p $out/bin
              exe="$out/bin/${pname}"
              lib="$out/lib/node_modules/${pname}"
              cp -r ./.next $lib
              touch $exe
              chmod +x $exe
              echo "
                  #!/usr/bin/env bash
                  cd $lib
                  ${pkgs.nodePackages_latest.pnpm}/bin/pnpm run start" > $exe
            '';
          };
        };

        devShells.default = with pkgs; mkShell {
          buildInputs = [
            openssl
            pkg-config
            rust-bin.stable."1.76.0".default
            diesel-cli

            postgresql
            process-compose

            nodejs
            yarn
          ];
        };
      }
    );
}
