import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function requestReviewers(reviewers) {
  if (process.env.CI !== 'true') {
    core.warning('Not running in CI, skipping request reviewers')
    return
  }

  const owner = context.repo.owner
  const repo = context.repo.repo
  const issueNumber = github.context.issue.number

  const individual_reviewers = []
  const team_reviewers = []
  for (const reviewer of reviewers) {
    if (reviewer.match(/^@?[A-Za-z0-9_]\/[A-Za-z0-9_]/)) {
      team_reviewers.push(reviewer)
    } else {
      individual_reviewers.push(reviewer)
    }
  }

  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)

  await octokit.rest.pulls.requestReviewers({
    owner: owner,
    repo: repo,
    pull_number: issueNumber,
    reviewers: individual_reviewers,
    team_reviewers: team_reviewers
  })
}
