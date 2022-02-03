# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.12.1](https://github.com/contentful/apps/compare/@contentful/gatsby-preview@1.12.0...@contentful/gatsby-preview@1.12.1) (2022-02-03)


### Bug Fixes

* **Gatsby:** Check the updated at time repeatedly to wait for a save to happen ([#728](https://github.com/contentful/apps/issues/728)) ([68ee680](https://github.com/contentful/apps/commit/68ee68074a01bae3cbd71f85b3c8d81f44500750))





# [1.12.0](https://github.com/contentful/apps/compare/@contentful/gatsby-preview@1.11.1...@contentful/gatsby-preview@1.12.0) (2022-01-31)


### Features

* Add Gatsby Cloud (Content Sync) eager redirects support ([#722](https://github.com/contentful/apps/issues/722)) ([641a0c9](https://github.com/contentful/apps/commit/641a0c94d13bd14c2e841e820f6441aab11e0da9))





## [1.11.1](https://github.com/contentful/apps/compare/@contentful/gatsby-preview@1.11.0...@contentful/gatsby-preview@1.11.1) (2022-01-22)

**Note:** Version bump only for package @contentful/gatsby-preview





# 1.11.0 (2022-01-14)


### Bug Fixes

* [] preview button incorrectly hidden ([#569](https://github.com/contentful/apps/issues/569)) ([a665d6a](https://github.com/contentful/apps/commit/a665d6a72e3c05d272e7543fd7b2999ddbdf4c65))
* add check for sys object on select maps ([#228](https://github.com/contentful/apps/issues/228)) ([d6b2a45](https://github.com/contentful/apps/commit/d6b2a45e6111419a0ac0e0fd03c0dff572a84535))
* bump gatsby version ([#227](https://github.com/contentful/apps/issues/227)) ([fa6ae37](https://github.com/contentful/apps/commit/fa6ae370881b443e1aa4e5c0ff0528788f88d8ff))
* fail config persistence if preview webhook url is not valid ([#570](https://github.com/contentful/apps/issues/570)) ([f6e7ec6](https://github.com/contentful/apps/commit/f6e7ec62cb1d0898771265d37d08b883582468a2))
* **gatsby:** display warning when there are no content types ([#72](https://github.com/contentful/apps/issues/72)) ([0c47e7f](https://github.com/contentful/apps/commit/0c47e7ffec716c10f0657783be8984d46fb427fe))
* move react to peer dependency & unpin dependencies ([#475](https://github.com/contentful/apps/issues/475)) ([981e177](https://github.com/contentful/apps/commit/981e177092fafdcce211822277d3ee0dad7ae689))
* remove previewWebhookUrl references and use webhookUrl instead ([#576](https://github.com/contentful/apps/issues/576)) ([9b84aed](https://github.com/contentful/apps/commit/9b84aed7ad104eba5bf8655e8706bd23db8d7c16))
* remove unused dependencies ([#523](https://github.com/contentful/apps/issues/523)) ([a1af1dd](https://github.com/contentful/apps/commit/a1af1dd07726c1119e0c16fcbdfb3bea4f88dae2))
* retrieve all content types from space ([#230](https://github.com/contentful/apps/issues/230)) ([ad4df15](https://github.com/contentful/apps/commit/ad4df15bbdc0e787b4afd7055916166613f0df24))
* revert back to original gatsby app ([#217](https://github.com/contentful/apps/issues/217)) ([364a62d](https://github.com/contentful/apps/commit/364a62d77ad69464ae3bd92711144271ad9e488d))


### Features

* [] Add Gatsby Cloud Content Sync support (Next-gen Preview) ([#543](https://github.com/contentful/apps/issues/543)) ([9ca8ad8](https://github.com/contentful/apps/commit/9ca8ad8e4196f5088cbb22aea600cb0c7ba25dcd)), closes [#6](https://github.com/contentful/apps/issues/6) [#11](https://github.com/contentful/apps/issues/11)
* [] build gatsby with react-scripts ([#293](https://github.com/contentful/apps/issues/293)) ([25882c9](https://github.com/contentful/apps/commit/25882c91c809f6a8d304de36c122614140586881))
* [] don't overwrite existing editor interface config when configuring gatsby ([#418](https://github.com/contentful/apps/issues/418)) ([f2e185d](https://github.com/contentful/apps/commit/f2e185d65c19e9260f448c65ceed83bc5b3ebe93))
* [EXT-2717] use app hosting for gatsby ([#361](https://github.com/contentful/apps/issues/361)) ([9f438f0](https://github.com/contentful/apps/commit/9f438f06db4a057767e80352e7f1b68e6cfd5512))
* [EXT-2722] use contentful hosting for image focal point app ([#238](https://github.com/contentful/apps/issues/238)) ([11b57ae](https://github.com/contentful/apps/commit/11b57ae3e4fb5dd376544d89056430b71883517c))
* [EXT-3415] move all package names to [@contentful](https://github.com/contentful) ([#665](https://github.com/contentful/apps/issues/665)) ([9bd7534](https://github.com/contentful/apps/commit/9bd75340860e59f25b4eed900a832a482508f603))
* define_entry_slugs ([e933688](https://github.com/contentful/apps/commit/e933688293fcb7f2a7277dac628b2374f6b21672))
* improve empty states of assignments [EXT-1960] ([#95](https://github.com/contentful/apps/issues/95)) ([642d5ee](https://github.com/contentful/apps/commit/642d5ee11664f87acb9797e39c07e1ceabb588c6))
* optionally define entry slugs ([#219](https://github.com/contentful/apps/issues/219)) ([3e1f5b8](https://github.com/contentful/apps/commit/3e1f5b8ac8b32b222bb9671d2589d0f221ce5038))
* update to the latest forma and new tokens ([#336](https://github.com/contentful/apps/issues/336)) ([d4cba00](https://github.com/contentful/apps/commit/d4cba009066b590b790b0d32bb1afbcf699d3bee))
* use App SDK v4 ([#528](https://github.com/contentful/apps/issues/528)) ([5fb634a](https://github.com/contentful/apps/commit/5fb634a0679de8af4ada0de3d571a8a5e5564090))


### Reverts

* Revert "start on slug fields" ([c69bfba](https://github.com/contentful/apps/commit/c69bfba254b5718ae63c3864480799104ddf8061))





## [1.10.11](https://github.com/contentful/apps/compare/gatsby-preview@1.10.10...gatsby-preview@1.10.11) (2022-01-14)

**Note:** Version bump only for package gatsby-preview





## [1.10.10](https://github.com/contentful/apps/compare/gatsby-preview@1.10.9...gatsby-preview@1.10.10) (2022-01-10)

**Note:** Version bump only for package gatsby-preview





## [1.10.9](https://github.com/contentful/apps/compare/gatsby-preview@1.10.8...gatsby-preview@1.10.9) (2021-11-18)

**Note:** Version bump only for package gatsby-preview





## [1.10.8](https://github.com/contentful/apps/compare/gatsby-preview@1.10.7...gatsby-preview@1.10.8) (2021-11-18)

**Note:** Version bump only for package gatsby-preview





## [1.10.7](https://github.com/contentful/apps/compare/gatsby-preview@1.10.6...gatsby-preview@1.10.7) (2021-11-18)

**Note:** Version bump only for package gatsby-preview





## [1.10.6](https://github.com/contentful/apps/compare/gatsby-preview@1.10.5...gatsby-preview@1.10.6) (2021-11-18)

**Note:** Version bump only for package gatsby-preview





## [1.10.5](https://github.com/contentful/apps/compare/gatsby-preview@1.10.4...gatsby-preview@1.10.5) (2021-11-18)

**Note:** Version bump only for package gatsby-preview





## [1.10.4](https://github.com/contentful/apps/compare/gatsby-preview@1.10.3...gatsby-preview@1.10.4) (2021-11-02)


### Bug Fixes

* remove previewWebhookUrl references and use webhookUrl instead ([#576](https://github.com/contentful/apps/issues/576)) ([9b84aed](https://github.com/contentful/apps/commit/9b84aed7ad104eba5bf8655e8706bd23db8d7c16))





## [1.10.3](https://github.com/contentful/apps/compare/gatsby-preview@1.10.2...gatsby-preview@1.10.3) (2021-11-02)


### Bug Fixes

* [] preview button incorrectly hidden ([#569](https://github.com/contentful/apps/issues/569)) ([a665d6a](https://github.com/contentful/apps/commit/a665d6a72e3c05d272e7543fd7b2999ddbdf4c65))





## [1.10.2](https://github.com/contentful/apps/compare/gatsby-preview@1.10.1...gatsby-preview@1.10.2) (2021-10-29)


### Bug Fixes

* fail config persistence if preview webhook url is not valid ([#570](https://github.com/contentful/apps/issues/570)) ([f6e7ec6](https://github.com/contentful/apps/commit/f6e7ec62cb1d0898771265d37d08b883582468a2))





## [1.10.1](https://github.com/contentful/apps/compare/gatsby-preview@1.10.0...gatsby-preview@1.10.1) (2021-10-28)

**Note:** Version bump only for package gatsby-preview





# [1.10.0](https://github.com/contentful/apps/compare/gatsby-preview@1.9.0...gatsby-preview@1.10.0) (2021-10-27)


### Features

* [] Add Gatsby Cloud Content Sync support (Next-gen Preview) ([#543](https://github.com/contentful/apps/issues/543)) ([9ca8ad8](https://github.com/contentful/apps/commit/9ca8ad8e4196f5088cbb22aea600cb0c7ba25dcd)), closes [#6](https://github.com/contentful/apps/issues/6) [#11](https://github.com/contentful/apps/issues/11)





# [1.9.0](https://github.com/contentful/apps/compare/gatsby-preview@1.8.3...gatsby-preview@1.9.0) (2021-10-13)


### Features

* use App SDK v4 ([#528](https://github.com/contentful/apps/issues/528)) ([5fb634a](https://github.com/contentful/apps/commit/5fb634a0679de8af4ada0de3d571a8a5e5564090))





## [1.8.3](https://github.com/contentful/apps/compare/gatsby-preview@1.8.2...gatsby-preview@1.8.3) (2021-10-07)


### Bug Fixes

* remove unused dependencies ([#523](https://github.com/contentful/apps/issues/523)) ([a1af1dd](https://github.com/contentful/apps/commit/a1af1dd07726c1119e0c16fcbdfb3bea4f88dae2))





## [1.8.2](https://github.com/contentful/apps/compare/gatsby-preview@1.8.1...gatsby-preview@1.8.2) (2021-09-16)


### Bug Fixes

* move react to peer dependency & unpin dependencies ([#475](https://github.com/contentful/apps/issues/475)) ([981e177](https://github.com/contentful/apps/commit/981e177092fafdcce211822277d3ee0dad7ae689))





## [1.8.1](https://github.com/contentful/apps/compare/gatsby-preview@1.8.0...gatsby-preview@1.8.1) (2021-09-10)

**Note:** Version bump only for package gatsby-preview





# [1.8.0](https://github.com/contentful/apps/compare/gatsby-preview@1.7.0...gatsby-preview@1.8.0) (2021-08-24)


### Features

* [] don't overwrite existing editor interface config when configuring gatsby ([#418](https://github.com/contentful/apps/issues/418)) ([f2e185d](https://github.com/contentful/apps/commit/f2e185d65c19e9260f448c65ceed83bc5b3ebe93))





# [1.7.0](https://github.com/contentful/apps/compare/gatsby-preview@1.6.1...gatsby-preview@1.7.0) (2021-08-16)


### Features

* update to the latest forma and new tokens ([#336](https://github.com/contentful/apps/issues/336)) ([d4cba00](https://github.com/contentful/apps/commit/d4cba009066b590b790b0d32bb1afbcf699d3bee))





## [1.6.1](https://github.com/contentful/apps/compare/gatsby-preview@1.6.0...gatsby-preview@1.6.1) (2021-08-10)

**Note:** Version bump only for package gatsby-preview





# [1.6.0](https://github.com/contentful/apps/compare/gatsby-preview@1.5.0...gatsby-preview@1.6.0) (2021-08-06)


### Features

* [EXT-2717] use app hosting for gatsby ([#361](https://github.com/contentful/apps/issues/361)) ([9f438f0](https://github.com/contentful/apps/commit/9f438f06db4a057767e80352e7f1b68e6cfd5512))





# [1.5.0](https://github.com/contentful/apps/compare/gatsby-preview@1.4.0...gatsby-preview@1.5.0) (2021-06-18)


### Features

* [] build gatsby with react-scripts ([#293](https://github.com/contentful/apps/issues/293)) ([25882c9](https://github.com/contentful/apps/commit/25882c91c809f6a8d304de36c122614140586881))





# [1.4.0](https://github.com/contentful/apps/compare/gatsby-preview@1.3.2...gatsby-preview@1.4.0) (2021-05-05)


### Features

* [EXT-2722] use contentful hosting for image focal point app ([#238](https://github.com/contentful/apps/issues/238)) ([11b57ae](https://github.com/contentful/apps/commit/11b57ae3e4fb5dd376544d89056430b71883517c))





## [1.3.2](https://github.com/contentful/apps/compare/gatsby-preview@1.3.1...gatsby-preview@1.3.2) (2021-04-26)


### Bug Fixes

* retrieve all content types from space ([#230](https://github.com/contentful/apps/issues/230)) ([ad4df15](https://github.com/contentful/apps/commit/ad4df15bbdc0e787b4afd7055916166613f0df24))





## [1.3.1](https://github.com/contentful/apps/compare/gatsby-preview@1.3.0...gatsby-preview@1.3.1) (2021-04-23)


### Bug Fixes

* add check for sys object on select maps ([#228](https://github.com/contentful/apps/issues/228)) ([d6b2a45](https://github.com/contentful/apps/commit/d6b2a45e6111419a0ac0e0fd03c0dff572a84535))





# [1.3.0](https://github.com/contentful/apps/compare/gatsby-preview@1.2.1...gatsby-preview@1.3.0) (2021-04-22)


### Bug Fixes

* bump gatsby version ([#227](https://github.com/contentful/apps/issues/227)) ([fa6ae37](https://github.com/contentful/apps/commit/fa6ae370881b443e1aa4e5c0ff0528788f88d8ff))


### Features

* optionally define entry slugs ([#219](https://github.com/contentful/apps/issues/219)) ([3e1f5b8](https://github.com/contentful/apps/commit/3e1f5b8ac8b32b222bb9671d2589d0f221ce5038))





## [1.1.2](https://github.com/contentful/apps/compare/gatsby-preview@1.1.1...gatsby-preview@1.1.2) (2021-02-16)

**Note:** Version bump only for package gatsby-preview





## [1.1.1](https://github.com/contentful/apps/compare/gatsby-preview@1.1.0...gatsby-preview@1.1.1) (2021-01-26)

**Note:** Version bump only for package gatsby-preview





# 1.1.0 (2021-01-14)


### Bug Fixes

* **gatsby:** display warning when there are no content types ([#72](https://github.com/contentful/apps/issues/72)) ([0c47e7f](https://github.com/contentful/apps/commit/0c47e7ffec716c10f0657783be8984d46fb427fe))


### Features

* improve empty states of assignments [EXT-1960] ([#95](https://github.com/contentful/apps/issues/95)) ([642d5ee](https://github.com/contentful/apps/commit/642d5ee11664f87acb9797e39c07e1ceabb588c6))
