import * as github from '@actions/github'
import * as core from '@actions/core'
import {audit} from './audit.mjs'
import {prData} from './pr_data.mjs'
import {globallyExcluded} from './globally_excluded.mjs'
import {excluded} from './excluded.mjs'
import {included} from './included.mjs'

export async function processDiff(config, diff) {
  var report = false
  var counter = 0
  var annotations = []

  var annotation_level
  var icon
  const alertLevel = config?.global_options?.alert_level || 'fail'
  if (alertLevel === 'fail') {
    annotation_level = 'failure'
    icon = '❌'
  } else {
    annotation_level = 'warning'
    icon = '⚠️'
  }

  var message = `### Auditor Results ${icon}\n\nThe **Auditor** has detected findings in your pull request\n\n`

  var base_url = 'https://github.com'
  if (process.env.CI === 'true') {
    const pr = await prData()
    base_url = `${base_url}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${pr.head.ref}`
  }

  var exclude_auditor_config = true
  if (config.global_options?.exclude_auditor_config === false) {
    exclude_auditor_config = false
  }

  const configPath = process.env.CONFIG_PATH

  for (const file of diff.files) {

    if (file.type === "DeletedFile") {
      // Skip deleted files
      continue
    }

    // dynamically get the file path as renamed files use a different property
    var path
    if (file?.path) {
      path = file.path
    } else if (file?.pathAfter) {
      path = file.pathAfter
    }

    if (path === configPath && exclude_auditor_config === true) {
      core.debug(`Skipping config file (self): ${path}`)
      continue
    }

    if ((await globallyExcluded(path, config)) === true) {
      continue
    }

    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        if (change.type === "UnchangedLine" || change.type === "DeletedLine") {
          // skip deleted or unchanges lines
          continue
        }

        // audit the line content with the ruleset
        var result = audit(config, change.content)

        if (result.passed) {
          // go to the next line in the git diff if the line passes the rule set
          continue
        }

        if ((await excluded(result.rule, path)) === true) {
          // if a violation was found, but there is an individual exclude rule, skip it
          continue
        }

        if ((await included(result.rule, path)) === false) {
          // if a violation was found, but it is NOT included via a regex rule, skip it
          continue
        }

        // if we get here, the rule failed
        report = true
        counter += 1
        message += `- Alert ${counter}\n  - **Rule**: ${result.rule.name}\n  - **Message**: ${result.rule.message}\n  - File: \`${path}\`\n  - Line: [\`${change.lineAfter}\`](${base_url}/${path}#L${change.lineAfter})\n  - Rule Type: \`${result.rule.type}\`\n  - Rule Pattern: \`${result.rule.pattern}\`\n\n`

        annotations.push({
          path: path,
          start_line: change.lineAfter,
          end_line: change.lineAfter,
          annotation_level: annotation_level,
          message: result.rule.message,
          start_column: 1,
          end_column: 1
        })
      }
    }
  }

  return {
    report: report,
    message: message,
    counter: counter
  }
}
