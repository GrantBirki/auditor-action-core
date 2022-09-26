import * as core from '@actions/core'

import {comment} from './comment.mjs'
import {annotate} from './annotate.mjs'

export async function processResults(results) {
  const alertLevel = process.env.ALERT_LEVEL || 'fail'
  const shouldComment = process.env.COMMENT_ON_PR || 'true'
  const shouldAnnotate = process.env.ANNOTATE_PR || 'true'

  if (results.report) {
    if (shouldComment === 'true') {
      await comment(results.message)
    }

    if (shouldAnnotate === 'true') {
      await annotate(results.message)
    }

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
  } else {
    core.info('✅ No findings were detected by the Auditor')
  }
}
