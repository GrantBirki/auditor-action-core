# Contributing 💻

All contributions are welcome and greatly appreciated!

## Steps to Contribute 💡

> Check the `.node-version` file in the root of this repo so see what version of Node.js is required for local development - note, this can be different from the version of Node.js which runs the Action on GitHub runners

1. Fork this repository
2. Commit your changes
3. Test your changes
4. Open a pull request back to this repository
5. Notify the maintainers of this repository for peer review and approval
6. Merge!

The maintainers of this repository will create a new release with your changes so that everyone can use the new release and enjoy the awesome features of the auditor!

## Local checks

Use the exact Node version in `.node-version` (20.6.0). The action still runs
on the GitHub Actions `node20` runtime. No global tool installation is required.

```sh
script/bootstrap
script/all
```

`script/all` checks formatting and strict TypeScript, rebuilds and compares every
file in `dist/`, and runs the native Node unit and standalone bundle tests. The
bundle tests use a loopback HTTP server and no GitHub credentials. After source
changes, run `script/format` and `script/build` before `script/all` to update the
committed distribution. `script/typecheck` and `script/test` are also available.

Bootstrap uses the lockfile, disables install scripts, and checks each installed
package version. It uses Socket Firewall when available. After a successful
bootstrap, `script/bootstrap --offline` can recreate dependencies from `.npm/`.
This cache is local and untracked. An initial bootstrap needs network access,
and Socket's security service can still require network access during a cached
installation. Formatting, type checking, building and tests use installed tools.

The action is private and consumed through `action.yml` and `dist/index.js`,
not an npm package. Keep those inputs, outputs and the Node 20 runtime compatible.
The downstream manifest fixture records auditor-action commit
`82a59c5a2df02eecfc54f0ff0f42fd0766ecb0c6`. Its existing malformed
`write_results_path` expression is characterized in the tests and must be fixed
in that repository separately. A core release alone does not update its pinned
core or git-diff references.
