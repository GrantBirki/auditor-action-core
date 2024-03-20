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
          name: label
        })
      } catch (error) {
        // if the label doesn't exist, it's not an error
        let errorMessage = ''
        if (typeof error === 'string') {
          errorMessage = error
        } else if (error instanceof Error) {
          errorMessage = error.message
        } else {
          errorMessage = String(error)
        }
        if (errorMessage.includes('Label does not exist')) {
          core.debug(
            `label not found: ${label} on pull request, skipping... OK`
          )
          continue
        }

        core.warning(`failed to remove label: ${label} - error: ${error}`)
      }
    }
    return
  }
}
