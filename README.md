# auditor-action-core ⚙️

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

```yaml
# rules is an array of auditor 'rules' that will be used to detect violations
rules: # array of rules
  - name: <string> # the name of the rule
    type: <string-exact|string-case-insensitive|regex> # the type of rule
    pattern: <string> # the matching pattern to use
    message: <string> # the message to display if a match is found

# global configuration options
global_options:
  exclude_auditor_config: <boolean> # exclude the auditor config file from the audit (this file) - default is true
  exclude_regex: # array of regex patterns to exclude files from the audit globally
   - <string> # the regex pattern to exclude
   - <string> # the regex pattern to exclude (can have multiple)
   - <string> # ... (do as many as you want!)
```

### Live Example

```yaml
# rules is an array of auditor 'rules' that will be used to detect violations
rules:
  - name: "Root User Detected" # the name of the rule
    type: string-exact # an exact string match - case sensitive
    pattern: "user root" # the string to match on
    message: root user detected - this is not allowed, please try again # the message to display if a match is found

  - name: "Root User Detected - Case Insensitive"
    type: string-case-insensitive # a case insensitive string match
    pattern: "UseR rOoT"
    message: root user detected - nice try...

  - name: "Root User Detected - Regex"
    type: regex # a regular expression match (regex)
    pattern: "user\\s+root" # the regex pattern to use for matching (global matchl for the line contents)
    message: root user detected - gotcha with regex

  - name: "should not find anything"
    type: regex
    pattern: "p{100}"
    message: this should not match anything - if it did I broke

# global configuration options
global_options:
  # exclude_auditor_config: false # exclude the auditor config file from the audit (this file) - default is true
  exclude_regex: # list of regex patterns to exclude files from the audit globally
   - "\\.md$"
```
