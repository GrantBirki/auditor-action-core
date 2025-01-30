import * as core from '@actions/core'

import {comment} from './comment.mjs'
import {label} from './label.mjs'
import {annotate} from './annotate.mjs'
import fs from 'fs'

export async function processResults(config, results) {
  const alertLevel = config?.global_options?.alert_level || 'fail'
  const shouldComment = config?.global_options?.comment_on_pr ?? true
  const shouldRequestReviewers = config?.global_options?.request_reviewers ?? true
  const shouldAnnotate = core.getBooleanInput('annotate_pr')
  const writeResultsPath = core.getInput('write_results_path')

  if (results.report) {
    core.setOutput('violation_count', results.counter)

    if (writeResultsPath && writeResultsPath !== '') {
      core.info(`writing results to ${writeResultsPath}`)
      fs.writeFileSync(writeResultsPath, results.message, 'utf8')
    }

    if (shouldComment === true) {
      await comment(results.message)
    }

    await label(config, 'add')

    if (shouldAnnotate === true) {
      core.info('annotating the pull request with the findings')
      await annotate(config, results.annotations)
    }

    if (shouldRequestReviewers === true) {
      core.info('requesting the relevant reviewers on the pull request')
      await requestReviewers(config, results.requestedReviewers)
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

    core.setOutput('passed', 'false')
  } else {
    core.info('✅ No findings were detected by the Auditor')
    await label(config, 'remove')
    core.setOutput('passed', 'true')
  }
}
