#VPAtlas node-postgres API

NodeJS/ExpressJS + Postgres/PostGIS API serves routes which handle:

- User Management
  - Registration
  - Authentication
  - Authorization (role-based user auth)
  - Administrattion (add/remove/update/reset)

- Vernal Pool Web UX Data
  - Vernal Pool Mapping CRUD
  - Vernal Pool Visit CRUD
  - Vernal Pool Survey (Read/View only. Includes Admin S123 data-links)

- Vernal Pool Survey 123 Data
  - VPVisit S123 Pull (Create/Update)
  - VPMon Survey S123 Pull (Create/Update)

Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY-NC-SA%204.0-lightgrey.svg
