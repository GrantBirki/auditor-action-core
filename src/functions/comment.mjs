import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function comment(message) {
  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)
  // add a comment to the issue with the message
  await octokit.rest.issues.createComment({
    ...context.repo,
    issue_number: context.issue.number,
    body: message
  })
}
