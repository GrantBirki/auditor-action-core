import * as core from '@actions/core'
import * as github from '@actions/github'

export async function annotate(annotations) {
  var annotation_level
  const alertLevel = process.env.ALERT_LEVEL || 'fail'
  if (alertLevel === 'fail') {
    annotation_level = 'failure'
  } else {
    annotation_level = 'warning'
  }

  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)
  await octokit.rest.checks.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    name: 'The Auditor',
    head_sha: github.context.sha,
    status: 'completed',
    conclusion: annotation_level,
    output: {
      title: 'The **Auditor** has detected findings in your pull request',
      summary: 'Please review the findings and make the necessary changes',
      annotations: annotations
    }
  })
}
