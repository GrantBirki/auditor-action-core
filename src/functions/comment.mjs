import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function comment(message) {
  if (process.env.CI !== 'true') {
    core.warning('Not running in CI, skipping comment')
    return
  }

  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)
  // add a comment to the issue with the message
  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: context.issue.number,
    body: message
  })
}
