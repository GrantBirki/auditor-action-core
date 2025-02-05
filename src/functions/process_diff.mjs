import * as github from '@actions/github'
import * as core from '@actions/core'
import {audit} from './audit.mjs'
import {prData} from './pr_data.mjs'
import {globallyExcluded} from './globally_excluded.mjs'
import {excluded} from './excluded.mjs'
import {included} from './included.mjs'

export async function processDiff(config, diff) {
  var report = false
  var counter = 0
  var annotations = []
  var requested_reviewers = []

  var annotation_level
  var icon
  const alertLevel = config?.global_options?.alert_level || 'fail'

  core.debug(`alert_level: ${alertLevel}`)

  if (alertLevel === 'fail') {
    annotation_level = 'failure'
    icon = '❌'
  } else {
    annotation_level = 'warning'
    icon = '⚠️'
  }

  var message = `### Auditor Results ${icon}\n\nThe **Auditor** has detected findings in your pull request\n\n`

  var base_url = core.getInput('github_base_url', {required: true})
  if (process.env.CI === 'true') {
    const pr = await prData()
    base_url = `${base_url}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${pr.head.ref}`
  }

  var exclude_auditor_config = true
  if (config.global_options?.exclude_auditor_config === false) {
    exclude_auditor_config = false
  }

  const configPath = core.getInput('config_path', {required: true})
  core.debug(`config_path: ${configPath}`)

  // if diff.files is empty, exit
  if (
    diff?.files?.length === 0 ||
    diff?.files === undefined ||
    diff?.files === null
  ) {
    core.warning(`Git diff is empty`)
    process.exit(0)
  }

  for (const file of diff.files) {
    var result

    // dynamically get the file path as renamed files use a different property
    var path
    if (file?.path) {
      path = file.path
    } else if (file?.pathAfter) {
      path = file.pathAfter
    }

    if (path === configPath && exclude_auditor_config === true) {
      core.debug(`Skipping config file (self): ${path}`)
      continue
    }

    if ((await globallyExcluded(path, config)) === true) {
      core.debug(`skipping globally excluded file: ${path}`)
      continue
    }

    // if the rule is a file-change rule, audit the entire file to see if it has been changed in anyway
    if (
      (await included(
        {
          type: 'file-change',
          include_regex: config.rules.find(rule => rule.type === 'file-change')
            ?.include_regex
        },
        path
      )) === true
    ) {
      result = audit(config, '', path)

      if (result.passed) {
        continue
      }

      if ((await excluded(result.rule, path)) === true) {
        core.debug(
          `violation found for path '${path}', but excluded via rule: '${result?.rule?.name}'`
        )
        continue
      }

      core.debug(
        `violation found for path '${path}' via rule: '${result?.rule?.name}'`
      )

      if (result.rule?.do_not_fail === true) {
        core.debug(
          `the ${result.rule.name} was triggered, but will not fail the report alone`
        )
      } else {
        report = true
      }

      counter += 1
      message += `- Alert ${counter}\n  - **Rule**: ${result.rule.name}\n  - **Message**: ${result.rule.message}\n  - File: \`${path}\`\n  - Rule Type: \`${result.rule.type}\`\n\n`

      annotations.push({
        path: path,
        start_line: 1,
        end_line: 1,
        annotation_level: annotation_level,
        message: result.rule.message
      })

      if (result.rule?.requested_reviewers?.length > 0) {
        core.debug(
          `noting the following reviewers are requested for this rule: ${result.rule.requested_reviewers}`
        )
        requested_reviewers.push(...result.rule.requested_reviewers)
      }

      continue
    }

    // check if file.chunks is empty
    if (
      file?.chunks?.length === 0 ||
      file?.chunks === undefined ||
      file?.chunks === null
    ) {
      core.debug(`skipping file with no chunks: ${path}`)
      continue
    }

    // loop through the chunks in the file
    for (const chunk of file.chunks) {
      // check if chunk.changes is empty
      if (
        chunk?.changes?.length === 0 ||
        chunk?.changes === undefined ||
        chunk?.changes === null
      ) {
        core.debug(`skipping chunk with no changes: ${path}`)
        continue
      }

      // loop through the changes in the chunk
      for (const change of chunk.changes) {
        if (change.type === 'UnchangedLine' || change.type === 'DeletedLine') {
          // skip deleted or unchanges lines
          continue
        }

        // audit the line content with the ruleset
        result = audit(config, change.content, path)

        if (result.passed) {
          // go to the next line in the git diff if the line passes the rule set
          continue
        }

        if ((await excluded(result.rule, path)) === true) {
          // if a violation was found, but there is an individual exclude rule, skip it
          core.debug(
            `violation found for path '${path}', but excluded via rule: '${result?.rule?.name}'`
          )
          continue
        }

        if ((await included(result.rule, path)) === false) {
          // if a violation was found, but it is NOT included via a regex rule, skip it
          core.debug(
            `violation found for path '${path}', but not included via rule: '${result?.rule?.name}'`
          )
          continue
        }

        // if we get here, the rule failed
        core.debug(
          `violation found for path '${path}' via rule: '${result?.rule?.name}'`
        )

        if (result.rule?.do_not_fail === true) {
          core.debug(
            `the ${result.rule.name} was triggered, but will not fail the report alone`
          )
        } else {
          report = true
        }

        counter += 1
        message += `- Alert ${counter}\n  - **Rule**: ${result.rule.name}\n  - **Message**: ${result.rule.message}\n  - File: \`${path}\`\n  - Line: [\`${change.lineAfter}\`](${base_url}/${path}#L${change.lineAfter})\n  - Rule Type: \`${result.rule.type}\`\n  - Rule Pattern: \`${result.rule.pattern}\`\n\n`

        annotations.push({
          path: path,
          start_line: change.lineAfter,
          end_line: change.lineAfter,
          annotation_level: annotation_level,
          message: result.rule.message
          // start_column: 1,
          // end_column: 1
        })

        // if the rule has an attribute requested_reviewers, add them to the list
        if (result.rule?.requested_reviewers?.length > 0) {
          core.debug(
            `noting the following reviewers are requested for this rule: ${result.rule.requested_reviewers}`
          )
          requested_reviewers.push(...result.rule.requested_reviewers)
        }
      }
    }
  }

  return {
    report: report,
    message: message,
    counter: counter,
    annotations: annotations,
    requested_reviewers: requested_reviewers
  }
}
