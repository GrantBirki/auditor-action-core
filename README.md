# auditor-action-core ⚙️

[![CodeQL](https://github.com/GrantBirki/auditor-action-core/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/GrantBirki/auditor-action-core/actions/workflows/codeql-analysis.yml) [![Check dist/](https://github.com/GrantBirki/auditor-action-core/actions/workflows/check-dist.yml/badge.svg)](https://github.com/GrantBirki/auditor-action-core/actions/workflows/check-dist.yml)

> The Action you are probably looking for is [auditor-action](https://github.com/GrantBirki/auditor-action)

The core of the auditor-action. This is the package that does the heavy lifting. It is not meant to be used directly, but rather as a dependency of the auditor-action

## About 💡

This package is the core of the auditor-action. It works by doing the following:

1. Loads the `auditor.yml` configuration file
2. Loads the Git Diff in JSON format from the [git-diff-action](https://github.com/GrantBirki/git-diff-action)
3. Uses the config file to process the JSON git diff and looks for violations
4. Reports the violations as a comment on the PR depending on what environment variables are set

## Inputs 📥

| Name | Required? | Default | Description |
| --- | --- | --- | --- |
| `github_token` | yes | `${{ github.token }}` | The GitHub token to use for the Action - included for you by default! |
| `annotate_pr` | no | `"true"` | Whether or not to annotate the PR with the violations |
| `github_base_url` | yes | `https://github.com` | The base URL for the GitHub instance you are using |
| `json_diff_path` | yes | `diff.json` | The path to the JSON diff file to load |
| `config_path` | yes | `config/auditor.yml` | The path to the `auditor.yml` configuration file |
| `annotate_name` | yes | `The Auditor` | The name of the annotation to name to use |
| `annotate_title` | yes | `The Auditor has detected findings in your pull request` | The title of the annotation to use |
| `annotate_summary` | yes | `Please review the findings and make any necessary changes` | The summary of the annotation to use |
| `annotate_status` | yes | `completed` | The status of the annotation to use |

## Outputs 📤

| Name | Description |
| --- | --- |
| `passed` | Whether or not the audit passed - 'true' or 'false' |
| `violation_count` | The number of violations found |

## Configuration 📝

The following is an example of an `auditor.yml` configuration file will all available options:

### Configuration Options

To view the full list of configuration options, see the [auditor-action](https://github.com/GrantBirki/auditor-action#configuration-)'s section on configuration
