import {audit} from './audit.mjs'

export function processDiff(config, diff) {
  var report = false
  var message =
    '### Auditor Results ⚠️\n\nThe **Auditor** has detected findings in your pull request\n\n'
  var counter = 0

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
        message += `- Alert #${counter}\n  - File: \`${file.path}\`\n  - Line: \`${change.lineAfter}\`\n  - Rule Name: ${result.rule.name}\n  - Rule Type: ${result.rule.type}\n  - Rule Pattern: ${result.rule.pattern}\n  - Message: ${result.rule.message}\n\n`
      }
    }
  }

  return {
    report: report,
    message: message,
    counter: counter
  }
}
