import * as core from '@actions/core'

import {comment} from './comment.mjs'
import {label} from './label.mjs'
// import {annotate} from './annotate.mjs'

export async function processResults(config, results) {
  const alertLevel = config?.global_options?.alert_level || 'fail'
  const shouldComment = config?.global_options?.comment_on_pr ?? true
  // const shouldAnnotate = process.env.ANNOTATE_PR || 'true'

  if (results.report) {
    core.setOutput('violation_count', results.counter)

    if (shouldComment === true) {
      await comment(results.message)
    }

    label(config)

    // if (shouldAnnotate === 'true') {
    //   await annotate(config, results.annotations)
    // }

    if (alertLevel === 'fail') {
      core.error(results.message)
      core.setFailed(`The Auditor found ${results.counter} findings`)
    }

    if (alertLevel === 'warn') {
      core.warning(results.message)
      core.warning(`The Auditor found ${results.counter} findings`)
    }

    if (process.env.CI !== 'true') {
      console.log('\n', results.message)
    }

    core.setOutput('passed', 'false')
  } else {
    core.info('✅ No findings were detected by the Auditor')
    core.setOutput('passed', 'true')
  }
}
