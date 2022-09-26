import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function label(config) {
  const labels = config.global_options?.labels || []

  if (labels.length === 0) {
    core.debug('no labels to add')
    return
  }

  core.debug(`adding labels to pr: ${labels}`)

  if (process.env.CI !== 'true') {
    return
  }

  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)

  const owner = context.repo.owner
  const repo = context.repo.repo

  await octokit.rest.issues.addLabels({
    labels,
    owner,
    repo,
    issue_number: github.context.issue.number
  })
}
