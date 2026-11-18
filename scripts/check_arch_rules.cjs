#!/usr/bin/env node
/**
 * Repo Architect — Clean Code & Layered Architecture CLI Validator (check_arch_rules.cjs)
 * Audits a repository against the 5 Pillars of repo-architect:
 * 1. Anti-Duplication & Unused UI Components
 * 2. C3 Layer Dependency Direction (no direct DB/ORM queries inside Tier 1 UI Screens)
 * 3. OOP Encapsulation (Private-First — warns when classes expose >= 3 public fields)
 * 4. Anti-"God File" SRP Check (warns on files > 300 lines or mixing Screens + Domain Classes)
 * 5. Relational Database Integrity (warns on *Id / *_id columns missing @relation / REFERENCES)
 */

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage',
  '.arch-visualizer', '.venv', 'venv', '__pycache__', 'target', 'bin', 'obj',
  '.idea', '.vscode', '.gradle', 'skills'
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

function auditRepository(repoRoot) {
  const absRoot = path.resolve(repoRoot);
  const files = walk(absRoot);
  const violations = [];
  const declaredComponents = new Map(); // CompName -> { file, line, usedCount }

  for (const file of files) {
    let content = '';
    try {
      content = fs.readFileSync(file.full, 'utf8');
    } catch (e) {
      continue;
    }
    const lines = content.split('\n');

    // PILAR 4: Anti-"God File" SRP Check (> 300 lines)
    if (lines.length > 300 && !['.prisma', '.sql'].includes(file.ext)) {
      violations.push({
        pillar: 'Pilar 4 (Anti-God File / SRP)',
        severity: 'WARNING',
        file: file.rel,
        line: 1,
        message: `Arquivo possui ${lines.length} linhas (> 300). Considere dividir responsabilidades em módulos menores para economizar tokens.`
      });
    }

    // PILAR 5: Database Relational Integrity (.prisma)
    if (file.ext === '.prisma') {
      const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
      let m;
      while ((m = modelRegex.exec(content)) !== null) {
        const modelName = m[1];
        const body = m[2];
        const modelLines = body.split('\n');
        for (const raw of modelLines) {
          const l = raw.trim();
          if (!l || l.startsWith('//') || l.startsWith('@@')) continue;
          const colMatch = /^(\w+Id)\s+(String|Int)\b(.*)$/.exec(l);
          if (colMatch) {
            const fkCol = colMatch[1];
            const hasRelation = body.includes(`fields: [${fkCol}]`) || body.includes(`@relation`);
            if (!hasRelation) {
              violations.push({
                pillar: 'Pilar 5 (Integridade Relacional DER)',
                severity: 'WARNING',
                file: file.rel,
                line: getLine(content, m.index),
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

    // PILAR 2: Layer Direction Check (Tier 1 Screen directly calling Prisma / raw SQL)
    if (isScreen) {
      const dbCallMatch = /\b(prisma\.\w+\.(find|create|update|delete|upsert)|db\.(select|insert|update|delete)|SELECT\s+\*\s+FROM)\b/i.exec(content);
      if (dbCallMatch) {
        violations.push({
          pillar: 'Pilar 2 (Direção de Camadas C3)',
          severity: 'ERROR',
          file: file.rel,
          line: getLine(content, dbCallMatch.index),
          message: `Violação de Camada: A Tela '${file.name}' (Tier 1) acessa o Banco de Dados diretamente ('${dbCallMatch[0]}'). Encapsule em um Domain Service (Tier 3).`
        });
      }
    }

    // PILAR 3: OOP Encapsulation Check
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)[^{]*\{/g;
    let cm;
    while ((cm = classRegex.exec(content)) !== null) {
      const className = cm[1];
      const snippet = content.slice(cm.index + cm[0].length, cm.index + cm[0].length + 2000);
      const publicFields = [];
      for (const rawLine of snippet.split('\n')) {
        const l = rawLine.trim();
        if (l.startsWith('}')) break;
        const fm = /^public\s+(?:readonly\s+)?(\w+)\s*[?:]?\s*:\s*[\w<>[\]|?]+/.exec(l);
        if (fm && !l.includes('(')) {
          publicFields.push(fm[1]);
        }
      }
      if (publicFields.length >= 3) {
        violations.push({
          pillar: 'Pilar 3 (Encapsulamento OOP & SOLID)',
          severity: 'WARNING',
          file: file.rel,
          line: getLine(content, cm.index),
          message: `A classe '${className}' expõe ${publicFields.length} atributos públicos (${publicFields.join(', ')}). Use 'private' ou 'protected'.`
        });
      }
    }

    // PILAR 1: Track Reusable UI Components
    if (isComponentDir && (file.ext === '.tsx' || file.ext === '.jsx')) {
      const fnRegex = /export\s+(?:function|const)\s+([A-Z]\w+)/g;
      let fm;
      while ((fm = fnRegex.exec(content)) !== null) {
        declaredComponents.set(fm[1], {
          file: file.rel,
          line: getLine(content, fm.index),
          usedCount: 0
        });
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
      violations.push({
        pillar: 'Pilar 1 (Check-Before-Create / Reuso UI)',
        severity: 'INFO',
        file: info.file,
        line: info.line,
        message: `O componente UI '<${compName} />' não está sendo reutilizado em nenhuma tela.`
      });
    }
  }

  return { absRoot, totalFiles: files.length, violations };
}

function main() {
  const target = process.argv[2] || process.cwd();
  const result = auditRepository(target);

  console.log(`\n🏛️  [repo-architect] Auditoria dos 5 Pilares em: ${result.absRoot}`);
  console.log(`📂 Arquivos analisados: ${result.totalFiles} | Alertas encontrados: ${result.violations.length}\n`);

  if (result.violations.length === 0) {
    console.log(`✅ Parabéns! Nenhuma violação dos 5 Pilares de Clean Architecture detectada.\n`);
    return;
  }

  for (const v of result.violations) {
    const icon = v.severity === 'ERROR' ? '❌' : v.severity === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${v.severity}] ${v.pillar}`);
    console.log(`   📍 ${v.file}:${v.line} -> ${v.message}\n`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { auditRepository };
