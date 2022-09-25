import * as core from '@actions/core'

// Auditor function which checks if a line of git diff passes the configured rule set
// :param config: the configuration object
// :param content: a single line content from the git diff
// Returns {rule: <rule>, passed: false} if the line fails the rule set
// Returns {passed: true} if the line passes all rule sets
export function audit(config, content) {
  for (const rule of config.rules) {
    if (rule.type === 'regex') {
      const regex = new RegExp(rule.pattern, 'g')
      const matches = content.match(regex)

      if (matches) {
        return {
          rule: rule,
          passed: false
        }
      }
    } else if (rule.type === 'string-exact') {
      if (content.includes(rule.pattern)) {
        return {
          rule: rule,
          passed: false
        }
      }
    } else if (rule.type === 'string-case-insensitive') {
      if (content.toLowerCase().includes(rule.pattern.toLowerCase())) {
        return {
          rule: rule,
          passed: false
        }
      }
    } else {
      core.warning(`unknown rule type: ${rule.type}`)
    }

    // if we get here, the rule passed
    return {
      passed: true
    }
  }
}
