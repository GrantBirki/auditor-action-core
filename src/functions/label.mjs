import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function label(config, action) {
  const labels = config.global_options?.labels || []
  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)

  const owner = context.repo.owner
  const repo = context.repo.repo
  const issueNumber = github.context.issue.number

  // Add labels
  if (action === 'add') {
    if (labels.length === 0) {
      core.debug('no labels to add')
      return
    }

    core.debug(`adding labels to pr: ${labels}`)

    if (process.env.CI !== 'true') {
      return
    }

    await octokit.rest.issues.addLabels({
      labels,
      owner: owner,
      repo: repo,
      issue_number: issueNumber
    })
    return
  }

  // Remove labels
  if (action === 'remove') {
    if (labels.length === 0) {
      core.debug('no labels to remove')
      return
    }
    core.debug(`removing labels from pr: ${labels}`)
    if (process.env.CI !== 'true') {
      return
    }

    for (const label of labels) {
      core.debug(`removing label from pr: ${label}`)
      try {
        await octokit.rest.issues.removeLabel({
          owner: owner,
          repo: repo,
          issue_number: issueNumber,
          label
        })
      } catch (e) {
        core.debug(`failed to remove label: ${label} - error: ${e}`)
      }
    }
    return
  }
}
