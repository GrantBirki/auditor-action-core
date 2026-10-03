import {test} from 'node:test'
import assert from 'node:assert/strict'
import {audit} from '../src/functions/audit.js'
import {excluded} from '../src/functions/excluded.js'
import {included} from '../src/functions/included.js'
import {globallyExcluded} from '../src/functions/globally_excluded.js'
import {processDiff} from '../src/functions/process_diff.js'
import type {Config, Diff, Rule} from '../src/types.js'

const rule: Rule = {
  name: 'root',
  type: 'string-exact',
  pattern: 'user root',
  message: 'Avoid root'
}
const config: Config = {rules: [rule]}
process.env.CI = 'false'
process.env.INPUT_CONFIG_PATH = 'config/auditor.yml'
process.env.INPUT_GITHUB_BASE_URL = 'https://example.test'

for (const [type, pattern, content, expected] of [
  ['string-exact', 'user root', 'user root', false],
  ['string-exact', 'user root', 'USER ROOT', true],
  ['string-case-insensitive', 'UsEr RoOt', 'USER root', false],
  ['regex', 'user\\s+root', 'user  root', false],
  ['regex', '^user root$', 'prefix user root', true],
  ['unknown', 'user root', 'user root', true]
] as const) {
  test(`${type}: ${content}`, () => {
    assert.equal(
      audit({rules: [{...rule, type, pattern}]}, content).passed,
      expected
    )
  })
}
test('first matching rule wins and invalid regex throws', () => {
  assert.deepEqual(
    audit({rules: [rule, {...rule, name: 'second'}]}, 'user root'),
    {passed: false, rule}
  )
  assert.throws(
    () => audit({rules: [{...rule, type: 'regex', pattern: '['}]}, 'x'),
    SyntaxError
  )
  assert.deepEqual(audit({rules: []}, 'user root'), {passed: true})
})
test('include and exclude defaults, empty lists, and matching', async () => {
  assert.equal(await included(rule, 'a.txt'), true)
  assert.equal(await included({...rule, include_regex: null}, 'a.txt'), true)
  assert.equal(await included({...rule, include_regex: []}, 'a.txt'), false)
  assert.equal(
    await included({...rule, include_regex: ['\\.txt$']}, 'a.txt'),
    true
  )
  assert.equal(
    await included({...rule, include_regex: ['\\.txt$']}, 'a.log'),
    false
  )
  assert.equal(await excluded(rule, 'a.txt'), false)
  assert.equal(await excluded({...rule, exclude_regex: []}, 'a.txt'), false)
  assert.equal(
    await excluded({...rule, exclude_regex: ['\\.txt$']}, 'a.txt'),
    true
  )
  assert.equal(
    await excluded({...rule, exclude_regex: ['\\.txt$']}, 'a.log'),
    false
  )
  assert.equal(await globallyExcluded('a.txt', config), false)
  assert.equal(
    await globallyExcluded('a.txt', {
      ...config,
      global_options: {exclude_regex: ['\\.txt$']}
    }),
    true
  )
})
const change = {type: 'AddedLine', content: 'user root', lineAfter: 3}
const file = {type: 'ChangedFile', path: 'a.txt', chunks: [{changes: [change]}]}
test('renames, line filtering, ordering, and duplicate reviewers are preserved', async () => {
  const result = await processDiff(
    {rules: [{...rule, requested_reviewers: ['octocat', 'org/team']}]},
    {
      files: [
        {
          type: 'RenamedFile',
          pathAfter: 'renamed.txt',
          chunks: [
            {
              changes: [
                change,
                {...change, type: 'DeletedLine'},
                {...change, type: 'UnchangedLine'},
                {...change, lineAfter: 8}
              ]
            }
          ]
        },
        {...file, type: 'DeletedFile'},
        {...file, chunks: null},
        {...file, chunks: [{changes: []}]}
      ]
    }
  )
  assert.equal(result.counter, 2)
  assert.deepEqual(result.requested_reviewers, [
    'octocat',
    'org/team',
    'octocat',
    'org/team'
  ])
  assert.deepEqual(
    result.annotations.map(a => [a.path, a.start_line, a.annotation_level]),
    [
      ['renamed.txt', 3, 'failure'],
      ['renamed.txt', 8, 'failure']
    ]
  )
  assert.match(result.message, /https:\/\/example.test\/renamed.txt#L3/)
  assert.equal('fail' in result, false)
})
test('global, config, and individual exclusions take precedence', async () => {
  for (const [cfg, diff] of [
    [{...config, global_options: {exclude_regex: ['txt$']}}, {files: [file]}],
    [config, {files: [{...file, path: 'config/auditor.yml'}]}],
    [
      {
        rules: [
          {...rule, exclude_regex: ['txt$']},
          {...rule, name: 'second'}
        ]
      },
      {files: [file]}
    ],
    [{rules: [{...rule, include_regex: []}]}, {files: [file]}]
  ] as [Config, Diff][])
    assert.equal((await processDiff(cfg, diff)).counter, 0)
  const result = await processDiff(
    {
      ...config,
      global_options: {exclude_auditor_config: false, alert_level: 'warn'}
    },
    {files: [{...file, path: 'config/auditor.yml'}]}
  )
  assert.equal(result.counter, 1)
  assert.equal(result.annotations[0]?.annotation_level, 'warning')
})
