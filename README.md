# auditor-action-core ⚙️

[![CodeQL](https://github.com/GrantBirki/auditor-action-core/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/GrantBirki/auditor-action-core/actions/workflows/codeql-analysis.yml)

> The Action you are probably looking for is [auditor-action](https://github.com/GrantBirki/auditor-action)

The core of the auditor-action. This is the package that does the heavy lifting. It is not meant to be used directly, but rather as a dependency of the auditor-action

## About 💡

This package is the core of the auditor-action. It works by doing the following:

1. Loads the `auditor.yml` configuration file
2. Loads the Git Diff in JSON format from the [git-diff-action](https://github.com/GrantBirki/git-diff-action)
3. Uses the config file to process the JSON git diff and looks for violations
4. Reports the violations as a comment on the PR depending on what environment variables are set

## Environment Variables 🌎

Rather than using Actions inputs, this Action component uses environment variables for configuration to make local testing easier

| Name | Required? | Default | Description |
| --- | --- | --- | --- |
| `CONFIG_PATH` | yes | - | The path to the `auditor.yml` configuration file |
| `JSON_DIFF_PATH` | yes | - | The path to the JSON diff file to load |
| `ALERT_LEVEL` | yes | `fail` | The alert level to use when reporting violations. Can be `fail` or `warn` |
| `COMMENT_ON_PR` | yes | `true` | Whether or not to comment on the PR. Can be `true` or `false` |

## Configuration 📝

The following is an example of an `auditor.yml` configuration file will all available options:

### Configuration Options

To view the full list of configuration options, see the [auditor-action](https://github.com/GrantBirki/auditor-action#configuration-)'s section on configuration
