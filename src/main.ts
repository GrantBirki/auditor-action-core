import {loadConfig} from './functions/load_config.js'
import {loadJsonDiff} from './functions/load_json_diff.js'
import {processDiff} from './functions/process_diff.js'
import {processResults} from './functions/process_results.js'

export async function run() {
  const config = loadConfig()
  const diff = loadJsonDiff()
  const results = await processDiff(config, diff)
  await processResults(config, results)
}

run()
