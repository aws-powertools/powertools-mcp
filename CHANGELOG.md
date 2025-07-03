## v0.8.8

[compare changes](https://github.com/aws-powertools/powertools-mcp/compare/v0.8.7...v0.8.8)

### 🩹 Fixes

- Add Nodejs shebang to module entry point ([#122](https://github.com/aws-powertools/powertools-mcp/pull/122))

### 🏡 Chore

- **deps-dev:** Bump @modelcontextprotocol/inspector from 0.14.0 to 0.14.1 in the npm_and_yarn group across 1 directory ([#95](https://github.com/aws-powertools/powertools-mcp/pull/95))
- **deps-dev:** Bump @modelcontextprotocol/inspector from 0.14.0 to 0.14.2 ([#97](https://github.com/aws-powertools/powertools-mcp/pull/97))
- **deps-dev:** Bump lint-staged from 16.1.0 to 16.1.2 ([#98](https://github.com/aws-powertools/powertools-mcp/pull/98))
- Upgrade to biome 2.x ([#103](https://github.com/aws-powertools/powertools-mcp/pull/103))
- **deps-dev:** Bump the vitest group across 1 directory with 2 update ([#104](https://github.com/aws-powertools/powertools-mcp/pull/104))
- **deps-dev:** Bump @biomejs/biome from 2.0.0 to 2.0.6 ([#113](https://github.com/aws-powertools/powertools-mcp/pull/113))
- **deps-dev:** Bump @modelcontextprotocol/inspector from 0.14.2 to 0.15.0 ([#117](https://github.com/aws-powertools/powertools-mcp/pull/117))

## v0.8.7

[compare changes](https://github.com/aws-powertools/powertools-mcp/compare/v0.8.6...v0.8.7)

### 🚀 Enhancements

- Add Java runtime versioning support ([#91](https://github.com/aws-powertools/powertools-mcp/pull/91))

## v0.8.6

[compare changes](https://github.com/aws-powertools/powertools-mcp/compare/v0.8.5...v0.8.6)

### 🚀 Enhancements

- Consume md docs directly ([#78](https://github.com/aws-powertools/powertools-mcp/pull/78))
- Refactor search docs tool ([#83](https://github.com/aws-powertools/powertools-mcp/pull/83))

### 🩹 Fixes

- Handle .NET & Java url schemes ([#82](https://github.com/aws-powertools/powertools-mcp/pull/82))
- **build:** Remove esbuild and use tsc for the compilation ([#74](https://github.com/aws-powertools/powertools-mcp/pull/74))

### 🏡 Chore

- **deps-dev:** Bump @modelcontextprotocol/inspector from 0.13.0 to 0.14.0 ([#65](https://github.com/aws-powertools/powertools-mcp/pull/65))

### ✅ Tests

- Add e2e tests ([#73](https://github.com/aws-powertools/powertools-mcp/pull/73))

## v0.8.5

[compare changes](https://github.com/aws-powertools/powertools-mcp/compare/v0.8.4...v0.8.5)

### 🏡 Chore

- Standardize repo ([#49](https://github.com/aws-powertools/powertools-mcp/pull/49))
- Add experimental banner ([#44](https://github.com/aws-powertools/powertools-mcp/pull/44))
- Enable CodeQL & add OSSF badge ([#56](https://github.com/aws-powertools/powertools-mcp/pull/56))
- **deps-dev:** Bump the vitest group across 1 directory with 2 updates ([#51](https://github.com/aws-powertools/powertools-mcp/pull/51))
- Add maintainers handbook ([#62](https://github.com/aws-powertools/powertools-mcp/pull/62))

### 🤖 CI

- Harden GitHub Actions ([#58](https://github.com/aws-powertools/powertools-mcp/pull/58))
- Release workflows ([#63](https://github.com/aws-powertools/powertools-mcp/pull/63))

## [0.8.3](https://github.com/serverless-dna/powertools-mcp/compare/v0.8.2...v0.8.3) (2025-05-24)


### Bug Fixes

* **action:** resolve action lint issue in version bump ([#40](https://github.com/serverless-dna/powertools-mcp/issues/40)) ([53559dc](https://github.com/serverless-dna/powertools-mcp/commit/53559dcb9db4061674aaad56b04d26a5906925c5))

## [0.8.2](https://github.com/serverless-dna/powertools-mcp/compare/v0.8.1...v0.8.2) (2025-05-24)


### Bug Fixes

* **actions:** ensure dry-run actions have NPM_TOKEN ([#39](https://github.com/serverless-dna/powertools-mcp/issues/39)) ([0aa9e96](https://github.com/serverless-dna/powertools-mcp/commit/0aa9e96ae1f702de35c79aa8e56cb24695112a31))

## [0.8.1](https://github.com/serverless-dna/powertools-mcp/compare/v0.8.0...v0.8.1) (2025-05-16)


### Bug Fixes

* markdown converter, replace regex with cheerio for extracting main content div ([#37](https://github.com/serverless-dna/powertools-mcp/issues/37)) ([685dc59](https://github.com/serverless-dna/powertools-mcp/commit/685dc590d7ce89271b6f0a8a83afe567d4c46066))

# [0.8.0](https://github.com/serverless-dna/powertools-mcp/compare/v0.7.0...v0.8.0) (2025-05-16)


### Features

* **fetchDoc:** refactor markdown conversion process and create conversion factory to abstract the actual implementation. ([#36](https://github.com/serverless-dna/powertools-mcp/issues/36)) ([7e5e4ed](https://github.com/serverless-dna/powertools-mcp/commit/7e5e4ed98fbbb4556450c8a01a3be7d4f3719175))
