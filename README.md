# 🏛️ Repo Architect — Clean Code & Layered Architecture Guardian (`repo-architect`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-cyan.svg)](./package.json)
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
3. **🛡️ Pilar 3 — Encapsulamento Estrito (*Private-First*) & SOLID:**
   - Atributos internos de classes nascem `private` ou `protected` por padrão, e integrações externas exigem inversão de dependência via `interface` + `Adapter`.
4. **📂 Pilar 4 — Padronização de Pastas & Regra Anti-"God File" (SRP):**
   - Mantém arquivos pequenos, coesos e separados por responsabilidade (`pages/`, `components/ui/`, `domain/`, `adapters/`, `utils/`, `prisma/`), reduzindo drasticamente os tokens gastos quando a IA precisa editar um módulo.
5. **🗄️ Pilar 5 — Integridade Relacional Explícita no Banco (DER):**
   - Garante que toda coluna de chave estrangeira (`*Id` / `*_id`) declare seu relacionamento explícito (`@relation`, `REFERENCES`, `.references()`), evitando tabelas órfãs no **Diagrama DER**.

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
