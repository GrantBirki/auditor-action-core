import * as core from '@actions/core'
import * as github from '@actions/github'

export async function annotate(config, annotations) {
  var annotation_level
  const alertLevel = config?.global_options?.alert_level || 'fail'
  if (alertLevel === 'fail') {
    annotation_level = 'failure'
  } else {
    annotation_level = 'neutral'
  }

  core.debug(`================== github.content ==================`)
  core.debug(`github.context: ${JSON.stringify(github.context, null, 2)}`)
  core.debug(`================== end github.content ==================`)

  // setup an octokit client
  const token = core.getInput('github_token', {required: true})
  const octokit = github.getOctokit(token)

  // Please note that this will only work for workflows triggered by the pull_request event
  const head_sha = github.context.payload.pull_request.head.sha

  const workflowName = github.context.workflow
  core.debug(`workflowName: ${workflowName}`)

  const {data} = await octokit.rest.actions.listJobsForWorkflowRun({
    ...github.context.repo,
    run_id: github.context.runId
  })
  core.debug(`jobsData: ${JSON.stringify(data, null, 2)}`)
  const checkRunId =
    data.jobs.find(({workflow_name}) => workflow_name === workflowName)?.id ??
    undefined

  core.debug(`======== annotate ========`)
  core.debug(`annotation_level: ${annotation_level}`)
  core.debug(`owner: ${github.context.repo.owner}`)
  core.debug(`repo: ${github.context.repo.repo}`)
  core.debug(`head_sha: ${head_sha}`)
  core.debug(`annotations: ${JSON.stringify(annotations)}`)
  core.debug(`checkRunId: ${checkRunId}`)
  core.debug(`====== end annotate ======`)

  try {
    const response = await octokit.rest.checks.update({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      check_run_id: checkRunId,
      name: core.getInput('annotate_name', {required: true}),
      // head_sha: head_sha,
      status: core.getInput('annotate_status', {required: true}),
      conclusion: annotation_level,
      output: {
        title: core.getInput('annotate_title', {required: true}),
        summary: core.getInput('annotate_summary', {required: true}),
        annotations: annotations
      }
    })
    core.debug(`annotations response: ${JSON.stringify(response, null, 2)}`)
    core.debug(`annotations created`)
  } catch (error) {
    // if the error message contains "Resource not accessible by integration", log a custom message
    if (error.message.includes('Resource not accessible by integration')) {
      core.error(
        'Please ensure you have "checks: write" permissions in your workflow. Or, perhaps the workflow is running in the context of a fork, in that case you will see this error as it is expected.'
      )
    }

    core.error(`error creating annotations: ${error} trace: ${error.stack}`)
    core.error(`annotations: ${JSON.stringify(annotations, null, 2)}`)
  }
}
