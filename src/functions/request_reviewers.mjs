import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function requestReviewers(reviewers) {
  if (process.env.CI !== 'true') {
    core.warning('Not running in CI, skipping request reviewers')
    return
  }

  var individual_reviewers = []
  var team_reviewers = []
  for (reviewer in reviewers) {
    if (reviewer.match(/^@?[A-Za-z0-9_]\/[A-Za-z0-9_]/)) {
      team_reviewers.push(reviewer)
    } else {
      individual_reviewers.push(reviewer)
    }
  }

  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)
  // add a comment to the issue with the message
  const response = await octokit.rest.pulls.requestReviewers({
    ...context.repo,
    pull_number: pull_number,
    reviewers: individual_reviewers,
    team_reviewers: team_reviewers
  })
}
