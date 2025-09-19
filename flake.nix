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
            cargoHash = "sha256-ABf90XgT0hrQ50JIdboA5EIaEibXb6TwjGkuNCVWLMY=";
            nativeBuildInputs = with pkgs; [
              pkg-config
            ];
            buildInputs = with pkgs; [
              openssl
              postgresql
            ];
            doCheck = false;
          };


          web = pkgs.buildNpmPackage rec {
            pname = "web";
            version = "0.1.0";
            buildInputs = with pkgs; [
              nodejs_20
              nodePackages_latest.pnpm
            ];
            npmDepsHash = "sha256-oTUiWRKdYiTvmiwkZeN6EXcXxN0Jp1CcaxlO5PZMF9M=";
            nativeBuildInputs = buildInputs;
            npmFlags = [ "--legacy-peer-deps" ];

            # inherit pname version buildInputs npmDepsHash nativeBuildInputs;
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



          # web = pkgs.mkYarnPackage rec {
          #   pname = "elytra-rides-web";
          #   version = "0.1.0";
          #   src = ./web;
          #
          #   packageJSON = ./web/package.json;
          #
          #
          #
          #
          #
          #   offlineCache = pkgs.fetchYarnDeps {
          #     yarnLock = "${src}/yarn.lock";
          #     hash = "sha256-522plD7sn4N3Z6ntLG05MGJZEQ45PPCNmdxQXM/DnZA=";
          #   };
          #
          #   buildPhase = ''
          #     yarn --offline build
          #   '';
          #
          #   installPhase = ''
          #     mkdir -p $out
          #     cp -r .next $out/
          #     cp -r public $out/ 2>/dev/null || true
          #     cp package.json $out/
          #     cp -r node_modules $out/
          #   '';
          #
          #   distPhase = true;
          #
          #
          #   # installPhase = ''
          #   #   mkdir -p $out
          #   #   cp -r deps/*/out $out/
          #   #   cp -r deps/*/.next $out/
          #   # '';
          #
          #   env = {
          #     BUILD_STANDALONE = "true";
          #     NODE_ENV = "production";
          #   };
          #
          # };
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
