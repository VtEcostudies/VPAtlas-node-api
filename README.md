# VPAtlas node-postgres API

NodeJS/ExpressJS + Postgres/PostGIS API serves routes which handle:

User Management
  - Registration
  - Authentication
  - Authorization (role-based user auth)
  - Administrattion (add/remove/update/reset)

Vernal Pool Web UX Data
  - Vernal Pool Mapping CRUD
  - Vernal Pool Visit CRUD
  - Vernal Pool Survey (Read/View only. Includes Admin S123 data-links)

Vernal Pool Survey 123 Data
  - VPVisit S123 Pull (Create/Update)
  - VPMon Survey S123 Pull (Create/Update)

VPAtlas-node-api dependencies (see below for install scripts):
- [nodeJs] (https://nodejs.org/en/download)
- [pm2] (https://pm2.io/docs/runtime/guide/installation/)

Install VPAtlas-node-api:
- git clone https://github.com/VtEcostudies/VPAtlas-node-api.git
- git checkout [master, v3_dev, ...]

Follow the install scripts:
- 01_install_npm_node.sh
- 02_install_vpatlas_npm.sh
- 03_create_config_json.sh
- 04_install_https_certs.sh
- 05_install_pm2.sh

To run in dev-local mode:
- node server.js

Run dev-remote:
- pm2_dev-remote_startup.sh

Run production:
- pm2_production_startup.sh

Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY-NC-SA%204.0-lightgrey.svg
