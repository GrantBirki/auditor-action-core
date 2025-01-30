import * as core from '@actions/core'
import {context} from '@actions/github'
import * as github from '@actions/github'

export async function requestReviewers(_config, reviewers) {
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
    if (reviewer.includes('/')) {
      const teamName = reviewer.split('/')[1]
      team_reviewers.push(teamName)
    } else {
      individual_reviewers.push(reviewer)
    }
  }

  // exit early if there are no reviewers
  if (individual_reviewers.length === 0 && team_reviewers.length === 0) {
    core.debug('no reviewers found, skipping request reviewers')
    return
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
