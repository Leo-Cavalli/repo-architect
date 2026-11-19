#!/usr/bin/env node
/**
 * Repo Architect — Dual-Axis Clean Code & Layered Architecture CLI Validator (v1.1.0)
 * Evaluates repositories along TWO independent, non-blended axes (inspired by dual-axis review discipline):
 *
 * AXIS 1 — STRUCTURAL HEALTH (Clean Architecture, Deep Modules & SOLID):
 *   1. Anti-Duplication & Unused UI Components
 *   2. C3 Layer Dependency Direction (no direct DB/ORM queries inside Tier 1 UI Screens)
 *   3. OOP Encapsulation (Private-First) & Shallow Module / Deletion Test
 *   4. Anti-"God File" SRP Check (> 300 lines)
 *   5. Relational Database Integrity (*Id / *_id without @relation / REFERENCES)
 *
 * AXIS 2 — SEMANTIC COMPLIANCE (@arch Tag Fidelity vs. Actual Code):
 *   1. @arch Coverage (exported classes/screens/tables missing @arch tags)
 *   2. @arch:role Drift (declared role contradicts actual code construct)
 *   3. Missing @arch:external on external adapters
 *   4. Unsynced @arch:status (pending / modified tags not yet synced with repo-visualizer)
 */

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage',
  '.arch-visualizer', '.venv', 'venv', '__pycache__', 'target', 'bin', 'obj',
  '.idea', '.vscode', '.gradle', '.agents', '.gemini', 'skills'
]);

const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.java', '.cs', '.py', '.prisma', '.sql']);

function walk(dir, base = dir, list = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return list;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walk(full, base, list);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXTS.has(ext)) list.push({ full, rel, ext, name: entry.name });
    }
  }
  return list;
}

function getLine(content, idx) {
  return content.slice(0, idx).split('\n').length;
}

function parseArchTagNear(content, matchIndex) {
  const windowStr = content.slice(Math.max(0, matchIndex - 520), matchIndex);
  const lastBoundary = Math.max(windowStr.lastIndexOf('}'), windowStr.lastIndexOf(';'));
  const commentBlock = lastBoundary >= 0 ? windowStr.slice(lastBoundary + 1) : windowStr;
  if (!/@arch\b/i.test(commentBlock)) return null;

  const arch = {};
  const compactMatch = /@arch\s*\[([^\]]+)\]\s*([^\n*]*)/i.exec(commentBlock);
  if (compactMatch) {
    for (const pair of compactMatch[1].split(',')) {
      const [k, v] = pair.split('=').map(s => s && s.trim());
      if (k && v) arch[k.toLowerCase()] = v.toLowerCase();
    }
    if (compactMatch[2] && compactMatch[2].trim()) arch.desc = compactMatch[2].trim();
  }
  const tagRegex = /@arch:(\w+)\s+([^\n\r*]+)/gi;
  let m;
  while ((m = tagRegex.exec(commentBlock)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    arch[key] = key === 'role' || key === 'status' ? val.split(/[\s(]/)[0].trim().toLowerCase() : val;
  }
  return Object.keys(arch).length > 0 ? arch : null;
}

function extractBalancedBody(content, openBraceIdx) {
  let depth = 0;
  const maxLen = Math.min(content.length, openBraceIdx + 5000);
  for (let i = openBraceIdx; i < maxLen; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) return content.slice(openBraceIdx + 1, i);
    }
  }
  return content.slice(openBraceIdx + 1, maxLen);
}

function auditRepository(repoRoot) {
  const absRoot = path.resolve(repoRoot);
  const files = walk(absRoot);
  const structural = []; // AXIS 1
  const semantic = [];   // AXIS 2
  const declaredComponents = new Map();

  for (const file of files) {
    let content = '';
    try {
      content = fs.readFileSync(file.full, 'utf8');
    } catch (e) {
      continue;
    }
    const lines = content.split('\n');

    // AXIS 1 — PILAR 4: Anti-"God File" SRP Check (> 300 lines)
    if (lines.length > 300 && !['.prisma', '.sql'].includes(file.ext)) {
      structural.push({
        axis: 'structural',
        pillar: 'Pilar 4 (Anti-God File / SRP)',
        severity: 'WARNING',
        file: file.rel,
        line: 1,
        message: `Arquivo possui ${lines.length} linhas (> 300). Divida em módulos profundos e coesos.`
      });
    }

    // AXIS 2 — Unsynced @arch:status tags
    const pendingMatches = content.match(/@arch:status\s+(pending|modified)\b|@arch\s*\[[^\]]*\bstatus\s*=\s*(pending|modified)\b/gi);
    if (pendingMatches && pendingMatches.length > 0) {
      semantic.push({
        axis: 'semantic',
        pillar: 'Sincronização Incremental (@arch:status)',
        severity: 'INFO',
        file: file.rel,
        line: 1,
        message: `${pendingMatches.length} tag(s) com status 'pending'/'modified' aguardando sincronização no repo-visualizer.`
      });
    }

    // AXIS 1 & 2 — Database Relational Integrity (.prisma)
    if (file.ext === '.prisma') {
      const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
      let m;
      while ((m = modelRegex.exec(content)) !== null) {
        const modelName = m[1];
        const body = m[2];
        const line = getLine(content, m.index);
        const archTag = parseArchTagNear(content, m.index);

        if (!archTag) {
          semantic.push({
            axis: 'semantic',
            pillar: 'Cobertura @arch (repo-builder)',
            severity: 'INFO',
            file: file.rel,
            line,
            message: `Model Prisma '${modelName}' não possui anotação '/// @arch:*' acima da declaração.`
          });
        } else if (archTag.role && archTag.role !== 'table' && archTag.role !== 'entity') {
          semantic.push({
            axis: 'semantic',
            pillar: 'Drift @arch:role vs Código',
            severity: 'WARNING',
            file: file.rel,
            line,
            message: `Model Prisma '${modelName}' declarou '@arch:role ${archTag.role}', mas deveria ser 'table'.`
          });
        }

        for (const raw of body.split('\n')) {
          const l = raw.trim();
          if (!l || l.startsWith('//') || l.startsWith('@@')) continue;
          const colMatch = /^(\w+Id)\s+(String|Int)\b(.*)$/.exec(l);
          if (colMatch) {
            const fkCol = colMatch[1];
            const hasRelation = body.includes(`fields: [${fkCol}]`) || body.includes(`@relation`);
            if (!hasRelation) {
              structural.push({
                axis: 'structural',
                pillar: 'Pilar 5 (Integridade Relacional DER)',
                severity: 'WARNING',
                file: file.rel,
                line,
                message: `Model '${modelName}' possui coluna '${fkCol}' sem vínculo '@relation' explícito.`
              });
            }
          }
        }
      }
      continue;
    }

    const isScreen = /(^|\/)(pages|app|screens|views)\//i.test(file.rel) || /(Page|Screen|View)\.(tsx|jsx|ts|js)$/i.test(file.name);
    const isComponentDir = /(^|\/)(components|ui|widgets|shared)\//i.test(file.rel);

    // AXIS 1 — PILAR 2: Layer Direction Check (Tier 1 Screen directly calling DB)
    if (isScreen) {
      const dbCallMatch = /\b(prisma\.\w+\.(find|create|update|delete|upsert)|db\.(select|insert|update|delete)|SELECT\s+\*\s+FROM)\b/i.exec(content);
      if (dbCallMatch) {
        structural.push({
          axis: 'structural',
          pillar: 'Pilar 2 (Direção de Camadas C3)',
          severity: 'ERROR',
          file: file.rel,
          line: getLine(content, dbCallMatch.index),
          message: `Violação de Camada: A Tela '${file.name}' (Tier 1) acessa o Banco de Dados diretamente ('${dbCallMatch[0]}'). Encapsule em um Domain Service (Tier 3).`
        });
      }
    }

    // AXIS 1 & 2 — Classes, Interfaces, Encapsulation & Deep Modules (Ousterhout Deletion Test)
    const oopRegex = /(?:export\s+)?(?:default\s+)?(abstract\s+class|class|interface)\s+(\w+)([^{]*)\{/g;
    let cm;
    while ((cm = oopRegex.exec(content)) !== null) {
      const kind = cm[1].replace(/\s+/g, ' ');
      const className = cm[2];
      const headerClause = cm[3] || '';
      const line = getLine(content, cm.index);
      const body = extractBalancedBody(content, cm.index + cm[0].length - 1);
      const archTag = parseArchTagNear(content, cm.index);

      // AXIS 2 — Semantic @arch checks
      if (!archTag) {
        semantic.push({
          axis: 'semantic',
          pillar: 'Cobertura @arch (repo-builder)',
          severity: 'INFO',
          file: file.rel,
          line,
          message: `${kind} '${className}' não possui bloco '@arch:*' (perda de economia de tokens).`
        });
      } else {
        if (kind === 'interface' && archTag.role && archTag.role !== 'interface' && archTag.role !== 'contract') {
          semantic.push({
            axis: 'semantic',
            pillar: 'Drift @arch:role vs Código',
            severity: 'WARNING',
            file: file.rel,
            line,
            message: `Interface '${className}' está anotada como '@arch:role ${archTag.role}' em vez de 'interface'.`
          });
        }
        if (kind === 'class' && archTag.role === 'interface') {
          semantic.push({
            axis: 'semantic',
            pillar: 'Drift @arch:role vs Código',
            severity: 'WARNING',
            file: file.rel,
            line,
            message: `Classe concreta '${className}' foi anotada incorretamente como '@arch:role interface'.`
          });
        }
        if ((archTag.role === 'adapter' || /(stripe|sendgrid|openai|aws|gateway)/i.test(className)) && kind === 'class' && !archTag.external) {
          semantic.push({
            axis: 'semantic',
            pillar: 'Sistema Externo Oculto (@arch:external)',
            severity: 'WARNING',
            file: file.rel,
            line,
            message: `O adaptador '${className}' parece integrar um serviço externo, mas não declara '@arch:external' para aparecer no C4 C1/C2.`
          });
        }
      }

      if (kind !== 'class') continue;

      const publicFields = [];
      const encapsulatedFields = [];
      const methods = [];

      for (const rawLine of body.split('\n')) {
        const l = rawLine.trim();
        if (!l || l.startsWith('//') || l.startsWith('*')) continue;
        const pubF = /^public\s+(?:readonly\s+)?(\w+)\s*[?:]?\s*:\s*[\w<>[\]|?]+/.exec(l);
        if (pubF && !l.includes('(')) publicFields.push(pubF[1]);
        const privF = /^(private|protected)\s+(?:readonly\s+)?(\w+)\s*[?:]?\s*:\s*[\w<>[\]|?]+/.exec(l);
        if (privF && !l.includes('(')) encapsulatedFields.push(privF[2]);
        const meth = /^(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::|\{)/.exec(l);
        if (meth && !['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(meth[1])) {
          methods.push(meth[1]);
        }
      }

      // PILAR 3A: Encapsulation check
      if (publicFields.length >= 3) {
        structural.push({
          axis: 'structural',
          pillar: 'Pilar 3 (Encapsulamento OOP & SOLID)',
          severity: 'WARNING',
          file: file.rel,
          line,
          message: `A classe '${className}' expõe ${publicFields.length} atributos públicos (${publicFields.join(', ')}). Use 'private' ou 'protected'.`
        });
      }

      // PILAR 3B: Deep Modules / Shallow Module Deletion Test (John Ousterhout)
      const nonEmptyBodyLines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('*'));
      const isPassThroughWrapper = !headerClause.includes('implements') && encapsulatedFields.length === 0 && methods.length <= 1 && nonEmptyBodyLines.length <= 5;
      if (isPassThroughWrapper) {
        structural.push({
          axis: 'structural',
          pillar: 'Pilar 3 (Deep Modules / Teste de Deleção)',
          severity: 'INFO',
          file: file.rel,
          line,
          message: `A classe '${className}' parece um Módulo Raso (sem estado encapsulado e <= 1 método trivial). Aplique o Teste de Deleção (Ousterhout).`
        });
      }
    }

    // PILAR 1 & AXIS 2: Track UI Screens & Components
    if ((isComponentDir || isScreen) && (file.ext === '.tsx' || file.ext === '.jsx')) {
      const fnRegex = /export\s+(?:function|const)\s+([A-Z]\w+)/g;
      let fm;
      while ((fm = fnRegex.exec(content)) !== null) {
        const compName = fm[1];
        const line = getLine(content, fm.index);
        const archTag = parseArchTagNear(content, fm.index);

        if (!archTag) {
          semantic.push({
            axis: 'semantic',
            pillar: 'Cobertura @arch (repo-builder)',
            severity: 'INFO',
            file: file.rel,
            line,
            message: `Componente/Tela '<${compName} />' não possui anotação '@arch:*'.`
          });
        } else if (isScreen && archTag.role && archTag.role !== 'screen') {
          semantic.push({
            axis: 'semantic',
            pillar: 'Drift @arch:role vs Código',
            severity: 'WARNING',
            file: file.rel,
            line,
            message: `'${compName}' está em diretório de Telas (${file.rel}), mas foi anotado como '@arch:role ${archTag.role}'.`
          });
        }

        if (isComponentDir) {
          declaredComponents.set(compName, { file: file.rel, line, usedCount: 0 });
        }
      }
    }
  }

  // Count JSX usage across all files for Pillar 1
  for (const file of files) {
    if (!['.tsx', '.jsx'].includes(file.ext)) continue;
    let content = '';
    try { content = fs.readFileSync(file.full, 'utf8'); } catch (e) { continue; }
    for (const [compName, info] of declaredComponents.entries()) {
      const usageRegex = new RegExp(`<${compName}\\b`, 'g');
      const matches = content.match(usageRegex);
      if (matches) info.usedCount += matches.length;
    }
  }

  for (const [compName, info] of declaredComponents.entries()) {
    if (info.usedCount === 0) {
      structural.push({
        axis: 'structural',
        pillar: 'Pilar 1 (Check-Before-Create / Reuso UI)',
        severity: 'INFO',
        file: info.file,
        line: info.line,
        message: `O componente UI '<${compName} />' não está sendo reutilizado em nenhuma tela.`
      });
    }
  }

  return {
    absRoot,
    totalFiles: files.length,
    axes: {
      structural,
      semantic
    },
    violations: [...structural, ...semantic]
  };
}

function printAxis(title, items) {
  const errs = items.filter(i => i.severity === 'ERROR').length;
  const warns = items.filter(i => i.severity === 'WARNING').length;
  const infos = items.filter(i => i.severity === 'INFO').length;
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${title}`);
  console.log(`Placar Isolado: ${errs} erro(s) | ${warns} aviso(s) | ${infos} info(s)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (items.length === 0) {
    console.log(`  ✅ Nenhum apontamento neste eixo.\n`);
    return;
  }
  for (const v of items) {
    const icon = v.severity === 'ERROR' ? '❌' : v.severity === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`  ${icon} [${v.severity}] ${v.pillar}`);
    console.log(`     📍 ${v.file}:${v.line} -> ${v.message}\n`);
  }
}

function main() {
  const target = process.argv[2] || process.cwd();
  const result = auditRepository(target);

  console.log(`\n🏛️  [repo-architect v1.1.0] Auditoria de Eixo Duplo (Dual-Axis)`);
  console.log(`📂 Repositório: ${result.absRoot} (${result.totalFiles} arquivos)\n`);

  printAxis('🏛️  EIXO 1 — SAÚDE ESTRUTURAL (Clean Architecture, Deep Modules & SOLID)', result.axes.structural);
  printAxis('🏷️  EIXO 2 — ADERÊNCIA SEMÂNTICA (@arch vs. Código Real)', result.axes.semantic);
}

if (require.main === module) {
  main();
}

module.exports = { auditRepository };
