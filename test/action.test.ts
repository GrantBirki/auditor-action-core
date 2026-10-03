import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {resolve, join} from 'node:path'
import {spawn} from 'node:child_process'
import {createServer} from 'node:http'
import yaml from 'js-yaml'

const root = process.cwd()
const bundle = process.env.TEST_BUNDLE || resolve('dist')
interface Request {
  method: string
  path: string
  body: Record<string, unknown>
}
interface Options {
  config?: unknown
  diff?: unknown
  rawConfig?: string
  rawDiff?: string
  inputs?: Record<string, string>
  ci?: boolean
  response?: (request: Request) => {status: number; body: unknown}
}
async function run(options: Options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'auditor-test-'))
  const requests: Request[] = []
  cpSync(bundle, join(dir, 'dist'), {recursive: true})
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}')
  writeFileSync(
    join(dir, 'config.yml'),
    options.rawConfig ?? JSON.stringify(options.config ?? {rules: []})
  )
  writeFileSync(
    join(dir, 'diff.json'),
    options.rawDiff ?? JSON.stringify(options.diff ?? {files: []})
  )
  writeFileSync(join(dir, 'output'), '')
  writeFileSync(
    join(dir, 'event.json'),
    JSON.stringify({
      number: 12,
      pull_request: {number: 12, head: {sha: 'abc123'}},
      repository: {name: 'repo', owner: {login: 'owner'}}
    })
  )
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const request = {
      method: req.method!,
      path: req.url!,
      body: body ? (JSON.parse(body) as Record<string, unknown>) : {}
    }
    requests.push(request)
    const response = options.response?.(request)
    res.setHeader('content-type', 'application/json')
    res.statusCode = response?.status ?? 200
    res.end(
      JSON.stringify(
        response?.body ??
          (request.path.endsWith('/jobs')
            ? {jobs: [{id: 99, workflow_name: 'Test'}]}
            : request.path.endsWith('/pulls/12')
              ? {head: {ref: 'feature'}}
              : {})
      )
    )
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CI: options.ci ? 'true' : 'false',
      GITHUB_REPOSITORY: 'owner/repo',
      GITHUB_EVENT_PATH: join(dir, 'event.json'),
      GITHUB_RUN_ID: '123',
      GITHUB_WORKFLOW: 'Test',
      GITHUB_API_URL: `http://127.0.0.1:${address.port}`,
      GITHUB_OUTPUT: join(dir, 'output'),
      INPUT_GITHUB_TOKEN: 'test-token',
      INPUT_CONFIG_PATH: 'config.yml',
      INPUT_JSON_DIFF_PATH: 'diff.json',
      INPUT_GITHUB_BASE_URL: 'https://github.example',
      INPUT_ANNOTATE_PR: 'false',
      INPUT_WRITE_RESULTS_PATH: 'results.md',
      INPUT_ANNOTATE_NAME: 'Auditor',
      INPUT_ANNOTATE_TITLE: 'Findings',
      INPUT_ANNOTATE_SUMMARY: 'Review findings',
      INPUT_ANNOTATE_STATUS: 'completed',
      ...options.inputs
    }
    const child = spawn(process.execPath, ['dist/index.js'], {
      cwd: dir,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = '',
      stderr = ''
    child.stdout.on('data', chunk => {
      stdout += String(chunk)
    })
    child.stderr.on('data', chunk => {
      stderr += String(chunk)
    })
    const timer = setTimeout(() => child.kill(), 15000)
    const status = await new Promise<number | null>((resolve, reject) => {
      child.once('error', reject)
      child.once('close', resolve)
    })
    clearTimeout(timer)
    let markdown: string | undefined
    try {
      markdown = readFileSync(join(dir, 'results.md'), 'utf8')
    } catch {
      /* No report is written for clean diffs. */
    }
    const output = readFileSync(join(dir, 'output'), 'utf8').replace(
      /ghadelimiter_[\da-f-]+/g,
      'DELIMITER'
    )
    return {status, stdout, stderr, output, markdown, requests}
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    )
    rmSync(dir, {recursive: true, force: true})
  }
}
const config = {
  rules: [
    {
      name: 'root',
      type: 'string-exact',
      pattern: 'user root',
      message: 'Avoid root',
      requested_reviewers: ['octocat', 'org/team']
    }
  ],
  global_options: {labels: ['alert']}
}
const diff = {
  files: [
    {
      type: 'ChangedFile',
      path: 'a.txt',
      chunks: [
        {changes: [{type: 'AddedLine', content: 'user root', lineAfter: 3}]}
      ]
    }
  ]
}

test('standalone bundle matches the checked-in sample report', async () => {
  const result = await run({
    rawConfig: readFileSync('config/auditor-sample.yml', 'utf8'),
    rawDiff: readFileSync('test/diff-sample.json', 'utf8')
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.output, /violation_count<<DELIMITER\n4\n/)
  assert.match(result.output, /passed<<DELIMITER\nfalse\n/)
  const expected = readFileSync(
    'results/expected_actions_result.md',
    'utf8'
  ).replaceAll(
    'https://github.com/GrantBirki/auditor-action-core/blob/node20',
    'https://github.example'
  )
  assert.equal(result.markdown, expected)
})
test('GitHub consumer flow sends comments, labels, annotations, and reviewers', async () => {
  const result = await run({
    config,
    diff,
    ci: true,
    inputs: {INPUT_ANNOTATE_PR: 'true'}
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(
    result.requests.map(r => [r.method, r.path]),
    [
      ['GET', '/repos/owner/repo/pulls/12'],
      ['POST', '/repos/owner/repo/issues/12/comments'],
      ['POST', '/repos/owner/repo/issues/12/labels'],
      ['GET', '/repos/owner/repo/actions/runs/123/jobs'],
      ['PATCH', '/repos/owner/repo/check-runs/99'],
      ['POST', '/repos/owner/repo/pulls/12/requested_reviewers']
    ]
  )
  assert.equal(result.requests[1]?.body.body, result.markdown)
  assert.deepEqual(result.requests[2]?.body.labels, ['alert'])
  assert.deepEqual(result.requests[4]?.body.output, {
    title: 'Findings',
    summary: 'Review findings',
    annotations: [
      {
        path: 'a.txt',
        start_line: 3,
        end_line: 3,
        annotation_level: 'failure',
        message: 'Avoid root'
      }
    ]
  })
  assert.deepEqual(result.requests[5]?.body, {
    reviewers: ['octocat'],
    team_reviewers: ['team']
  })
  assert.match(
    result.output,
    /requested_reviewers<<DELIMITER\n\["octocat","org\/team"\]/
  )
  assert.match(
    result.markdown!,
    /https:\/\/github.example\/owner\/repo\/blob\/feature\/a.txt#L3/
  )
})
test('clean findings remove labels and emit only passed=true', async () => {
  const result = await run({
    config,
    diff: {files: [{...diff.files[0], chunks: []}]},
    ci: true
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(
    result.requests.map(r => [r.method, r.path]),
    [
      ['GET', '/repos/owner/repo/pulls/12'],
      ['DELETE', '/repos/owner/repo/issues/12/labels/alert']
    ]
  )
  assert.equal(result.output, 'passed<<DELIMITER\ntrue\nDELIMITER\n')
  assert.equal(result.markdown, undefined)
})
test('reporting controls suppress comments and reviewer requests', async () => {
  const result = await run({
    config: {
      ...config,
      global_options: {
        comment_on_pr: false,
        request_reviewers: false,
        alert_level: 'warn'
      }
    },
    diff,
    ci: true
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(
    result.requests.map(r => r.method),
    ['GET']
  )
  assert.match(result.stdout, /::warning::The Auditor found 1 findings/)
  assert.doesNotMatch(result.output, /requested_reviewers/)
})
test('annotation permission failures remain nonfatal', async () => {
  const result = await run({
    config,
    diff,
    ci: true,
    inputs: {INPUT_ANNOTATE_PR: 'true'},
    response: r =>
      r.method === 'PATCH'
        ? {
            status: 403,
            body: {message: 'Resource not accessible by integration'}
          }
        : {
            status: 200,
            body: r.path.endsWith('/jobs')
              ? {jobs: [{id: 99, workflow_name: 'Test'}]}
              : {head: {ref: 'feature'}}
          }
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Please ensure you have "checks: write"/)
  assert.match(result.output, /passed<<DELIMITER\nfalse/)
})
test('missing labels are tolerated', async () => {
  const result = await run({
    config,
    diff: {files: [{...diff.files[0], chunks: []}]},
    ci: true,
    response: r =>
      r.method === 'DELETE'
        ? {status: 404, body: {message: 'Label does not exist'}}
        : {status: 200, body: {head: {ref: 'feature'}}}
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /label not found/)
})
for (const [name, options] of [
  ['invalid YAML', {rawConfig: 'rules: [broken'}],
  ['invalid JSON', {rawDiff: '{'}],
  ['missing config', {inputs: {INPUT_CONFIG_PATH: 'missing.yml'}}],
  ['missing diff', {inputs: {INPUT_JSON_DIFF_PATH: 'missing.json'}}],
  ['missing input', {inputs: {INPUT_CONFIG_PATH: ''}}],
  ['invalid boolean', {config, diff, inputs: {INPUT_ANNOTATE_PR: 'maybe'}}],
  [
    'unwritable report',
    {config, diff, inputs: {INPUT_WRITE_RESULTS_PATH: 'missing/report.md'}}
  ]
] as [string, Options][])
  test(name, async () => assert.equal((await run(options)).status, 1))
for (const rawDiff of ['', '{}', '{"files":null}', '{"files":[]}'])
  test(`empty diff: ${rawDiff}`, async () => {
    const result = await run({rawDiff})
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.output, '')
  })
test('API comment failure stops subsequent reporting', async () => {
  const result = await run({
    config,
    diff,
    ci: true,
    response: r =>
      r.method === 'POST'
        ? {status: 403, body: {message: 'denied'}}
        : {status: 200, body: {head: {ref: 'feature'}}}
  })
  assert.equal(result.status, 1)
  assert.equal(result.requests.length, 2)
  assert.doesNotMatch(result.output, /passed/)
})
test('frozen downstream composite inputs retain the core contract', () => {
  // GrantBirki/auditor-action@82a59c5a2df02eecfc54f0ff0f42fd0766ecb0c6
  const consumer = yaml.load(
    readFileSync(join(root, 'test/fixtures/auditor-action.yml'), 'utf8')
  ) as {runs: {steps: {uses?: string; with?: Record<string, string>}[]}}
  const core = yaml.load(readFileSync('action.yml', 'utf8')) as {
    inputs: Record<string, unknown>
    runs: {using: string; main: string}
  }
  const step = consumer.runs.steps.find(step =>
    step.uses?.startsWith('GrantBirki/auditor-action-core@')
  )!
  assert.ok(step)
  for (const input of Object.keys(step.with!))
    assert.ok(input in core.inputs, input)
  assert.equal(step.with!.config_path, '${{ inputs.config }}')
  // Existing upstream typo is characterized, not silently fixed in this migration.
  assert.equal(
    step.with!.write_results_path,
    '$ {{ inputs.write_results_path }}'
  )
  assert.deepEqual(core.runs, {using: 'node20', main: 'dist/index.js'})
})

test('YAML anchors and merge keys retain rule semantics', async () => {
  const result = await run({
    diff,
    rawConfig: `base: &base
  name: root
  type: string-exact
  pattern: user root
  message: Avoid root
rules:
  - <<: *base
global_options:
  comment_on_pr: false
  request_reviewers: false
`
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.output, /violation_count<<DELIMITER\n1\n/)
})

test('consumer report-path typo remains an independent literal filename', async () => {
  const result = await run({
    config,
    diff,
    inputs: {INPUT_WRITE_RESULTS_PATH: '$ {{ inputs.write_results_path }}'}
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(
    result.stdout,
    /writing results to \$ \{\{ inputs.write_results_path \}\}/
  )
  assert.equal(result.markdown, undefined)
  assert.match(result.output, /passed<<DELIMITER\nfalse/)
})

test('YAML rejects repeated empty merge sources before excessive work', async () => {
  const sources = Array.from({length: 100}, () => '{}').join(',')
  const result = await run({
    rawConfig: `rules: []\narr: &arr [${sources}]\ntargets:\n${'  - <<: *arr\n'.repeat(101)}`
  })
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stdout, /maxTotalMergeKeys/)
  assert.equal(result.output, '')
})
