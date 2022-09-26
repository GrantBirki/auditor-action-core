import * as github from '@actions/github'
import {audit} from './audit.mjs'

export function processDiff(config, diff) {
  var report = false
  var message =
    '### Auditor Results ⚠️\n\nThe **Auditor** has detected findings in your pull request\n\n'
  var counter = 0
  var annotations = []

  var annotation_level
  const alertLevel = process.env.ALERT_LEVEL || 'fail'
  if (alertLevel === 'fail') {
    annotation_level = 'failure'
  } else {
    annotation_level = 'warning'
  }

  var base_url = 'https://github.com'
  if (process.env.CI === 'true') {
    base_url = `${base_url}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${github.context.sha}`
  }

  for (const file of diff.files) {
    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        // audit the line content with the ruleset
        var result = audit(config, change.content)

        if (result.passed) {
          // go to the next line in the git diff if the line passes the rule set
          continue
        }

        // if we get here, the rule failed
        report = true
        counter += 1
        message += `- Alert ${counter}\n  - File: \`${file.path}\`\n  - Line: \`[${change.lineAfter}](${base_url}/${file.path}#L${change.lineAfter})\`\n  - Rule Name: ${result.rule.name}\n  - Message: ${result.rule.message}\n  - Rule Type: \`${result.rule.type}\`\n  - Rule Pattern: \`${result.rule.pattern}\`\n\n`

        annotations.push({
          path: file.path,
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
