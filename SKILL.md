---
name: repo-architect
description: Guardião de Arquitetura Limpa (Clean Architecture), Clean Code, SOLID, Encapsulamento OOP e Prevenção de Duplicação para Agentes de IA. Use sempre que projetar, criar, refatorar ou revisar funcionalidades, garantindo respeito às camadas C4/C3, reuso de componentes UI, encapsulamento private/protected e integridade relacional de banco de dados.
---

# Repo Architect — Guardião de Clean Code & Arquitetura em Camadas

Esta skill aplica governança estrutural preventiva enquanto o Agente de IA projeta ou escreve código, trabalhando em conjunto com **`repo-builder`** (marcação `@arch:*`) e **`repo-visualizer`** (auditoria visual C4, DER, UML e arc42).

---

## 1. Os 5 Pilares Inegociáveis (Aplicar ao Escrever Código)

### Pilar 1: "Check-Before-Create" (Anti-Duplicação)
- **Antes de criar** um novo Componente UI, Função Utilitária ou Serviço, verifique o que já existe no repositório (consulte `.arch-visualizer/arch-data.json` se existir, ou liste `src/components`, `src/utils`, `src/domain`).
- Se já existir componente ou função equivalente (ex.: `<Button />`, `<DataTable />`, `formatCurrency()`), **importe e reutilize** em vez de duplicar.

### Pilar 2: Lei da Direção de Dependências (Camadas Topológicas C3)
Todo `import` deve fluir estritamente de cima para baixo entre as 5 camadas:
1. **Tier 1 (`Screens / Pages` — `src/pages/` ou `src/app/`):** Só importa de **Tier 2 (`UI Components`)** e **Tier 3 (`Domain Services / Utils`)**. *Proibido importar clientes de banco (`prisma.*`, SQL) ou SDKs externos direto na Tela.*
2. **Tier 2 (`UI Widgets` — `src/components/ui/`):** Componentes visuais puros e reutilizáveis, orientados a `props`.
3. **Tier 3 (`Domain Services, Adapters & Utils` — `src/domain/`, `src/adapters/`, `src/utils/`):** Serviços dependem de contratos da **Tier 4**; Adaptadores implementam contratos da **Tier 4** e acessam APIs externas ou a **Tier 5 (`Database`)**.
4. **Tier 4 (`Interfaces & Abstract Entities` — `src/domain/`):** Contratos (`interface`) e classes base (`abstract class`). Não dependem de camadas externas.
5. **Tier 5 (`Database Schema` — `prisma/`, `db/`):** Modelos relacionais e tabelas.

### Pilar 3: Encapsulamento Estrito (*Private-First*) & SOLID
- **Atributos Privados por Padrão:** Em qualquer classe, declare propriedades internas, dependências injetadas e segredos como `private` (ou `protected` em classes base). Nunca exponha 3+ atributos `public` mutáveis.
- **Inversão de Dependência (DIP):** Todo serviço externo (pagamentos, e-mail, storage, IA) deve possuir uma `interface` (Tier 4) implementada por um `Adapter` (Tier 3).

### Pilar 4: Padronização de Pastas & Regra Anti-"God File" (SRP)
- Mantenha arquivos coesos (idealmente < 250 linhas).
- Nunca misture a definição de uma Tela de rota (`Tier 1`), Componentes Visuais Genéricos (`Tier 2`) e Classes de Domínio (`Tier 3`) no mesmo arquivo.

### Pilar 5: Integridade Relacional Explícita no Banco (DER)
- Toda coluna de chave estrangeira (`*Id` ou `*_id`) em Prisma, SQL, Drizzle ou TypeORM deve declarar explicitamente sua relação (`@relation`, `FOREIGN KEY ... REFERENCES` ou `.references()`), evitando tabelas órfãs no Diagrama DER.

---

## 2. Validador Rápido via CLI (`check_arch_rules.cjs`)

Após criar ou refatorar arquivos, você pode validar se os 5 Pilares foram respeitados executando:

```bash
node ~/.agents/skills/repo-architect/scripts/check_arch_rules.cjs /caminho/do/repositorio
```

---

## 3. Referência Profunda (Carregamento Sob Demanda)

- Para consultar a justificativa completa dos 5 Pilares e padrões de refatoração, leia [`references/clean-architecture-pillars.md`](./references/clean-architecture-pillars.md) apenas quando precisar planejar uma arquitetura complexa ou explicar decisões arquiteturais.
- Caso a skill **`repo-builder`** esteja instalada, anote os elementos criados com as tags `@arch:*`.
