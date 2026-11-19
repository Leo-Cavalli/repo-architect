# 🏛️ Repo Architect — Clean Code, Deep Modules & Dual-Axis Guardian (`repo-architect` v1.1.0)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Version: 1.1.0](https://img.shields.io/badge/Version-1.1.0-cyan.svg)](./package.json)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-emerald.svg)](#)
[![Triad Ecosystem](https://img.shields.io/badge/Ecosystem-repo--architect_%2B_builder_%2B_visualizer-purple.svg)](https://github.com/Leo-Cavalli/repo-visualizer)

**Impeça que a IA degrade a arquitetura do seu projeto ao longo do tempo.**  
O `repo-architect` é uma **Skill Open Source de Governança Arquitetural e Clean Code** para Agentes de IA (Google Antigravity, Gemini CLI, Claude Code, Cursor, Windsurf, Cline). Ele atua de forma **preventiva** enquanto a IA programa, aplicando 5 Pilares baseados em **Clean Architecture, SOLID, Encapsulamento OOP e Prevenção de Duplicação**, além de incluir um **Validador CLI (`check_arch_rules.cjs`)** sem dependências externas.

---

## 🤝 A Tríade de Governança para Agentes de IA

O `repo-architect` fecha o ciclo completo de engenharia de software assistida por IA junto com o **[`repo-builder`](https://github.com/Leo-Cavalli/repo-builder)** e o **[`repo-visualizer`](https://github.com/Leo-Cavalli/repo-visualizer)**:

```text
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│     1. repo-architect     │      │      2. repo-builder      │      │    3. repo-visualizer     │
│        (PREVENÇÃO)        │ ───► │        (INDEXAÇÃO)        │ ───► │    (AUDITORIA VISUAL)     │
├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
│ • Check-Before-Create     │      │ • Anota código em tempo   │      │ • Diagramas C4 (C1-C4)    │
│ • Direção de Camadas C3   │      │   de escrita com @arch:*  │      │ • Diagrama de Banco (DER) │
│ • Encapsulamento SOLID    │      │ • Economiza até 90% de    │      │ • Diagrama Classes (UML)  │
│ • Regra Anti-"God File"   │      │   tokens em leituras      │      │ • Mapa de Reuso de UI     │
│ • Integridade Relacional  │      │   futuras                 │      │ • Editor arc42 + PDF      │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## 🏛️ Os 5 Pilares do `repo-architect`

1. **🔍 Pilar 1 — Protocolo "Check-Before-Create" (Anti-Duplicação):**
   - Obriga a IA a verificar componentes UI (`src/components/`), funções utilitárias (`src/utils/`) e serviços (`src/domain/`) existentes antes de criar novos, aumentando o reuso e economizando tokens.
2. **📐 Pilar 2 — Lei da Direção das Dependências (Camadas Topológicas C3):**
   - Impõe fluxo unidirecional estrito (`Tier 1: Screens` $\rightarrow$ `Tier 2: UI Widgets` / `Tier 3: Domain Services & Adapters` $\rightarrow$ `Tier 4: Interfaces & Contracts` / `Tier 5: Database`). Proíbe telas de acessarem o banco ou SDKs externos diretamente, mantendo o **Diagrama C3 do `repo-visualizer` sempre limpo e desemaranhado**.
3. **🛡️ Pilar 3 — Deep Modules (Ousterhout), Encapsulamento (*Private-First*) & SOLID:**
   - Atributos internos de classes nascem `private` ou `protected` por padrão; integrações externas exigem `interface` + `Adapter`; e o **Teste de Deleção** (*A Philosophy of Software Design*) bloqueia *Shallow Modules* (wrappers rasos sem valor).
4. **📂 Pilar 4 — Padronização de Pastas, Anti-"God File" (SRP) & Filtro Triplo de ADRs:**
   - Mantém arquivos pequenos e coesos (`pages/`, `components/ui/`, `domain/`, `adapters/`, `utils/`, `prisma/`) e aplica o **Filtro Triplo de ADR** (difícil de reverter + surpreendente sem contexto + trade-offs reais) para o Capítulo 09 do arc42.
5. **🗄️ Pilar 5 — Integridade Relacional Explícita no Banco (DER):**
   - Garante que toda coluna de chave estrangeira (`*Id` / `*_id`) declare seu relacionamento explícito (`@relation`, `REFERENCES`, `.references()`), evitando tabelas órfãs no **Diagrama DER**.

---

## ⚖️ Validador CLI de Eixo Duplo (*Dual-Axis Audit* — `check_arch_rules.cjs`)

O validador `check_arch_rules.cjs` **nunca mistura placares** — ele reporta dois eixos independentes:
- **🏛️ EIXO 1 — Saúde Estrutural:** Violações de camada C3, Encapsulamento OOP, *Shallow Modules* (*Teste de Deleção*), *God Files* (> 300 linhas), componentes UI sem uso e FKs órfãs no DER.
- **🏷️ EIXO 2 — Aderência Semântica (`@arch` vs. Código Real):** Cobertura de tags `@arch:*`, *Role Drift* (tag contradizendo o código real), `@arch:external` ausente em adaptadores e tags `pending`/`modified` aguardando sincronização no `repo-visualizer`.

---

## 🚀 Como Instalar na sua IA

### Opção 1: Via `npx skills` (Recomendado)
```bash
npx skills add Leo-Cavalli/repo-architect
```

### Opção 2: Via `git clone` direto na pasta de Skills da sua IA

- **Google Antigravity / Cursor / Windsurf / Agentes padrão `.agents`:**
  ```bash
  git clone https://github.com/Leo-Cavalli/repo-architect.git ~/.agents/skills/repo-architect
  ```

- **Gemini CLI:**
  ```bash
  git clone https://github.com/Leo-Cavalli/repo-architect.git ~/.gemini/skills/repo-architect
  ```

---

## 💻 Usando o Validador CLI (`check_arch_rules.cjs`)

Além de guiar a IA durante a geração de código, o `repo-architect` inclui um script CLI ultrarrápido (Zero Dependências, apenas Node.js) que audita qualquer repositório contra os 5 Pilares:

```bash
node ~/.agents/skills/repo-architect/scripts/check_arch_rules.cjs /caminho/do/seu/projeto
```

O validador verifica automaticamente:
- Violações de camada (ex.: Tela importando Prisma/SQL direto).
- Quebras de encapsulamento OOP (classes com excesso de atributos `public`).
- Arquivos monolíticos (*God Files* > 300 linhas).
- Chaves estrangeiras órfãs no banco de dados sem `@relation` / `REFERENCES`.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
