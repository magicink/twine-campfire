# Changelog

## [1.100.1](https://github.com/magicink/twine-campfire/compare/v1.100.0...v1.100.1) (2025-09-03)


### Bug Fixes

* process sibling input event directives ([#634](https://github.com/magicink/twine-campfire/issues/634)) ([1664dd9](https://github.com/magicink/twine-campfire/commit/1664dd90f162d5dde754c23bf47e9cde7f61de57))

## [1.100.0](https://github.com/magicink/twine-campfire/compare/v1.99.0...v1.100.0) (2025-09-03)


### Features

* **directives:** support id attributes for visual components ([#614](https://github.com/magicink/twine-campfire/issues/614)) ([5773d4c](https://github.com/magicink/twine-campfire/commit/5773d4c479a164bd4bb96db97581f65a02a2cd9b))
* interpolate className and style attributes ([#618](https://github.com/magicink/twine-campfire/issues/618)) ([4fc0cb3](https://github.com/magicink/twine-campfire/commit/4fc0cb3dffe7e924a5faa86cb3f4064516dcc4ed))
* restrict state directives to leaf form ([#622](https://github.com/magicink/twine-campfire/issues/622)) ([aed37a0](https://github.com/magicink/twine-campfire/commit/aed37a045db08da86c34037fc5b013eb213e0596))
* **store:** list saved games ([#628](https://github.com/magicink/twine-campfire/issues/628)) ([454830b](https://github.com/magicink/twine-campfire/commit/454830bb30e91338807526eaa12bc954fbda0c3e))
* support leaf image directive ([#621](https://github.com/magicink/twine-campfire/issues/621)) ([e532f2f](https://github.com/magicink/twine-campfire/commit/e532f2fed82060e29e358c2672dd1792e6bb02bb))
* support state-driven disabled directives ([#617](https://github.com/magicink/twine-campfire/issues/617)) ([96652c2](https://github.com/magicink/twine-campfire/commit/96652c24845ce2d68372845272ba8b5657578bc7))


### Bug Fixes

* avoid paragraph wrapper around image directive ([#619](https://github.com/magicink/twine-campfire/issues/619)) ([a30e5d2](https://github.com/magicink/twine-campfire/commit/a30e5d234a9261fe4f71bcc146058839e674bf55))
* restrict asset directives to leaf usage ([#625](https://github.com/magicink/twine-campfire/issues/625)) ([f03e205](https://github.com/magicink/twine-campfire/commit/f03e20569d6405ea83d91d2e3b33a7befb562bdb))
* **utils:** preserve hyphenated strings during attr parsing ([#620](https://github.com/magicink/twine-campfire/issues/620)) ([4a02bf1](https://github.com/magicink/twine-campfire/commit/4a02bf14c41cf7d7a273bebf217c53b3034b3f73))
* **wrapper:** allow image directives inside trigger wrapper ([#612](https://github.com/magicink/twine-campfire/issues/612)) ([0e1b665](https://github.com/magicink/twine-campfire/commit/0e1b6650b9ecda7d67976e09ab8752e8663dcbc5))

## [1.99.0](https://github.com/magicink/twine-campfire/compare/v1.98.0...v1.99.0) (2025-09-02)


### Features

* enhance trigger directive to support wrapper as button label with precedence ([#604](https://github.com/magicink/twine-campfire/issues/604)) ([19bcdb7](https://github.com/magicink/twine-campfire/commit/19bcdb72f79cdf90d09cb0381a3fd9612ef1036e))


### Bug Fixes

* prevent nested batch directives from executing ([#607](https://github.com/magicink/twine-campfire/issues/607)) ([d7fedf3](https://github.com/magicink/twine-campfire/commit/d7fedf395700c082fc042225e4d3bc8a0eaa69df))

## [1.98.0](https://github.com/magicink/twine-campfire/compare/v1.97.0...v1.98.0) (2025-08-31)


### Features

* replace onHover with onMouseEnter and onMouseLeave for interact… ([75fdf1e](https://github.com/magicink/twine-campfire/commit/75fdf1e625974afd1a8d2feeff76553c4c071dbe))
* replace onHover with onMouseEnter and onMouseLeave for interactive elements ([#597](https://github.com/magicink/twine-campfire/issues/597)) ([df0f583](https://github.com/magicink/twine-campfire/commit/df0f583efd7e87475021586a3b035d8d6a45972f))

## [1.97.0](https://github.com/magicink/twine-campfire/compare/v1.96.0...v1.97.0) (2025-08-31)


### Features

* **utils:** introduce generic AssetManager ([ada96bf](https://github.com/magicink/twine-campfire/commit/ada96bfc6468b5a2a70f2519316d7bfcfdc124cc))

## [1.96.0](https://github.com/magicink/twine-campfire/compare/v1.95.0...v1.96.0) (2025-08-30)


### Features

* introduce useDirectiveEvents hook ([#586](https://github.com/magicink/twine-campfire/issues/586)) ([37e766e](https://github.com/magicink/twine-campfire/commit/37e766e0f323a4ee1ace0eb7b12d88fe557cf1a2))

## [1.95.0](https://github.com/magicink/twine-campfire/compare/v1.94.0...v1.95.0) (2025-08-30)


### Features

* add wrapper directive ([#582](https://github.com/magicink/twine-campfire/issues/582)) ([e75f286](https://github.com/magicink/twine-campfire/commit/e75f28693d10c49c24eadec6c48cae223e75fafd))
* add wrapper directive ([#582](https://github.com/magicink/twine-campfire/issues/582)) ([54fd5fe](https://github.com/magicink/twine-campfire/commit/54fd5febd2914aec3c6fded5ad319d532357d6d8))

## [1.94.0](https://github.com/magicink/twine-campfire/compare/v1.93.1...v1.94.0) (2025-08-29)


### Features

* **radio:** add radio input button styles ([#577](https://github.com/magicink/twine-campfire/issues/577)) ([13bfb52](https://github.com/magicink/twine-campfire/commit/13bfb52f52a76f31c8edd6dcc955263aff262a83))
* style checkboxes as buttons ([#576](https://github.com/magicink/twine-campfire/issues/576)) ([f47f6dc](https://github.com/magicink/twine-campfire/commit/f47f6dc5d46e62ed57306af4c6d63d1456144888))

## [1.93.1](https://github.com/magicink/twine-campfire/compare/v1.93.0...v1.93.1) (2025-08-29)


### Bug Fixes

* define theme colors ([#573](https://github.com/magicink/twine-campfire/issues/573)) ([24a29b7](https://github.com/magicink/twine-campfire/commit/24a29b71dde187f2f6cc8384759146cf42145e16))

## [1.93.0](https://github.com/magicink/twine-campfire/compare/v1.92.0...v1.93.0) (2025-08-29)


### Features

* style gfm tables ([#568](https://github.com/magicink/twine-campfire/issues/568)) ([48e902b](https://github.com/magicink/twine-campfire/commit/48e902b5f1af32151330662d5a9a440f0672c0cd))
* style gfm tables ([#568](https://github.com/magicink/twine-campfire/issues/568)) ([6cfe1fc](https://github.com/magicink/twine-campfire/commit/6cfe1fc8a18a4456badbb3f095f48c368533acf3))

## [1.92.0](https://github.com/magicink/twine-campfire/compare/v1.91.0...v1.92.0) (2025-08-28)


### Features

* add input base styles ([#564](https://github.com/magicink/twine-campfire/issues/564)) ([80f3827](https://github.com/magicink/twine-campfire/commit/80f3827a0d51d3b6558e817fc3a60f3b550d6987))
* replace native select with popover menu ([#565](https://github.com/magicink/twine-campfire/issues/565)) ([e6a7045](https://github.com/magicink/twine-campfire/commit/e6a70452873108f0433dfc18843634f1122320c9))
* restyle buttons ([#563](https://github.com/magicink/twine-campfire/issues/563)) ([a4c3232](https://github.com/magicink/twine-campfire/commit/a4c3232bf936d5aafcd5edc17a17a215a98b6a6f))

## [1.91.0](https://github.com/magicink/twine-campfire/compare/v1.90.0...v1.91.0) (2025-08-28)


### Features

* add overlay passage support ([#560](https://github.com/magicink/twine-campfire/issues/560)) ([ab308af](https://github.com/magicink/twine-campfire/commit/ab308afa30865749046a0ef5892bc7ca4c6e54f5))

## [1.90.0](https://github.com/magicink/twine-campfire/compare/v1.89.0...v1.90.0) (2025-08-27)


### Features

* add shared base URL helper ([#548](https://github.com/magicink/twine-campfire/issues/548)) ([0c63f7e](https://github.com/magicink/twine-campfire/commit/0c63f7ef586606eefbc38f67cd090c0ba4224b0f))


### Bug Fixes

* apply Libertinus font to select elements ([#550](https://github.com/magicink/twine-campfire/issues/550)) ([0f3c1a7](https://github.com/magicink/twine-campfire/commit/0f3c1a7ec4b66bdcb829744b893e321980dcec14))

## [1.89.0](https://github.com/magicink/twine-campfire/compare/v1.88.0...v1.89.0) (2025-08-27)


### Features

* support className and style on show and t directives ([#542](https://github.com/magicink/twine-campfire/issues/542)) ([3b3412d](https://github.com/magicink/twine-campfire/commit/3b3412d1c291d731cdf65f3b150bc8268efc219c))


### Bug Fixes

* unwrap if and show directives from paragraphs ([#543](https://github.com/magicink/twine-campfire/issues/543)) ([4b2a1b6](https://github.com/magicink/twine-campfire/commit/4b2a1b6e70f19f4010162b6012356b119d16a2c1))

## [1.88.0](https://github.com/magicink/twine-campfire/compare/v1.87.0...v1.88.0) (2025-08-26)


### Features

* add input directive ([#537](https://github.com/magicink/twine-campfire/issues/537)) ([7c37716](https://github.com/magicink/twine-campfire/commit/7c3771634eac6314e4d77b7bf17ee2409602ebc8))
* add select and option directives ([#538](https://github.com/magicink/twine-campfire/issues/538)) ([3c42b02](https://github.com/magicink/twine-campfire/commit/3c42b0234687048706d37d93a766964cfc204e20))
* add textarea directive and component ([#539](https://github.com/magicink/twine-campfire/issues/539)) ([af5e1b8](https://github.com/magicink/twine-campfire/commit/af5e1b89fa0e497e4eef08c40fb8d195b27fa8f0))


### Bug Fixes

* default to dark theme ([#536](https://github.com/magicink/twine-campfire/issues/536)) ([d7ab25a](https://github.com/magicink/twine-campfire/commit/d7ab25af2a29b5280d6ce50569c11e456da5b3a4))

## [1.87.0](https://github.com/magicink/twine-campfire/compare/v1.86.0...v1.87.0) (2025-08-26)


### Features

* add image preloading and loading screen ([#533](https://github.com/magicink/twine-campfire/issues/533)) ([aa9870a](https://github.com/magicink/twine-campfire/commit/aa9870a878efb8fb265bb23e87c83aec38eed39f))
* add image preloading and loading screen ([#533](https://github.com/magicink/twine-campfire/issues/533)) ([b11f219](https://github.com/magicink/twine-campfire/commit/b11f21997e026ad21f60a16dd0feefe18f201a0c))

## [1.86.0](https://github.com/magicink/twine-campfire/compare/v1.85.0...v1.86.0) (2025-08-26)


### Features

* add audio directives and manager ([#530](https://github.com/magicink/twine-campfire/issues/530)) ([5700c45](https://github.com/magicink/twine-campfire/commit/5700c45e4f8f499e9b87de4669d0be494793c05f))
* add audio directives and manager ([#530](https://github.com/magicink/twine-campfire/issues/530)) ([426b69a](https://github.com/magicink/twine-campfire/commit/426b69a222a3bb221c6d17cb31812d0286e6a418))

## [1.85.0](https://github.com/magicink/twine-campfire/compare/v1.84.2...v1.85.0) (2025-08-25)


### Features

* add namespace attribute to t directive ([#525](https://github.com/magicink/twine-campfire/issues/525)) ([84b5f35](https://github.com/magicink/twine-campfire/commit/84b5f350edf30dcd346fcab86e4f8a47e444e8b2))
* **directives:** expose className on layer directive ([#519](https://github.com/magicink/twine-campfire/issues/519)) ([92bd269](https://github.com/magicink/twine-campfire/commit/92bd269c5c2ede5ead09a424825e3ad4acea5a86))
* **shape:** expose shape directive class attributes ([#523](https://github.com/magicink/twine-campfire/issues/523)) ([3ba03ff](https://github.com/magicink/twine-campfire/commit/3ba03ff62c170d5e9b54b0a5c8d3b7830592ea55))
* **text:** expose style attribute on directive ([#526](https://github.com/magicink/twine-campfire/issues/526)) ([560a970](https://github.com/magicink/twine-campfire/commit/560a970bbd5463a719c9b2d435b6dc30523be69c))


### Bug Fixes

* expose image class attributes ([#524](https://github.com/magicink/twine-campfire/issues/524)) ([d9d6a01](https://github.com/magicink/twine-campfire/commit/d9d6a01210ab5f4d83ae03db3c9f3b30e8abd9d6))
* **trigger:** cover style attribute ([#522](https://github.com/magicink/twine-campfire/issues/522)) ([bd39d84](https://github.com/magicink/twine-campfire/commit/bd39d842df806716d9c0808438f3c78c2083d1fa))

## [1.84.2](https://github.com/magicink/twine-campfire/compare/v1.84.1...v1.84.2) (2025-08-24)


### Bug Fixes

* add full height class to passage ([#514](https://github.com/magicink/twine-campfire/issues/514)) ([5f711b4](https://github.com/magicink/twine-campfire/commit/5f711b470a75c3c1d1a92bd692ed351d65ceb068))

## [1.84.1](https://github.com/magicink/twine-campfire/compare/v1.84.0...v1.84.1) (2025-08-24)


### Bug Fixes

* add base campfire classes to visual components ([#510](https://github.com/magicink/twine-campfire/issues/510)) ([782ae11](https://github.com/magicink/twine-campfire/commit/782ae1126988f894564e6b65fbfb8124995d4fbe))
* respect quoted directive attribute values ([#507](https://github.com/magicink/twine-campfire/issues/507)) ([3291868](https://github.com/magicink/twine-campfire/commit/3291868ba4466cab8f12c58ef6c88e40972ae5ba))

## [1.84.0](https://github.com/magicink/twine-campfire/compare/v1.83.0...v1.84.0) (2025-08-23)


### Features

* **docs:** reorganize directive documentation ([#501](https://github.com/magicink/twine-campfire/issues/501)) ([eeb49c2](https://github.com/magicink/twine-campfire/commit/eeb49c2765cab6e3862c693cb9c60349848f4350))

## [1.83.0](https://github.com/magicink/twine-campfire/compare/v1.82.0...v1.83.0) (2025-08-23)


### Features

* **reveal:** add entrance and exit transitions ([#489](https://github.com/magicink/twine-campfire/issues/489)) ([e8d51e9](https://github.com/magicink/twine-campfire/commit/e8d51e92ab348caf8c9f9b6442168eafe81520db))

## [1.82.0](https://github.com/magicink/twine-campfire/compare/v1.81.0...v1.82.0) (2025-08-22)


### Features

* **storybook:** add layer directive ([#482](https://github.com/magicink/twine-campfire/issues/482)) ([177e14b](https://github.com/magicink/twine-campfire/commit/177e14bb624f071cd59e959f357e292782d9bea2))
* **storybook:** add layer directive ([#482](https://github.com/magicink/twine-campfire/issues/482)) ([11964d5](https://github.com/magicink/twine-campfire/commit/11964d5c1595e6e78358ef13f03003a320f2e726))

## [1.81.0](https://github.com/magicink/twine-campfire/compare/v1.80.1...v1.81.0) (2025-08-22)


### Features

* remove once directive ([#478](https://github.com/magicink/twine-campfire/issues/478)) ([7d96888](https://github.com/magicink/twine-campfire/commit/7d968885137cce34073396065d2783b07964f5ab))
* use bracket syntax for if directive ([#479](https://github.com/magicink/twine-campfire/issues/479)) ([f214c32](https://github.com/magicink/twine-campfire/commit/f214c32661345d02591e0084e6a7becd7953ad5a))

## [1.80.1](https://github.com/magicink/twine-campfire/compare/v1.80.0...v1.80.1) (2025-08-22)


### Bug Fixes

* allow unquoted fallback template literals ([#474](https://github.com/magicink/twine-campfire/issues/474)) ([f196f73](https://github.com/magicink/twine-campfire/commit/f196f734dbaf99d1f121aaf2650fb5b7cd61380a))
* **passage:** reset deck state via hook ([#475](https://github.com/magicink/twine-campfire/issues/475)) ([fa6b93a](https://github.com/magicink/twine-campfire/commit/fa6b93a18b3111a44ef2b7d0ff2fadeb37b13c85))

## [1.80.0](https://github.com/magicink/twine-campfire/compare/v1.79.0...v1.80.0) (2025-08-21)


### Features

* add interpolation support for show and t fallback ([#468](https://github.com/magicink/twine-campfire/issues/468)) ([0d39030](https://github.com/magicink/twine-campfire/commit/0d39030f4632c3d30e9dadc0df613978627ad875))

## [1.79.0](https://github.com/magicink/twine-campfire/compare/v1.78.0...v1.79.0) (2025-08-21)


### Features

* support expressions in show directive ([#463](https://github.com/magicink/twine-campfire/issues/463)) ([8012fa0](https://github.com/magicink/twine-campfire/commit/8012fa0b85a576083c6493564d5cded59230a899))


### Bug Fixes

* **storybook:** await language change ([#466](https://github.com/magicink/twine-campfire/issues/466)) ([0f8c8b3](https://github.com/magicink/twine-campfire/commit/0f8c8b311cb6468a078d368ff1a0ae77cd479c17))

## [1.78.0](https://github.com/magicink/twine-campfire/compare/v1.77.0...v1.78.0) (2025-08-21)


### Features

* add for directive ([#460](https://github.com/magicink/twine-campfire/issues/460)) ([1d7aa28](https://github.com/magicink/twine-campfire/commit/1d7aa280c8cd4cb35e4575b35253e7f1b4dafe4b))

## [1.77.0](https://github.com/magicink/twine-campfire/compare/v1.76.0...v1.77.0) (2025-08-20)


### Features

* add createSlideElement factory for slide components ([#446](https://github.com/magicink/twine-campfire/issues/446)) ([4af5b79](https://github.com/magicink/twine-campfire/commit/4af5b7919849aab244770b2ac99c709c36472170))
* rename Appear to SlideReveal ([#452](https://github.com/magicink/twine-campfire/issues/452)) ([52e375e](https://github.com/magicink/twine-campfire/commit/52e375e26b7a4a4b66916f3177d04f7f20b21f41))
* **utils:** add math helpers ([#453](https://github.com/magicink/twine-campfire/issues/453)) ([a919d9b](https://github.com/magicink/twine-campfire/commit/a919d9bf36d320917c311aad023b47558b6c730a))


### Bug Fixes

* **passage:** prevent button event propagation ([#448](https://github.com/magicink/twine-campfire/issues/448)) ([9ea3012](https://github.com/magicink/twine-campfire/commit/9ea30122716f1d50f188fbd54d2090ac419fe279))
* stop deck autoplay at end and dim disabled buttons ([#447](https://github.com/magicink/twine-campfire/issues/447)) ([7b1bf24](https://github.com/magicink/twine-campfire/commit/7b1bf24afc2a79619d38f9554c448c0200a63ccb))

## [1.76.0](https://github.com/magicink/twine-campfire/compare/v1.75.0...v1.76.0) (2025-08-20)


### Features

* add cached expression evaluator ([#434](https://github.com/magicink/twine-campfire/issues/434)) ([d619cc6](https://github.com/magicink/twine-campfire/commit/d619cc6d9850fb5c7c94597eb2a1f481daf9537a))
* add runDirectiveBlock utility ([#436](https://github.com/magicink/twine-campfire/issues/436)) ([af5d700](https://github.com/magicink/twine-campfire/commit/af5d700917295ef2671fbf507e5433f02b3e1f61))
* add slide layer wrapper ([#437](https://github.com/magicink/twine-campfire/issues/437)) ([1118022](https://github.com/magicink/twine-campfire/commit/11180222b5b5537272471c7a3a26def038d97bf9))
* centralize directive block processing ([#439](https://github.com/magicink/twine-campfire/issues/439)) ([2f4f083](https://github.com/magicink/twine-campfire/commit/2f4f0833fee55f8e4c81c30c44b7260819fd6e05))
* **utils:** add appendClassNames helper ([#435](https://github.com/magicink/twine-campfire/issues/435)) ([bc1cc04](https://github.com/magicink/twine-campfire/commit/bc1cc0488933a144ecaa2611d7ef7f25c13364e1))

## [1.75.0](https://github.com/magicink/twine-campfire/compare/v1.74.0...v1.75.0) (2025-08-20)


### Features

* add autoplay controls to deck directive ([#431](https://github.com/magicink/twine-campfire/issues/431)) ([9fdd850](https://github.com/magicink/twine-campfire/commit/9fdd850f1f0e51f0f5fe431b5e20b2f2d4b6cd4f))

## [1.74.0](https://github.com/magicink/twine-campfire/compare/v1.73.0...v1.74.0) (2025-08-19)


### Features

* add preset directive and from attribute ([#427](https://github.com/magicink/twine-campfire/issues/427)) ([c211837](https://github.com/magicink/twine-campfire/commit/c211837c0975e04065038f54442299c493765c01))
* add preset directive and from attribute ([#427](https://github.com/magicink/twine-campfire/issues/427)) ([711c005](https://github.com/magicink/twine-campfire/commit/711c0051e246b4fdb31584bd72f39e9c1773bc78))

## [1.73.0](https://github.com/magicink/twine-campfire/compare/v1.72.1...v1.73.0) (2025-08-19)


### Features

* enforce quoted ids for persistence directives ([#423](https://github.com/magicink/twine-campfire/issues/423)) ([9257e13](https://github.com/magicink/twine-campfire/commit/9257e131c60ee544b2cc74fb29f5f07b8d08c6af))
* enforce quoted ids for persistence directives ([#423](https://github.com/magicink/twine-campfire/issues/423)) ([1a51972](https://github.com/magicink/twine-campfire/commit/1a51972ed88a733fc7f61dc00aeba3c2d4600e8d))

## [1.72.1](https://github.com/magicink/twine-campfire/compare/v1.72.0...v1.72.1) (2025-08-19)


### Bug Fixes

* enforce container and leaf directive usage ([#420](https://github.com/magicink/twine-campfire/issues/420)) ([35bc8f5](https://github.com/magicink/twine-campfire/commit/35bc8f54935b6ec0bc07461091c218ead21e7570))
* shape directive to render SlideShape ([#419](https://github.com/magicink/twine-campfire/issues/419)) ([39b85b3](https://github.com/magicink/twine-campfire/commit/39b85b3d8b3102fbe81639f84820f0806812da2d))

## [1.72.0](https://github.com/magicink/twine-campfire/compare/v1.71.0...v1.72.0) (2025-08-18)


### Features

* add SlideShape component and directive ([#415](https://github.com/magicink/twine-campfire/issues/415)) ([61f4aad](https://github.com/magicink/twine-campfire/commit/61f4aad746a49f52b7fad7c58f1ba413d098fcc5))
* add SlideShape component and directive ([#415](https://github.com/magicink/twine-campfire/issues/415)) ([732a31a](https://github.com/magicink/twine-campfire/commit/732a31aed58fccf0c7a336e23e337a985af1946b))

## [1.71.0](https://github.com/magicink/twine-campfire/compare/v1.70.0...v1.71.0) (2025-08-18)


### Features

* add SlideImage component ([#410](https://github.com/magicink/twine-campfire/issues/410)) ([bc36968](https://github.com/magicink/twine-campfire/commit/bc36968f8c66877d0de4711ff89836591a742a6e))


### Bug Fixes

* **slide:** apply transition to all appear children ([#407](https://github.com/magicink/twine-campfire/issues/407)) ([83faa5e](https://github.com/magicink/twine-campfire/commit/83faa5e743f91eed35bae6bb79f1a920fb1a9f20))

## [1.70.0](https://github.com/magicink/twine-campfire/compare/v1.69.0...v1.70.0) (2025-08-18)


### Features

* add accessibility controls to deck ([#403](https://github.com/magicink/twine-campfire/issues/403)) ([aa36883](https://github.com/magicink/twine-campfire/commit/aa36883bc371d4eddc594721139ed9488ccb0b9d))


### Bug Fixes

* **deck:** improve transition handling and reset maxSteps on slide unmount ([f8c1672](https://github.com/magicink/twine-campfire/commit/f8c167244731f15e7df1dd3cf74130a33ee84368))
* **deck:** prevent double click skipping appears ([#401](https://github.com/magicink/twine-campfire/issues/401)) ([decb3d8](https://github.com/magicink/twine-campfire/commit/decb3d8c202af60948a4280c238748d1bc08d422))
* **deck:** prevent step indicator flicker ([#404](https://github.com/magicink/twine-campfire/issues/404)) ([e7fd9b8](https://github.com/magicink/twine-campfire/commit/e7fd9b804b2c902672918d69c8d75b8c361993b4))
* reset deck state when slide unmounts ([#402](https://github.com/magicink/twine-campfire/issues/402)) ([0406e94](https://github.com/magicink/twine-campfire/commit/0406e9445d194509597f65985bc012f2caf2c605))
* reset maxSteps for slides without steps ([#400](https://github.com/magicink/twine-campfire/issues/400)) ([3bd77d7](https://github.com/magicink/twine-campfire/commit/3bd77d738c80640a5ef21af8411a34fe98b46756))
* **workflow:** update branch pattern for release triggers in CI ([8aa38bf](https://github.com/magicink/twine-campfire/commit/8aa38bf14765c828a74de3e55c0e6f567f86009a))

## [1.69.0](https://github.com/magicink/twine-campfire/compare/v1.68.0...v1.69.0) (2025-08-17)


### Features

* **deck:** introduce DeckText component and enhance directive handling ([c127d87](https://github.com/magicink/twine-campfire/commit/c127d878418bcb67d5c88f0181430d97a9f9a39a))
* **deck:** introduce DeckText component and enhance directive handling ([f582be3](https://github.com/magicink/twine-campfire/commit/f582be3e1ab2d064559a97c3ced84a00d24931f4))

## [1.68.0](https://github.com/magicink/twine-campfire/compare/v1.67.1...v1.68.0) (2025-08-15)


### Features

* add deck container directive ([#360](https://github.com/magicink/twine-campfire/issues/360)) ([9e593d3](https://github.com/magicink/twine-campfire/commit/9e593d3b9137586c5420507799fee350993f5d99))
* **campfire:** add appear directive ([#366](https://github.com/magicink/twine-campfire/issues/366)) ([8a102e7](https://github.com/magicink/twine-campfire/commit/8a102e7f0ad48ad9f38eb632918e7e9291a958b5))


### Bug Fixes

* **campfire:** avoid entering unseen items on slide change ([#358](https://github.com/magicink/twine-campfire/issues/358)) ([429af97](https://github.com/magicink/twine-campfire/commit/429af9737c0d04ffc7d7844dd29188a36da38c6e))
* **tsconfig:** add twine-jsx type definitions to compiler options ([#359](https://github.com/magicink/twine-campfire/issues/359)) ([cad391c](https://github.com/magicink/twine-campfire/commit/cad391c46642c46b2405f8e4adee491cbd1a161a))

## [1.67.1](https://github.com/magicink/twine-campfire/compare/v1.67.0...v1.67.1) (2025-08-15)


### Bug Fixes

* **appear:** handle slide transitions for multiple elements ([#354](https://github.com/magicink/twine-campfire/issues/354)) ([1e94c06](https://github.com/magicink/twine-campfire/commit/1e94c060429675cd7f78b2837902155a0eedc259))
* **deck:** ensure enter animations run ([#353](https://github.com/magicink/twine-campfire/issues/353)) ([79bf29d](https://github.com/magicink/twine-campfire/commit/79bf29daf42d3986395a218e0b8926c6826b4db6))
* **deck:** ensure enter animations run ([#353](https://github.com/magicink/twine-campfire/issues/353)) ([962a6ec](https://github.com/magicink/twine-campfire/commit/962a6ecfd5b80055fb0797a0a8b4acf8a9f6b756))
* run entry animations before paint ([#352](https://github.com/magicink/twine-campfire/issues/352)) ([c0c221d](https://github.com/magicink/twine-campfire/commit/c0c221d6b5dfb8cb4c6c51b0cac8a8e1a5a5bc8f))
* run entry animations before paint ([#352](https://github.com/magicink/twine-campfire/issues/352)) ([ed7f210](https://github.com/magicink/twine-campfire/commit/ed7f2102cb005ee51b6dbb454bfcc66e3f712b82))

## [1.67.0](https://github.com/magicink/twine-campfire/compare/v1.66.2...v1.67.0) (2025-08-15)


### Features

* add Text component for positioned typography ([#336](https://github.com/magicink/twine-campfire/issues/336)) ([0171350](https://github.com/magicink/twine-campfire/commit/0171350df702e97c013d6d277266ecbc53991d8e))


### Bug Fixes

* apply slide transitions ([#347](https://github.com/magicink/twine-campfire/issues/347)) ([7954b5d](https://github.com/magicink/twine-campfire/commit/7954b5d4c659ed13cbe9c2cb3726c96124e29284))
* optimize store bindings ([#343](https://github.com/magicink/twine-campfire/issues/343)) ([f37f394](https://github.com/magicink/twine-campfire/commit/f37f3946264ba2ce58a947283f096cce6f04f954))
* **slide:** ensure onExit directives run on unmount ([#349](https://github.com/magicink/twine-campfire/issues/349)) ([28eea1e](https://github.com/magicink/twine-campfire/commit/28eea1e2ddf460c4205905c52feead5e4d5cbb3e))
* **storybook:** add campfire alias ([#341](https://github.com/magicink/twine-campfire/issues/341)) ([bde2886](https://github.com/magicink/twine-campfire/commit/bde288607e0f74c8e8d9b1d4c657ca078967ff8c))
* **storybook:** map test utils to preact ([#344](https://github.com/magicink/twine-campfire/issues/344)) ([2b5b8bc](https://github.com/magicink/twine-campfire/commit/2b5b8bc822805f2ad62adce398bf362c6a77ee4e))
* update table styles ([#335](https://github.com/magicink/twine-campfire/issues/335)) ([f92de4a](https://github.com/magicink/twine-campfire/commit/f92de4aed3d8f984dd1307f97470aebddc9bdb12))
* use Appear in Deck story ([#346](https://github.com/magicink/twine-campfire/issues/346)) ([397ea3d](https://github.com/magicink/twine-campfire/commit/397ea3d6df78fe2f57c51c973f1c1b189e543057))
* **vite:** update alias configuration and enable sourcemaps ([#342](https://github.com/magicink/twine-campfire/issues/342)) ([fc47e3c](https://github.com/magicink/twine-campfire/commit/fc47e3c246a257923c490712f16483d7ffe7db77))

## [1.66.2](https://github.com/magicink/twine-campfire/compare/v1.66.1...v1.66.2) (2025-08-14)


### Bug Fixes

* reverted table style changes ([#332](https://github.com/magicink/twine-campfire/issues/332)) ([03bf2ef](https://github.com/magicink/twine-campfire/commit/03bf2ef0dd4f99168e265784a246d29ed1fa9682))

## [1.66.1](https://github.com/magicink/twine-campfire/compare/v1.66.0...v1.66.1) (2025-08-14)


### Bug Fixes

* update table styles for improved design and consistency ([#330](https://github.com/magicink/twine-campfire/issues/330)) ([bac8c67](https://github.com/magicink/twine-campfire/commit/bac8c67ac38625344dc5d6f92f1ec5d082751828))

## [1.66.0](https://github.com/magicink/twine-campfire/compare/v1.65.0...v1.66.0) (2025-08-14)


### Features

* add Appear component for slide builds ([#326](https://github.com/magicink/twine-campfire/issues/326)) ([ee2966c](https://github.com/magicink/twine-campfire/commit/ee2966c4fcb6655a69dcbe74c611f10a5e0d2261))

## [1.65.0](https://github.com/magicink/twine-campfire/compare/v1.64.0...v1.65.0) (2025-08-14)


### Features

* add slide directive lifecycle hooks ([#324](https://github.com/magicink/twine-campfire/issues/324)) ([240b007](https://github.com/magicink/twine-campfire/commit/240b0079087e8335a4662c753bb75fdd3437f7a6))

## [1.64.0](https://github.com/magicink/twine-campfire/compare/v1.63.0...v1.64.0) (2025-08-14)


### Features

* **slide:** support directive hooks on deck slides ([#322](https://github.com/magicink/twine-campfire/issues/322)) ([6088640](https://github.com/magicink/twine-campfire/commit/6088640e065a4c64cc9b1d48acb93b038172e634))

## [1.63.0](https://github.com/magicink/twine-campfire/compare/v1.62.0...v1.63.0) (2025-08-14)


### Features

* add slide component ([#320](https://github.com/magicink/twine-campfire/issues/320)) ([b6a3b7c](https://github.com/magicink/twine-campfire/commit/b6a3b7c43f53f9db773ea401212c2b0354905d8d))

## [1.62.0](https://github.com/magicink/twine-campfire/compare/v1.61.0...v1.62.0) (2025-08-14)


### Features

* add Deck component to campfire app ([#316](https://github.com/magicink/twine-campfire/issues/316)) ([cd63ea0](https://github.com/magicink/twine-campfire/commit/cd63ea0c23cf7482c7af7aa6ee7cc7dba437183a))

## [1.61.0](https://github.com/magicink/twine-campfire/compare/v1.60.0...v1.61.0) (2025-08-14)


### Features

* add useScale hook ([#314](https://github.com/magicink/twine-campfire/issues/314)) ([2dd0050](https://github.com/magicink/twine-campfire/commit/2dd0050272a620ac5d6d4fe764144d4c3401847b))

## [1.60.0](https://github.com/magicink/twine-campfire/compare/v1.59.4...v1.60.0) (2025-08-14)


### Features

* add deck store for slide navigation ([#312](https://github.com/magicink/twine-campfire/issues/312)) ([a778d7b](https://github.com/magicink/twine-campfire/commit/a778d7b058e6a5bd39c1bdaa9d7bd731a4971744))

## [1.59.4](https://github.com/magicink/twine-campfire/compare/v1.59.3...v1.59.4) (2025-08-13)


### Bug Fixes

* process nested directives in if sequences ([#308](https://github.com/magicink/twine-campfire/issues/308)) ([578cfca](https://github.com/magicink/twine-campfire/commit/578cfcad749d8326f9161593b5508b0003b19c8c))

## [1.59.3](https://github.com/magicink/twine-campfire/compare/v1.59.2...v1.59.3) (2025-08-13)


### Bug Fixes

* enforce exclusive random directive attributes ([#305](https://github.com/magicink/twine-campfire/issues/305)) ([3ae8aff](https://github.com/magicink/twine-campfire/commit/3ae8aff0dec22a35346514a96754e5fc65b8b212))

## [1.59.2](https://github.com/magicink/twine-campfire/compare/v1.59.1...v1.59.2) (2025-08-13)


### Bug Fixes

* preserve nodes when preprocessing if blocks ([#303](https://github.com/magicink/twine-campfire/issues/303)) ([b570c6b](https://github.com/magicink/twine-campfire/commit/b570c6bbc2e78ca08c3a332a7faaf649b9fa0942))

## [1.59.1](https://github.com/magicink/twine-campfire/compare/v1.59.0...v1.59.1) (2025-08-13)


### Bug Fixes

* forward transition styles to trigger buttons ([#300](https://github.com/magicink/twine-campfire/issues/300)) ([a98680b](https://github.com/magicink/twine-campfire/commit/a98680be4a8bffe48f6c9a2672a948cdfc8c5acb))

## [1.59.0](https://github.com/magicink/twine-campfire/compare/v1.58.0...v1.59.0) (2025-08-13)


### Features

* add Campfire Beta demo with sequenced transitions ([456b130](https://github.com/magicink/twine-campfire/commit/456b1309930f540282c06602201010901ef4f17a))


### Bug Fixes

* **sequence:** handle string autoplay ([#299](https://github.com/magicink/twine-campfire/issues/299)) ([2687d8f](https://github.com/magicink/twine-campfire/commit/2687d8f83f1a5bdab5ae97a85e5e2ec12267d42e))

## [1.58.0](https://github.com/magicink/twine-campfire/compare/v1.57.8...v1.58.0) (2025-08-13)


### Features

* add pastel theme palette with dark mode ([#296](https://github.com/magicink/twine-campfire/issues/296)) ([e57e8ab](https://github.com/magicink/twine-campfire/commit/e57e8ab23d98d08efea77b90528b71d63f74cc60))

## [1.57.8](https://github.com/magicink/twine-campfire/compare/v1.57.7...v1.57.8) (2025-08-13)


### Bug Fixes

* sanitize if directive content for multiple container blocks ([#292](https://github.com/magicink/twine-campfire/issues/292)) ([1876d96](https://github.com/magicink/twine-campfire/commit/1876d96e3f3f470bcd4c2925f8c7594bd52c7ca0))
* use Libertinus Serif font ([#295](https://github.com/magicink/twine-campfire/issues/295)) ([9882790](https://github.com/magicink/twine-campfire/commit/9882790b631345714b87c288aa14244e29193417))

## [1.57.7](https://github.com/magicink/twine-campfire/compare/v1.57.6...v1.57.7) (2025-08-13)


### Bug Fixes

* **campfire:** apply transition styles to child ([#290](https://github.com/magicink/twine-campfire/issues/290)) ([b97420e](https://github.com/magicink/twine-campfire/commit/b97420eef5d220458020d3d44d5d0f88b7aa8f1d))

## [1.57.6](https://github.com/magicink/twine-campfire/compare/v1.57.5...v1.57.6) (2025-08-13)


### Bug Fixes

* **if:** handle multiple container directives ([#288](https://github.com/magicink/twine-campfire/issues/288)) ([cd35a30](https://github.com/magicink/twine-campfire/commit/cd35a305a347ebb62b9a1131a04b1e2abb8b2022))

## [1.57.5](https://github.com/magicink/twine-campfire/compare/v1.57.4...v1.57.5) (2025-08-13)


### Bug Fixes

* **template:** set base font size and apply Cormorant font to paragraphs ([0d01a84](https://github.com/magicink/twine-campfire/commit/0d01a84f31886933082d2b9222f9048a1b2b264d))

## [1.57.4](https://github.com/magicink/twine-campfire/compare/v1.57.3...v1.57.4) (2025-08-13)


### Bug Fixes

* **campfire:** use Cormorant font for buttons ([#285](https://github.com/magicink/twine-campfire/issues/285)) ([d5f2b87](https://github.com/magicink/twine-campfire/commit/d5f2b872b41850960f1bb04ec517ac17384fdb18))

## [1.57.3](https://github.com/magicink/twine-campfire/compare/v1.57.2...v1.57.3) (2025-08-13)


### Bug Fixes

* **campfire:** preprocess transition children ([#282](https://github.com/magicink/twine-campfire/issues/282)) ([a5f165a](https://github.com/magicink/twine-campfire/commit/a5f165a56338904199c1ec7a0119dbabdb8f1037))

## [1.57.2](https://github.com/magicink/twine-campfire/compare/v1.57.1...v1.57.2) (2025-08-13)


### Bug Fixes

* default paragraph font and size ([#278](https://github.com/magicink/twine-campfire/issues/278)) ([8135923](https://github.com/magicink/twine-campfire/commit/81359237d6579fe4f6db42601de0f3302cb6778a))

## [1.57.1](https://github.com/magicink/twine-campfire/compare/v1.57.0...v1.57.1) (2025-08-13)


### Bug Fixes

* support sequences inside if directives ([#279](https://github.com/magicink/twine-campfire/issues/279)) ([c9164bb](https://github.com/magicink/twine-campfire/commit/c9164bbb983c38e3bd0ed0c4adca7f4f2ede7811))

## [1.57.0](https://github.com/magicink/twine-campfire/compare/v1.56.0...v1.57.0) (2025-08-12)


### Features

* apply default heading typography ([#275](https://github.com/magicink/twine-campfire/issues/275)) ([a445b46](https://github.com/magicink/twine-campfire/commit/a445b460d11edd1e6f83e953d00d671cb0996d05))

## [1.56.0](https://github.com/magicink/twine-campfire/compare/v1.55.1...v1.56.0) (2025-08-12)


### Features

* remove sequence rewind support ([#272](https://github.com/magicink/twine-campfire/issues/272)) ([af18fc7](https://github.com/magicink/twine-campfire/commit/af18fc71b151389474d5b5ec0ffd3efa379a23d7))

## [1.55.1](https://github.com/magicink/twine-campfire/compare/v1.55.0...v1.55.1) (2025-08-12)


### Bug Fixes

* **campfire:** remove step stagger attribute ([#266](https://github.com/magicink/twine-campfire/issues/266)) ([fefb095](https://github.com/magicink/twine-campfire/commit/fefb0953d1ba5cb0cfd52731986ba20635f6d136))

## [1.55.0](https://github.com/magicink/twine-campfire/compare/v1.54.6...v1.55.0) (2025-08-12)


### Features

* **campfire:** add transition staggering ([#264](https://github.com/magicink/twine-campfire/issues/264)) ([196efd9](https://github.com/magicink/twine-campfire/commit/196efd9f9a6f1769b5f6b16112f8766b968315e3))

## [1.54.6](https://github.com/magicink/twine-campfire/compare/v1.54.5...v1.54.6) (2025-08-12)


### Bug Fixes

* **campfire:** wait for step transitions before advancing sequence ([#262](https://github.com/magicink/twine-campfire/issues/262)) ([d2bd9c6](https://github.com/magicink/twine-campfire/commit/d2bd9c6f459675e8f53419f22e633c90507d0eec))

## [1.54.5](https://github.com/magicink/twine-campfire/compare/v1.54.4...v1.54.5) (2025-08-11)


### Bug Fixes

* **campfire:** strip extra directive markers ([#260](https://github.com/magicink/twine-campfire/issues/260)) ([200eaab](https://github.com/magicink/twine-campfire/commit/200eaabd601520c806a36da10078bb4c31d8b87b))

## [1.54.4](https://github.com/magicink/twine-campfire/compare/v1.54.3...v1.54.4) (2025-08-11)


### Bug Fixes

* remove stray directive markers in sequence steps ([#257](https://github.com/magicink/twine-campfire/issues/257)) ([1d69308](https://github.com/magicink/twine-campfire/commit/1d69308af63d8bb5d1337c2ac857444ff4ef26e0))

## [1.54.3](https://github.com/magicink/twine-campfire/compare/v1.54.2...v1.54.3) (2025-08-11)


### Bug Fixes

* **campfire:** handle indented sequence steps ([#255](https://github.com/magicink/twine-campfire/issues/255)) ([6e72a39](https://github.com/magicink/twine-campfire/commit/6e72a39de1921a235212045b92c7da52186106d5))

## [1.54.2](https://github.com/magicink/twine-campfire/compare/v1.54.1...v1.54.2) (2025-08-11)


### Bug Fixes

* rename restore directive to loadCheckpoint ([#253](https://github.com/magicink/twine-campfire/issues/253)) ([1b99990](https://github.com/magicink/twine-campfire/commit/1b99990ff33c1ab471cac3b57a97cf0296b8d4a8))

## [1.54.1](https://github.com/magicink/twine-campfire/compare/v1.54.0...v1.54.1) (2025-08-11)


### Bug Fixes

* remove attributes from clearCheckpoint directive ([#250](https://github.com/magicink/twine-campfire/issues/250)) ([cbee185](https://github.com/magicink/twine-campfire/commit/cbee185dbeefc89671376b211f27bc7b71254ff2))

## [1.54.0](https://github.com/magicink/twine-campfire/compare/v1.53.0...v1.54.0) (2025-08-11)


### Features

* **i18n:** support interpolation in t directive ([#248](https://github.com/magicink/twine-campfire/issues/248)) ([b98a6d2](https://github.com/magicink/twine-campfire/commit/b98a6d290e4078418185a802c0bd8a1a8e8dee37))

## [1.53.0](https://github.com/magicink/twine-campfire/compare/v1.52.1...v1.53.0) (2025-08-11)


### Features

* remove clearErrors directive ([#246](https://github.com/magicink/twine-campfire/issues/246)) ([9c63230](https://github.com/magicink/twine-campfire/commit/9c63230f6f5dcc9b971217091c4bcfd427f606f2))

## [1.52.1](https://github.com/magicink/twine-campfire/compare/v1.52.0...v1.52.1) (2025-08-11)


### Bug Fixes

* consolidate range directive handling ([#244](https://github.com/magicink/twine-campfire/issues/244)) ([8a4f439](https://github.com/magicink/twine-campfire/commit/8a4f4393502c485cd5e5058f51925a63e28d667b))

## [1.52.0](https://github.com/magicink/twine-campfire/compare/v1.51.2...v1.52.0) (2025-08-11)


### Features

* **campfire:** update debug error display ([#242](https://github.com/magicink/twine-campfire/issues/242)) ([7cd4992](https://github.com/magicink/twine-campfire/commit/7cd4992f00ffbf3053b8ca8517f53b63340234ab))

## [1.51.2](https://github.com/magicink/twine-campfire/compare/v1.51.1...v1.51.2) (2025-08-11)


### Bug Fixes

* **remark-campfire:** handle paragraph hName ([#239](https://github.com/magicink/twine-campfire/issues/239)) ([4d308c6](https://github.com/magicink/twine-campfire/commit/4d308c668aaa7f55a3df055b20bed867786839b2))

## [1.51.1](https://github.com/magicink/twine-campfire/compare/v1.51.0...v1.51.1) (2025-08-11)


### Bug Fixes

* avoid redundant range updates ([#237](https://github.com/magicink/twine-campfire/issues/237)) ([c099868](https://github.com/magicink/twine-campfire/commit/c0998689edd3b29809eb29958795f45e15b60010))

## [1.51.0](https://github.com/magicink/twine-campfire/compare/v1.50.1...v1.51.0) (2025-08-11)


### Features

* add range directives ([#235](https://github.com/magicink/twine-campfire/issues/235)) ([b743b07](https://github.com/magicink/twine-campfire/commit/b743b074ce106168ac8b4222619836e76b0ee86c))

## [1.50.1](https://github.com/magicink/twine-campfire/compare/v1.50.0...v1.50.1) (2025-08-11)


### Bug Fixes

* parse random attrs in batch ([#233](https://github.com/magicink/twine-campfire/issues/233)) ([d430ddc](https://github.com/magicink/twine-campfire/commit/d430ddc8044d49d1409a8f7d4ce3fb71d80f039b))

## [1.50.0](https://github.com/magicink/twine-campfire/compare/v1.49.6...v1.50.0) (2025-08-10)


### Features

* **campfire:** implement sequence directive ([#231](https://github.com/magicink/twine-campfire/issues/231)) ([fdc5b1e](https://github.com/magicink/twine-campfire/commit/fdc5b1e658bc5796520b322d6ff910e6423c0c5d))

## [1.49.6](https://github.com/magicink/twine-campfire/compare/v1.49.5...v1.49.6) (2025-08-10)


### Bug Fixes

* support random directives in onExit and batch ([#229](https://github.com/magicink/twine-campfire/issues/229)) ([61f7ddb](https://github.com/magicink/twine-campfire/commit/61f7ddb297a51abd5c1a005b96324029ed272d05))

## [1.49.5](https://github.com/magicink/twine-campfire/compare/v1.49.4...v1.49.5) (2025-08-10)


### Bug Fixes

* **useDirectiveHandlers:** clean up imports and improve regex patterns ([7b11b0e](https://github.com/magicink/twine-campfire/commit/7b11b0e0b4695d23836db39c502645f270ce1f43))

## [1.49.4](https://github.com/magicink/twine-campfire/compare/v1.49.3...v1.49.4) (2025-08-10)


### Bug Fixes

* **onExit:** remove stray colons after batch ([#226](https://github.com/magicink/twine-campfire/issues/226)) ([75171ee](https://github.com/magicink/twine-campfire/commit/75171ee5ec27a689632c68082374fd3016d2d734))

## [1.49.3](https://github.com/magicink/twine-campfire/compare/v1.49.2...v1.49.3) (2025-08-10)


### Bug Fixes

* restrict batch directive children ([#223](https://github.com/magicink/twine-campfire/issues/223)) ([193bcbe](https://github.com/magicink/twine-campfire/commit/193bcbeed2a68e62255777a3c40b0001d31f8987))

## [1.49.2](https://github.com/magicink/twine-campfire/compare/v1.49.1...v1.49.2) (2025-08-10)


### Bug Fixes

* support batch in onExit and prevent nested batches ([#221](https://github.com/magicink/twine-campfire/issues/221)) ([7380435](https://github.com/magicink/twine-campfire/commit/7380435e6d4d4059844c889eb48c083103a5e14e))

## [1.49.1](https://github.com/magicink/twine-campfire/compare/v1.49.0...v1.49.1) (2025-08-10)


### Bug Fixes

* handle string arrays in random directive ([#219](https://github.com/magicink/twine-campfire/issues/219)) ([fa84837](https://github.com/magicink/twine-campfire/commit/fa8483751bfd1973f7d51aed5f4ea8e66d5486ed))

## [1.49.0](https://github.com/magicink/twine-campfire/compare/v1.48.1...v1.49.0) (2025-08-10)


### Features

* update :random directive API ([#217](https://github.com/magicink/twine-campfire/issues/217)) ([f702c97](https://github.com/magicink/twine-campfire/commit/f702c977464ff13e9722e89adea44c0774492fbf))

## [1.48.1](https://github.com/magicink/twine-campfire/compare/v1.48.0...v1.48.1) (2025-08-10)


### Bug Fixes

* allow standalone OnComplete usage ([#215](https://github.com/magicink/twine-campfire/issues/215)) ([602c669](https://github.com/magicink/twine-campfire/commit/602c669e16ae7d5f2b73a57b1979ef7d57d31802))

## [1.48.0](https://github.com/magicink/twine-campfire/compare/v1.47.0...v1.48.0) (2025-08-10)


### Features

* replace react with preact ([#213](https://github.com/magicink/twine-campfire/issues/213)) ([6f9d03a](https://github.com/magicink/twine-campfire/commit/6f9d03a7485655d1d09a68ca3989806edf9a3f29))

## [1.47.0](https://github.com/magicink/twine-campfire/compare/v1.46.1...v1.47.0) (2025-08-10)


### Features

* add OnComplete component for Sequence ([#210](https://github.com/magicink/twine-campfire/issues/210)) ([6e5eefd](https://github.com/magicink/twine-campfire/commit/6e5eefd74f2b4f7f74bc5bbfcb9b557806d712c6))

## [1.46.1](https://github.com/magicink/twine-campfire/compare/v1.46.0...v1.46.1) (2025-08-10)


### Bug Fixes

* support if directives in onExit ([#206](https://github.com/magicink/twine-campfire/issues/206)) ([a963d9b](https://github.com/magicink/twine-campfire/commit/a963d9bd66c1e642ab5ff0b31034d10c4f3da212))

## [1.46.0](https://github.com/magicink/twine-campfire/compare/v1.45.0...v1.46.0) (2025-08-10)


### Features

* add onExit directive ([#203](https://github.com/magicink/twine-campfire/issues/203)) ([8d0e705](https://github.com/magicink/twine-campfire/commit/8d0e705ec1f4c2aa4b412ba895d758f158a98f12))

## [1.45.0](https://github.com/magicink/twine-campfire/compare/v1.44.0...v1.45.0) (2025-08-09)


### Features

* add Sequence and Step components ([#201](https://github.com/magicink/twine-campfire/issues/201)) ([e23ee8b](https://github.com/magicink/twine-campfire/commit/e23ee8bffd3e9c02c09a3126bdd216abe271829a))

## [1.44.0](https://github.com/magicink/twine-campfire/compare/v1.43.1...v1.44.0) (2025-08-09)


### Features

* add count attribute for t directive ([#199](https://github.com/magicink/twine-campfire/issues/199)) ([2d630d2](https://github.com/magicink/twine-campfire/commit/2d630d23938d47383fd5d8694995aeae2ee40dd1))

## [1.44.0](https://github.com/magicink/twine-campfire/compare/v1.43.1...v1.44.0) (2025-08-09)

### Features

- add count attribute to t directive for pluralization

## [1.43.1](https://github.com/magicink/twine-campfire/compare/v1.43.0...v1.43.1) (2025-08-09)

### Bug Fixes

- correct lang directive handler ([#197](https://github.com/magicink/twine-campfire/issues/197)) ([163726b](https://github.com/magicink/twine-campfire/commit/163726b7d638433ba130df73033e313fb75c43ae))

## [1.43.0](https://github.com/magicink/twine-campfire/compare/v1.42.0...v1.43.0) (2025-08-09)

### Features

- support namespace labels in t directive ([#194](https://github.com/magicink/twine-campfire/issues/194)) ([4852a6c](https://github.com/magicink/twine-campfire/commit/4852a6c0af6005a5a7057d1f3977e51bbeed44a5))

## [1.42.0](https://github.com/magicink/twine-campfire/compare/v1.41.0...v1.42.0) (2025-08-09)

### Features

- drop long-form translations directive ([#192](https://github.com/magicink/twine-campfire/issues/192)) ([2157120](https://github.com/magicink/twine-campfire/commit/215712039e9640468b8c0943e5406df98ed55d58))

## [1.41.0](https://github.com/magicink/twine-campfire/compare/v1.40.2...v1.41.0) (2025-08-08)

### Features

- simplify array directives ([#190](https://github.com/magicink/twine-campfire/issues/190)) ([2a99606](https://github.com/magicink/twine-campfire/commit/2a99606a1227727ef4a80faa866806037c66f167))

## [1.40.2](https://github.com/magicink/twine-campfire/compare/v1.40.1...v1.40.2) (2025-08-08)

### Bug Fixes

- remove duplicate normalizeDirectiveIndentation ([#187](https://github.com/magicink/twine-campfire/issues/187)) ([fa6de6b](https://github.com/magicink/twine-campfire/commit/fa6de6b073a94d005aebf8c1e62344e390667c09))

## [1.40.1](https://github.com/magicink/twine-campfire/compare/v1.40.0...v1.40.1) (2025-08-08)

### Bug Fixes

- normalize directive indentation ([#185](https://github.com/magicink/twine-campfire/issues/185)) ([ab55541](https://github.com/magicink/twine-campfire/commit/ab555418293d46a88dd7b64b8ea3ab9947506c6e))

## [1.40.0](https://github.com/magicink/twine-campfire/compare/v1.39.0...v1.40.0) (2025-08-08)

### Features

- remove math directive and evaluate set expressions ([#183](https://github.com/magicink/twine-campfire/issues/183)) ([7dbe2ba](https://github.com/magicink/twine-campfire/commit/7dbe2ba306b9d5418c6334b205e04903bb61b0a9))

## [1.39.0](https://github.com/magicink/twine-campfire/compare/v1.38.0...v1.39.0) (2025-08-08)

### Features

- remove defined directive and update show syntax ([#181](https://github.com/magicink/twine-campfire/issues/181)) ([ec411ba](https://github.com/magicink/twine-campfire/commit/ec411ba878cdad754342edf69930d35b4cb13f2d))

## [1.38.0](https://github.com/magicink/twine-campfire/compare/v1.37.1...v1.38.0) (2025-08-08)

### Features

- drop long-form set directives ([#179](https://github.com/magicink/twine-campfire/issues/179)) ([f7522cd](https://github.com/magicink/twine-campfire/commit/f7522cd99f155c98f203cce327a520ae686d48d5))

## [1.37.1](https://github.com/magicink/twine-campfire/compare/v1.37.0...v1.37.1) (2025-08-08)

### Bug Fixes

- correct release deletion logic to count lines instead of words ([cef010c](https://github.com/magicink/twine-campfire/commit/cef010cd6800279974627b9d64383ae8af8bd9bc))

## [1.37.0](https://github.com/magicink/twine-campfire/compare/v1.36.1...v1.37.0) (2025-08-08)

### Features

- add shorthand set directives ([#176](https://github.com/magicink/twine-campfire/issues/176)) ([e32a0f6](https://github.com/magicink/twine-campfire/commit/e32a0f6724213102436eba08899ebebe991a8443))

## [1.36.1](https://github.com/magicink/twine-campfire/compare/v1.36.0...v1.36.1) (2025-08-08)

### Bug Fixes

- enforce single checkpoint ([#172](https://github.com/magicink/twine-campfire/issues/172)) ([e8e5c59](https://github.com/magicink/twine-campfire/commit/e8e5c5978db50952f0772d810d7f7a366a4f273f))
- make document title configurable ([#174](https://github.com/magicink/twine-campfire/issues/174)) ([960c10f](https://github.com/magicink/twine-campfire/commit/960c10fe7489b14f7388b4536d37070db61af27f))

## [1.36.0](https://github.com/magicink/twine-campfire/compare/v1.35.5...v1.36.0) (2025-08-08)

### Features

- introduce state manager for game data ([#170](https://github.com/magicink/twine-campfire/issues/170)) ([a6357fb](https://github.com/magicink/twine-campfire/commit/a6357fb3411498a04253573e56ecd5eeb8a67eda))

## [1.35.5](https://github.com/magicink/twine-campfire/compare/v1.35.4...v1.35.5) (2025-08-08)

### Bug Fixes

- handle if/else directives correctly ([#166](https://github.com/magicink/twine-campfire/issues/166)) ([daff3ce](https://github.com/magicink/twine-campfire/commit/daff3ce966fd7d032b34e44673e776d685cfbbb0))

## [1.35.4](https://github.com/magicink/twine-campfire/compare/v1.35.3...v1.35.4) (2025-08-08)

### Bug Fixes

- enforce quoting for navigation directives ([#164](https://github.com/magicink/twine-campfire/issues/164)) ([34b0642](https://github.com/magicink/twine-campfire/commit/34b064234b68c58b0ce4a23dc4fc25c6ade40d0a))

## [1.35.3](https://github.com/magicink/twine-campfire/compare/v1.35.2...v1.35.3) (2025-08-07)

### Bug Fixes

- enforce quoting in i18n directives ([#162](https://github.com/magicink/twine-campfire/issues/162)) ([e5ce1b4](https://github.com/magicink/twine-campfire/commit/e5ce1b4a6b414fe41511c2996db8af24f499669d))

## [1.35.2](https://github.com/magicink/twine-campfire/compare/v1.35.1...v1.35.2) (2025-08-07)

### Bug Fixes

- require quoted trigger labels for trigger directives ([#160](https://github.com/magicink/twine-campfire/issues/160)) ([21fc949](https://github.com/magicink/twine-campfire/commit/21fc9492326ebd34d795d0888b5d965ab35cc490))

## [1.35.1](https://github.com/magicink/twine-campfire/compare/v1.35.0...v1.35.1) (2025-08-07)

### Bug Fixes

- infer types for array directives ([#158](https://github.com/magicink/twine-campfire/issues/158)) ([b3d42ec](https://github.com/magicink/twine-campfire/commit/b3d42ec7b5374e44c03902db91450c20314217c0))

## [1.35.0](https://github.com/magicink/twine-campfire/compare/v1.34.0...v1.35.0) (2025-08-07)

### Features

- require quotes for string values in set directive ([#156](https://github.com/magicink/twine-campfire/issues/156)) ([7c9a95d](https://github.com/magicink/twine-campfire/commit/7c9a95dd36c204d260aa4a9a98a686b56d17e66c))

## [1.34.0](https://github.com/magicink/twine-campfire/compare/v1.33.0...v1.34.0) (2025-08-07)

### Features

- preserve indentation for directives ([#153](https://github.com/magicink/twine-campfire/issues/153)) ([a7d98af](https://github.com/magicink/twine-campfire/commit/a7d98af16afc4cc47b48c9836dd0be00d98f882d))

## [1.33.0](https://github.com/magicink/twine-campfire/compare/v1.32.2...v1.33.0) (2025-08-07)

### Features

- use id attribute for save/load directives ([#151](https://github.com/magicink/twine-campfire/issues/151)) ([0403175](https://github.com/magicink/twine-campfire/commit/0403175bc0dd51b2406c9846ad742c270d41ba14))

## [1.32.2](https://github.com/magicink/twine-campfire/compare/v1.32.1...v1.32.2) (2025-08-06)

### Bug Fixes

- translate directive uses Show component ([#149](https://github.com/magicink/twine-campfire/issues/149)) ([33e5ebb](https://github.com/magicink/twine-campfire/commit/33e5ebbcf935790ad7202caccbba2df873304044))

## [1.32.1](https://github.com/magicink/twine-campfire/compare/v1.32.0...v1.32.1) (2025-08-06)

### Bug Fixes

- remove stray ::: after lone if directive ([#147](https://github.com/magicink/twine-campfire/issues/147)) ([7e1fa9f](https://github.com/magicink/twine-campfire/commit/7e1fa9f8d6312df1808659a66f534f6a34f24ce4))

## [1.32.0](https://github.com/magicink/twine-campfire/compare/v1.31.5...v1.32.0) (2025-08-06)

### Features

- remove onEnter, onExit, and onChange directives ([#145](https://github.com/magicink/twine-campfire/issues/145)) ([40b16c8](https://github.com/magicink/twine-campfire/commit/40b16c860d20a9100d090bf205991ec61cb7ab12))

## [1.31.5](https://github.com/magicink/twine-campfire/compare/v1.31.4...v1.31.5) (2025-08-06)

### Bug Fixes

- **story:** support triggers in if directives ([#143](https://github.com/magicink/twine-campfire/issues/143)) ([eaa4fb1](https://github.com/magicink/twine-campfire/commit/eaa4fb1f0f0bf976fc75fa2709472fab87e28df3))

## [1.31.4](https://github.com/magicink/twine-campfire/compare/v1.31.3...v1.31.4) (2025-08-06)

### Bug Fixes

- rename jsxDEV import ([8038ca6](https://github.com/magicink/twine-campfire/commit/8038ca6e3e401193913231a03077ceeba96cc2bb))

## [1.31.3](https://github.com/magicink/twine-campfire/compare/v1.31.2...v1.31.3) (2025-08-06)

### Bug Fixes

- render trigger directives in If component ([#139](https://github.com/magicink/twine-campfire/issues/139)) ([1dbab1b](https://github.com/magicink/twine-campfire/commit/1dbab1bdd76953104299ab95054fec1c45c51480))

## [1.31.2](https://github.com/magicink/twine-campfire/compare/v1.31.1...v1.31.2) (2025-08-06)

### Bug Fixes

- **campfire:** render If directive tree directly ([#136](https://github.com/magicink/twine-campfire/issues/136)) ([5cba79b](https://github.com/magicink/twine-campfire/commit/5cba79b6582bb1e72dc109ec9519f8f43468c6bd))

## [1.31.1](https://github.com/magicink/twine-campfire/compare/v1.31.0...v1.31.1) (2025-08-06)

### Bug Fixes

- **math:** require key and remove result output ([#132](https://github.com/magicink/twine-campfire/issues/132)) ([6832acf](https://github.com/magicink/twine-campfire/commit/6832acff5a037b71b7d53984acaea376aeb60491))

## [1.31.0](https://github.com/magicink/twine-campfire/compare/v1.30.1...v1.31.0) (2025-08-06)

### Features

- remove increment and decrement directives ([#130](https://github.com/magicink/twine-campfire/issues/130)) ([a3e0feb](https://github.com/magicink/twine-campfire/commit/a3e0feb11859ae60d6cc03af939f2051976d8517))

## [1.30.1](https://github.com/magicink/twine-campfire/compare/v1.30.0...v1.30.1) (2025-08-06)

### Bug Fixes

- **show:** display range values correctly ([#128](https://github.com/magicink/twine-campfire/issues/128)) ([3d496be](https://github.com/magicink/twine-campfire/commit/3d496be7fc2f224c2972c8feaab06b2a53f4ab12))

## [1.30.0](https://github.com/magicink/twine-campfire/compare/v1.29.0...v1.30.0) (2025-08-06)

### Features

- normalize set directive syntax ([#126](https://github.com/magicink/twine-campfire/issues/126)) ([1127c4b](https://github.com/magicink/twine-campfire/commit/1127c4bb4a772ff0538189ca5c5493a8ce2c8311))

## [1.29.0](https://github.com/magicink/twine-campfire/compare/v1.28.0...v1.29.0) (2025-08-06)

### Features

- add show directive ([#124](https://github.com/magicink/twine-campfire/issues/124)) ([3a1bbf5](https://github.com/magicink/twine-campfire/commit/3a1bbf5a0367d0541836f1fe999f811eff050d60))

## [1.28.0](https://github.com/magicink/twine-campfire/compare/v1.27.0...v1.28.0) (2025-08-06)

### Features

- add Show component to display game data ([#122](https://github.com/magicink/twine-campfire/issues/122)) ([6705eab](https://github.com/magicink/twine-campfire/commit/6705eab30365ad7d8f19ffc39e273c9d87109939))

## [1.27.0](https://github.com/magicink/twine-campfire/compare/v1.26.0...v1.27.0) (2025-08-06)

### Features

- remove get directive ([#120](https://github.com/magicink/twine-campfire/issues/120)) ([06f72a9](https://github.com/magicink/twine-campfire/commit/06f72a98652d15fad7f5cbdd42ccd551a9c1467b))

## [1.26.0](https://github.com/magicink/twine-campfire/compare/v1.25.4...v1.26.0) (2025-08-05)

### Features

- **campfire:** add copy button to passage debug tab ([#117](https://github.com/magicink/twine-campfire/issues/117)) ([0ea109b](https://github.com/magicink/twine-campfire/commit/0ea109b0f04f8618eea56bf6594946125127c0ba))

## [1.25.4](https://github.com/magicink/twine-campfire/compare/v1.25.3...v1.25.4) (2025-08-05)

### Bug Fixes

- if directives do not render ([#115](https://github.com/magicink/twine-campfire/issues/115)) ([37a1910](https://github.com/magicink/twine-campfire/commit/37a191025154be229eb11ebb0946f74c16c249a1))

## [1.25.3](https://github.com/magicink/twine-campfire/compare/v1.25.2...v1.25.3) (2025-08-05)

### Bug Fixes

- support complex if expressions ([#113](https://github.com/magicink/twine-campfire/issues/113)) ([8e0f866](https://github.com/magicink/twine-campfire/commit/8e0f86603c278e8cf2c001741a4f6807bb55101b))

## [1.25.2](https://github.com/magicink/twine-campfire/compare/v1.25.1...v1.25.2) (2025-08-05)

### Bug Fixes

- parse if directives after break conversion ([#111](https://github.com/magicink/twine-campfire/issues/111)) ([9ac0ad7](https://github.com/magicink/twine-campfire/commit/9ac0ad7be21d602c83b677cb9294441263465377))

## [1.25.1](https://github.com/magicink/twine-campfire/compare/v1.25.0...v1.25.1) (2025-08-05)

### Bug Fixes

- **passage:** preserve line breaks ([#109](https://github.com/magicink/twine-campfire/issues/109)) ([97e79de](https://github.com/magicink/twine-campfire/commit/97e79de4ad356b6e64954d04ff14ca26b28bd120))

## [1.25.0](https://github.com/magicink/twine-campfire/compare/v1.24.1...v1.25.0) (2025-08-05)

### Features

- **campfire:** add if directive ([#107](https://github.com/magicink/twine-campfire/issues/107)) ([961ca93](https://github.com/magicink/twine-campfire/commit/961ca93cfd0e01fb1a727f0cf2a6c9d8c73ddb3c))

## [1.24.1](https://github.com/magicink/twine-campfire/compare/v1.24.0...v1.24.1) (2025-08-05)

### Bug Fixes

- remove hash-based game state tracking ([#101](https://github.com/magicink/twine-campfire/issues/101)) ([3d733e7](https://github.com/magicink/twine-campfire/commit/3d733e7304b985679cb0a99c5556c1ab38610587))

## [1.24.0](https://github.com/magicink/twine-campfire/compare/v1.23.5...v1.24.0) (2025-08-04)

### Features

- hash game data for passage re-render ([#99](https://github.com/magicink/twine-campfire/issues/99)) ([fc8470f](https://github.com/magicink/twine-campfire/commit/fc8470fa6fe27ae68f6133cb40574b1e28263e91))

## [1.23.5](https://github.com/magicink/twine-campfire/compare/v1.23.4...v1.23.5) (2025-08-04)

### Bug Fixes

- cover if directive after trigger updates ([#97](https://github.com/magicink/twine-campfire/issues/97)) ([d7d02c9](https://github.com/magicink/twine-campfire/commit/d7d02c99e65b35b996523e0e765ec59eaa955344))

## [1.23.4](https://github.com/magicink/twine-campfire/compare/v1.23.3...v1.23.4) (2025-08-04)

### Bug Fixes

- reprocess passage when game state changes ([#94](https://github.com/magicink/twine-campfire/issues/94)) ([618610a](https://github.com/magicink/twine-campfire/commit/618610a5737e36e317b87c4e5c85e9547f3d24af))

## [1.23.3](https://github.com/magicink/twine-campfire/compare/v1.23.2...v1.23.3) (2025-08-04)

### Bug Fixes

- support attribute comparisons in if directive ([#92](https://github.com/magicink/twine-campfire/issues/92)) ([b08d18c](https://github.com/magicink/twine-campfire/commit/b08d18c87d021e1aa2e06138eafc881ea57c203e))

## [1.23.2](https://github.com/magicink/twine-campfire/compare/v1.23.1...v1.23.2) (2025-08-04)

### Bug Fixes

- remove modal directive and component ([#90](https://github.com/magicink/twine-campfire/issues/90)) ([e7e8fb8](https://github.com/magicink/twine-campfire/commit/e7e8fb813d4762ebadea010363f5cad55c4192ee))

## [1.22.0](https://github.com/magicink/twine-campfire/compare/v1.21.0...v1.22.0) (2025-08-03)

### Features

- add trigger directive for interactive buttons ([#84](https://github.com/magicink/twine-campfire/issues/84)) ([bf354b5](https://github.com/magicink/twine-campfire/commit/bf354b59a61363eeb8d5fdf884a88d2987365aee))

## [1.21.0](https://github.com/magicink/twine-campfire/compare/v1.20.0...v1.21.0) (2025-08-03)

### Features

- add batch directive ([#81](https://github.com/magicink/twine-campfire/issues/81)) ([af9f650](https://github.com/magicink/twine-campfire/commit/af9f650de0aad5a734701549460538c4bc26af9b))

## [1.20.0](https://github.com/magicink/twine-campfire/compare/v1.19.0...v1.20.0) (2025-08-03)

### Features

- allow overriding page title ([#79](https://github.com/magicink/twine-campfire/issues/79)) ([d97a24a](https://github.com/magicink/twine-campfire/commit/d97a24a394bc7f3b7bb11dfb6b1aaef86e3217be))

## [1.19.0](https://github.com/magicink/twine-campfire/compare/v1.18.0...v1.19.0) (2025-08-03)

### Features

- add splice directive ([#77](https://github.com/magicink/twine-campfire/issues/77)) ([c370bfb](https://github.com/magicink/twine-campfire/commit/c370bfbb9b65c8b223055560aef71353dddd4318))

## [1.18.0](https://github.com/magicink/twine-campfire/compare/v1.17.0...v1.18.0) (2025-08-03)

### Features

- add defined and array mutation directives ([#75](https://github.com/magicink/twine-campfire/issues/75)) ([9af69c9](https://github.com/magicink/twine-campfire/commit/9af69c9ebf1e33af10bd7058b26f4d1d7742c9ad))

## [1.17.0](https://github.com/magicink/twine-campfire/compare/v1.16.1...v1.17.0) (2025-08-02)

### Features

- add defined directive to check if a value exists
- add pop, push, shift, unshift, and concat directives for arrays

## [1.16.1](https://github.com/magicink/twine-campfire/compare/v1.16.0...v1.16.1) (2025-08-02)

### Bug Fixes

- remove empty paragraphs after directives ([#71](https://github.com/magicink/twine-campfire/issues/71)) ([48e430c](https://github.com/magicink/twine-campfire/commit/48e430c3a58aa86374a20148b7ef0750f9ef1cab))

## [1.16.0](https://github.com/magicink/twine-campfire/compare/v1.15.0...v1.16.0) (2025-08-02)

### Features

- add goto, save, and load directives ([#69](https://github.com/magicink/twine-campfire/issues/69)) ([eb8af63](https://github.com/magicink/twine-campfire/commit/eb8af632c4991c74e105d16eeb2c92c864f2354f))

## [1.15.0](https://github.com/magicink/twine-campfire/compare/v1.14.3...v1.15.0) (2025-08-02)

### Features

- add checkpoint and restore directives ([#67](https://github.com/magicink/twine-campfire/issues/67)) ([8a81c46](https://github.com/magicink/twine-campfire/commit/8a81c468e73b24555f006d7ed3abba8a515bb713))

## [1.14.3](https://github.com/magicink/twine-campfire/compare/v1.14.2...v1.14.3) (2025-08-02)

### Bug Fixes

- **apps/campfire:** adjust DebugWindow positioning based on the minimized state ([ccfc57d](https://github.com/magicink/twine-campfire/commit/ccfc57d919e6c745fdc6b2e56792250b6e12f6c5))

## [1.14.2](https://github.com/magicink/twine-campfire/compare/v1.14.1...v1.14.2) (2025-08-02)

### Bug Fixes

- **apps/campfire:** ensure proper rendering state with i18next initialization ([cfd15ef](https://github.com/magicink/twine-campfire/commit/cfd15efce3feb98f6f6b6f88b4e62de0848f951c))

## [1.14.1](https://github.com/magicink/twine-campfire/compare/v1.14.0...v1.14.1) (2025-08-02)

### Bug Fixes

- **apps/campfire:** handle rendering while i18next initializes ([99ccc55](https://github.com/magicink/twine-campfire/commit/99ccc554abb0eea07ab9f2ec8a5f36b9aec5fcb2))

## [1.14.0](https://github.com/magicink/twine-campfire/compare/v1.13.0...v1.14.0) (2025-08-02)

### Features

- enhance translations and range directive ([#62](https://github.com/magicink/twine-campfire/issues/62)) ([240edf5](https://github.com/magicink/twine-campfire/commit/240edf521e32ec1b72794d34f6fd658b1fb30847))

## [1.13.0](https://github.com/magicink/twine-campfire/compare/v1.12.0...v1.13.0) (2025-08-02)

## [1.12.0](https://github.com/magicink/twine-campfire/compare/v1.11.0...v1.12.0) (2025-08-02)

### Features

- add once directive ([#58](https://github.com/magicink/twine-campfire/issues/58)) ([1d06a15](https://github.com/magicink/twine-campfire/commit/1d06a15a7daef708f9ce1c200f0d6aca760a682a))

## [1.11.0](https://github.com/magicink/twine-campfire/compare/v1.10.1...v1.11.0) (2025-08-02)

### Features

- add math directive ([#56](https://github.com/magicink/twine-campfire/issues/56)) ([41abbf5](https://github.com/magicink/twine-campfire/commit/41abbf507d24675786efcd0968c2418869fdf9a9))
- add once directive

## [1.10.1](https://github.com/magicink/twine-campfire/compare/v1.10.0...v1.10.1) (2025-08-01)

### Bug Fixes

- **apps/campfire:** ensure translations update only after i18next initialization ([#52](https://github.com/magicink/twine-campfire/issues/52)) ([172d2d8](https://github.com/magicink/twine-campfire/commit/172d2d8684a93c8041c2cd178ca52c69a0d0893d))

## [1.10.0](https://github.com/magicink/twine-campfire/compare/v1.9.0...v1.10.0) (2025-08-01)

### Features

- add i18n directives and debug tab ([#50](https://github.com/magicink/twine-campfire/issues/50)) ([26722de](https://github.com/magicink/twine-campfire/commit/26722de04d54d8a57f261e56f40bb9a129310074))

## [1.9.0](https://github.com/magicink/twine-campfire/compare/v1.8.0...v1.9.0) (2025-08-01)

### Features

- **remark:** add lang directive ([#48](https://github.com/magicink/twine-campfire/issues/48)) ([20e2435](https://github.com/magicink/twine-campfire/commit/20e243578ef1273815e77b2226ca579f20854cc9))

## [1.8.0](https://github.com/magicink/twine-campfire/compare/v1.7.2...v1.8.0) (2025-08-01)

### Features

- add include directive ([#42](https://github.com/magicink/twine-campfire/issues/42)) ([b73f234](https://github.com/magicink/twine-campfire/commit/b73f234744ba1792502e8d878c2663dab2816c41))

## [1.7.2](https://github.com/magicink/twine-campfire/compare/v1.7.1...v1.7.2) (2025-08-01)

### Bug Fixes

- **campfire:** make debug window minimize on click ([#40](https://github.com/magicink/twine-campfire/issues/40)) ([befd468](https://github.com/magicink/twine-campfire/commit/befd4689d2415cad2029b6fcd6ee490bbbfdd201))

## [1.7.1](https://github.com/magicink/twine-campfire/compare/v1.7.0...v1.7.1) (2025-08-01)

### Bug Fixes

- **apps/campfire:** refactor useGameStore references ([36af7ed](https://github.com/magicink/twine-campfire/commit/36af7edcefd5ec08afb10abb619588c5cf1d5973))

## [1.7.0](https://github.com/magicink/twine-campfire/compare/v1.6.0...v1.7.0) (2025-07-31)

### Features

- **remark-campfire:** allow custom directive handlers ([#32](https://github.com/magicink/twine-campfire/issues/32)) ([27f1f57](https://github.com/magicink/twine-campfire/commit/27f1f571192a6dd3585e4efc3e362c8924ecfa4a))

## [1.6.0](https://github.com/magicink/twine-campfire/compare/v1.5.2...v1.6.0) (2025-07-31)

### Features

- **apps/campfire:** run user code and styles on init ([#29](https://github.com/magicink/twine-campfire/issues/29)) ([193088e](https://github.com/magicink/twine-campfire/commit/193088e6e65e14ed2976ac0240735f8529d9beeb))

## [1.5.2](https://github.com/magicink/twine-campfire/compare/v1.5.1...v1.5.2) (2025-07-31)

### Bug Fixes

- **apps/campfire:** inject tailwind via cdn ([#27](https://github.com/magicink/twine-campfire/issues/27)) ([ef1ac7c](https://github.com/magicink/twine-campfire/commit/ef1ac7c7f88a1dff6b5eebca5e91f7037d6d23f6))

## [1.5.1](https://github.com/magicink/twine-campfire/compare/v1.5.0...v1.5.1) (2025-07-31)

### Bug Fixes

- **apps/campfire:** include root template in tailwind ([#25](https://github.com/magicink/twine-campfire/issues/25)) ([c3be470](https://github.com/magicink/twine-campfire/commit/c3be470db7d1acc8a2ab6f41c1195acb8d5fdbf2))

## [1.5.0](https://github.com/magicink/twine-campfire/compare/v1.4.0...v1.5.0) (2025-07-31)

### Features

- **apps/campfire:** add tabbed debug window ([#23](https://github.com/magicink/twine-campfire/issues/23)) ([8fe0ee2](https://github.com/magicink/twine-campfire/commit/8fe0ee2a6d1d83a8f14adc0a24775612aed4b562))

## [1.4.0](https://github.com/magicink/twine-campfire/compare/v1.3.6...v1.4.0) (2025-07-31)

### Features

- **remark-campfire:** add setOnce directive ([#21](https://github.com/magicink/twine-campfire/issues/21)) ([cce1839](https://github.com/magicink/twine-campfire/commit/cce1839470bc4120fc079eaf5892c1435ded5233))

## [1.3.6](https://github.com/magicink/twine-campfire/compare/v1.3.5...v1.3.6) (2025-07-31)

### Bug Fixes

- **template:** add absolute positioning classes to html and body for proper layout ([fd5907a](https://github.com/magicink/twine-campfire/commit/fd5907a3c2fb3d0b1a792d498ce4d23e6f634621))

## [1.3.5](https://github.com/magicink/twine-campfire/compare/v1.3.4...v1.3.5) (2025-07-31)

### Bug Fixes

- **apps/campfire:** update root element ID in campfire main file ([9fa265c](https://github.com/magicink/twine-campfire/commit/9fa265caa5846624e098a3bb69a2dcc22f9c1370))

## [1.3.4](https://github.com/magicink/twine-campfire/compare/v1.3.3...v1.3.4) (2025-07-31)

### Bug Fixes

- **apps/campfire:** inject NODE_ENV for react ([#17](https://github.com/magicink/twine-campfire/issues/17)) ([5bab472](https://github.com/magicink/twine-campfire/commit/5bab472cf1f8a4360e0fc7c88fd188f80a278d41))

## [1.3.3](https://github.com/magicink/twine-campfire/compare/v1.3.2...v1.3.3) (2025-07-31)

### Bug Fixes

- **template:** remove double stringification ([de6c038](https://github.com/magicink/twine-campfire/commit/de6c038390d61afdd73b22a10dead46e372935c5))

## [1.3.2](https://github.com/magicink/twine-campfire/compare/v1.3.1...v1.3.2) (2025-07-31)

### Bug Fixes

- **template:** reorder story data for correct rendering ([1aadf66](https://github.com/magicink/twine-campfire/commit/1aadf667b1b6366e133a19ae670984675da4ac19))

## [1.3.1](https://github.com/magicink/twine-campfire/compare/v1.3.0...v1.3.1) (2025-07-31)

### Bug Fixes

- **remark-campfire:** replace variable attr with key ([#13](https://github.com/magicink/twine-campfire/issues/13)) ([c57be24](https://github.com/magicink/twine-campfire/commit/c57be24c20f0beae34a60f333dedc2f24fc0a03d))

## [1.3.0](https://github.com/magicink/twine-campfire/compare/v1.2.1...v1.3.0) (2025-07-31)

### Features

- **remark-campfire:** support increment and decrement directives ([#10](https://github.com/magicink/twine-campfire/issues/10)) ([1755ec8](https://github.com/magicink/twine-campfire/commit/1755ec8200ba09716239f7ec4137b482313dce7e))

## [1.2.1](https://github.com/magicink/twine-campfire/compare/v1.2.0...v1.2.1) (2025-07-31)

### Bug Fixes

- **test-env:** await happy-dom unregister ([#7](https://github.com/magicink/twine-campfire/issues/7)) ([41b46a4](https://github.com/magicink/twine-campfire/commit/41b46a42b3f3a5cf5170ab098da0b34d55ee5201))

## [1.2.0](https://github.com/magicink/twine-campfire/compare/v1.1.0...v1.2.0) (2025-07-31)

### Features

- **remark-campfire:** add range type ([efcd995](https://github.com/magicink/twine-campfire/commit/efcd995ac6f8ab5edc6c193b281aba83d2d3ba15))

### Bug Fixes

- refine range parsing and update tests ([d5ae036](https://github.com/magicink/twine-campfire/commit/d5ae0368ac2fc10113284e6bf4bc04fbfaa097ef))

## [1.1.0](https://github.com/magicink/twine-campfire/compare/v1.0.0...v1.1.0) (2025-07-30)

### Features

- **main:** set up initial project structure with packages, workflows, and configurations ([ccd42c7](https://github.com/magicink/twine-campfire/commit/ccd42c7ee6e596de23347fc790df55c623c132e0))

### Bug Fixes

- **workflows:** update release workflow permissions to include issue writing ([f124fc7](https://github.com/magicink/twine-campfire/commit/f124fc7cb5822698721c984e8dd5477da4a56825))
