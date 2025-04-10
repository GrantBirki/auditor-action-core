### Auditor Results ⚠️

The **Auditor** has detected findings in your pull request

- Alert 1
  - **Rule**: Root User Detected
  - **Message**: root user detected - this is not allowed, please try again
  - File: `test/test2.txt`
  - Line: [`1`](https://github.com/GrantBirki/auditor-action-core/blob/node20/test/test2.txt#L1)
  - Rule Type: `string-exact`
  - Rule Pattern: `user root`

- Alert 2
  - **Rule**: Root User Detected
  - **Message**: root user detected - this is not allowed, please try again
  - File: `test/test.txt`
  - Line: [`48`](https://github.com/GrantBirki/auditor-action-core/blob/node20/test/test.txt#L48)
  - Rule Type: `string-exact`
  - Rule Pattern: `user root`

- Alert 3
  - **Rule**: Root User Detected - Case Insensitive
  - **Message**: root user detected - nice try...
  - File: `test/test.txt`
  - Line: [`49`](https://github.com/GrantBirki/auditor-action-core/blob/node20/test/test.txt#L49)
  - Rule Type: `string-case-insensitive`
  - Rule Pattern: `UseR rOoT`

- Alert 4
  - **Rule**: Root User Detected - Regex
  - **Message**: root user detected - gotcha with regex
  - File: `test/test.txt`
  - Line: [`50`](https://github.com/GrantBirki/auditor-action-core/blob/node20/test/test.txt#L50)
  - Rule Type: `regex`
  - Rule Pattern: `user\s+root`

