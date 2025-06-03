# Contributing Guidelines <!-- omit in toc -->

## Table of contents <!-- omit in toc -->

- [Reporting Bugs/Feature Requests](#reporting-bugsfeature-requests)
- [Contributing via Pull Requests](#contributing-via-pull-requests)
  - [Dev setup](#dev-setup)
  - [Sending a pull request](#sending-a-pull-request)
- [Conventions](#conventions)
  - [General terminology and practices](#general-terminology-and-practices)
- [Finding contributions to work on](#finding-contributions-to-work-on)
- [Code of Conduct](#code-of-conduct)
- [Security issue notifications](#security-issue-notifications)
- [Licensing](#licensing)

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary information to effectively respond to your bug report or contribution.

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs, suggest features, or documentation improvements.

[When filing an issue](https://github.com/aws-powertools/powertools-mcp/issues/new/choose), please check [existing open](https://github.com/aws-powertools/powertools-mcp/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc), or [recently closed](https://github.com/aws-powertools/powertools-mcp/issues?q=is%3Aissue+sort%3Aupdated-desc+is%3Aclosed), issues to make sure somebody else hasn't already reported the issue. Please try to include as much information as you can.

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the **main** branch, unless instructed otherwise.
2. You check existing open, and recently merged pull requests to make sure someone else hasn't addressed the problem already.
3. You discuss and agree the proposed changes under [an existing issue](https://github.com/aws-powertools/powertools-mcp/issues?q=is%3Aopen+is%3Aupdated-desc) or a new one before you begin any implementation. We value your time and bandwidth. As such, any pull requests created on non-triaged issues might not be successful.

### Dev setup

Firstly, [fork the repository](https://github.com/aws-powertools/powertools-mcp/fork) and clone it to your local machine.

Then, install the dependencies:

```bash
npm ci
```

and setup the pre-commit and pre-push hooks:

```bash
npm run setup:hooks
```

### Sending a pull request

To send us a pull request, please follow these steps:

1. Create a new branch to focus on the specific change you are contributing e.g. `improv/logging`
2. Make sure that all formatting, linting, and tests tasks run as git pre-commit & pre-push hooks are passing.
3. Commit to your fork using clear commit messages.
4. Send us a pull request with a [conventional semantic title](https://github.com/aws-powertools/powertools-mcp/blob/main/.github/semantic.yml), and answer any default question in the pull request interface.
5. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Conventions

### General terminology and practices

| Category        | Convention                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Docstring**   | We use [TypeDoc](https://typedoc.org) annotations to help generate more readable API references. For public APIs, we always include at least one **Example** to ease everyone's experience when using an IDE.                                                               |
| **Style guide** | We use [Biome](http://biomejs.dev) to enforce style and format beyond good practices. We use TypeScript types, function return types, and access modifiers to convey intent.                                                                                                |
| **Git commits** | We follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). We do not enforce conventional commits on contributors to lower the entry bar. Instead, we enforce a conventional PR title so our label automation and changelog are generated correctly. |

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use GitHub issue labels, [looking at any 'help-wanted' issues is a great place to start](https://github.com/aws-powertools/powertools-mcp/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22).

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
<opensource-codeofconduct@amazon.com> with any additional questions or comments.

## Security issue notifications

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
