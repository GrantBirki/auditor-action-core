import * as core from '@actions/core'

export async function excluded(path, config) {
  if (config?.global_options === null || config?.global_options === undefined) {
    return false
  }

  for (const excludeRule of config.global_options?.exclude_regex || []) {
    console.log(`excludeRule: ${excludeRule}`)
    const regex = new RegExp(excludeRule, 'g')
    const matches = path.match(regex)

    if (matches) {
      core.debug(
        `skipping excluded path: ${path} - regex match: ${excludeRule}`
      )
      return true
    }
  }
}
