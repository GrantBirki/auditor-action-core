import {test} from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {syncBuiltinESMExports} from 'node:module'
import {mkdtempSync, writeFileSync, readFileSync, rmSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir, EOL} from 'node:os'
import * as core from '../src/actions.js'

test('input normalization, required whitespace and boolean spellings', () => {
  process.env.INPUT_A_NAME = '  hello \n'
  assert.equal(core.getInput('a name'), 'hello')
  process.env.INPUT_A_NAME = '   '
  assert.equal(core.getInput('a name', {required: true}), '')
  delete process.env.INPUT_A_NAME
  assert.throws(
    () => core.getInput('a name', {required: true}),
    /Input required/
  )
  assert.equal(core.getInput('a name'), '')
  for (const value of ['true', 'True', 'TRUE', 'false', 'False', 'FALSE']) {
    process.env.INPUT_BOOLEAN = value
    assert.equal(
      core.getBooleanInput('boolean'),
      value.toLowerCase() === 'true'
    )
  }
  process.env.INPUT_BOOLEAN = 'yes'
  assert.throws(() => core.getBooleanInput('boolean'), TypeError)
  delete process.env.INPUT_BOOLEAN
})
test('runner commands escape data, output properties and set failure status', t => {
  let output = ''
  t.mock.method(process.stdout, 'write', (chunk: string | Uint8Array) => {
    output += String(chunk)
    return true
  })
  const previous = process.exitCode
  const outputPath = process.env.GITHUB_OUTPUT
  delete process.env.GITHUB_OUTPUT
  try {
    core.debug('a%\r\nb')
    core.warning('warning')
    core.error('error')
    core.info('info')
    core.setFailed('failed')
    assert.equal(process.exitCode, 1)
    core.setOutput('a:b,c', ['one', 'two'])
    assert.equal(
      output,
      `::debug::a%25%0D%0Ab${EOL}::warning::warning${EOL}::error::error${EOL}info${EOL}::error::failed${EOL}${EOL}::set-output name=a%3Ab%2Cc::["one","two"]${EOL}`
    )
  } finally {
    process.exitCode = previous
    if (outputPath === undefined) delete process.env.GITHUB_OUTPUT
    else process.env.GITHUB_OUTPUT = outputPath
  }
})
test('file outputs preserve multiline JSON and reject delimiter collisions', t => {
  const directory = mkdtempSync(join(tmpdir(), 'auditor-output-'))
  const file = join(directory, 'output')
  const previous = process.env.GITHUB_OUTPUT
  const uuid = '12345678-1234-1234-1234-123456789012'
  t.mock.method(crypto, 'randomUUID', () => uuid)
  syncBuiltinESMExports()
  process.env.GITHUB_OUTPUT = file
  try {
    assert.throws(() => core.setOutput('x', 'value'), /Missing file at path/)
    writeFileSync(file, '')
    core.setOutput('count', 2)
    core.setOutput('text', 'one\ntwo')
    core.setOutput('reviewers', ['octocat', 'org/team'])
    const delimiter = `ghadelimiter_${uuid}`
    assert.equal(
      readFileSync(file, 'utf8'),
      [
        'count',
        '2',
        'text',
        'one\ntwo',
        'reviewers',
        '["octocat","org/team"]'
      ].reduce(
        (output, value, index, values) =>
          index % 2
            ? output
            : output +
              `${value}<<${delimiter}${EOL}${values[index + 1]}${EOL}${delimiter}${EOL}`,
        ''
      )
    )
    assert.throws(
      () => core.setOutput(delimiter, 'value'),
      /name should not contain/
    )
    assert.throws(
      () => core.setOutput('name', delimiter),
      /value should not contain/
    )
    process.env.GITHUB_OUTPUT = directory
    assert.throws(() => core.setOutput('name', 'value'))
  } finally {
    t.mock.restoreAll()
    syncBuiltinESMExports()
    if (previous === undefined) delete process.env.GITHUB_OUTPUT
    else process.env.GITHUB_OUTPUT = previous
    rmSync(directory, {recursive: true, force: true})
  }
})
