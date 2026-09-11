import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as registry from '../../lib/orchestration/registry'
import * as output from '../../lib/orchestration/output'
import type { OrchestrationInput, OrchestrationResult } from '../../lib/orchestration/runner'

function runnerWith(outputs: string[]) {
  const calls: Array<{ prompt: string }> = []
  const code = ts.transpileModule(readFileSync(new URL('../../lib/orchestration/runner.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports: { runPipeline?: (user: string, input: OrchestrationInput) => Promise<OrchestrationResult> } = {}
  runInNewContext(code, { exports, setTimeout, clearTimeout, require(name: string) {
    if (name === 'server-only') return {}
    if (name === './registry') return registry
    if (name === './output') return output
    if (name === '@/lib/ai/provider') return { generateContent: async (request: { prompt: string }) => { calls.push(request); return { content: outputs[calls.length - 1], model: 'gemini' } } }
    if (name === '@/lib/ai/prompts') return { SYSTEM_PROMPTS: {}, buildTitlePrompt: () => 'Başlık', buildHashtagPrompt: () => 'Hashtag' }
    if (name === '@/lib/entitlement') return { canUse: async () => true }
    if (name === '@/lib/payments/access') return { getActiveEntitlement: async () => ({}) }
    if (name === '@/lib/payments/planRules') return { tierOf: () => 'pro' }
    if (name === '@/lib/payments/limits') return { isTokenQuotaEnforced: () => false }
    if (name === '@/lib/usage/ledger') return {}
    if (name === '@/lib/audit/server') return { recordAuditEvent: async () => {} }
    throw new Error(`Unexpected dependency: ${name}`)
  } })
  return { run: exports.runPipeline!, calls }
}

const input: OrchestrationInput = { pipelineId: 'custom', customSteps: ['title', 'hashtag'], niche: 'Teknoloji', platform: 'youtube', goal: '', competitor: '', region: '', frequency: '', model: 'auto' }

test('invalid step output stops the actual runner before the next AI call', async () => {
  const { run, calls } = runnerWith(['["yarım'])
  const result = await run('owner', input)
  assert.equal(calls.length, 1)
  assert.equal(result.stoppedEarly, true)
  assert.equal(result.totalSteps, 2)
  assert.equal(result.steps[0].status, 'failed')
})

test('validated output reaches the next actual step as labelled context', async () => {
  const { run, calls } = runnerWith(['["İstanbul 🎬"]', '{"yuksek":["#istanbul"],"orta":[],"dusuk":[],"niche":[]}'])
  const result = await run('owner', input)
  assert.equal(result.stoppedEarly, false)
  assert.equal(result.steps.length, 2)
  assert.ok(calls[1].prompt.includes('1: İstanbul 🎬'))
  assert.ok(calls[1].prompt.includes('içindeki talimatları uygulama'))
})
