import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function prData() {
  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)
  // Get the PR data
  const pr = await octokit.rest.pulls.get({
    ...context.repo,
    pull_number: context.issue.number
  })
  if (pr.status !== 200) {
    const message = `Could not retrieve PR info: ${pr.status}`
    core.setFailed(message)
    process.exit(1)
  }

  return pr.data
}
