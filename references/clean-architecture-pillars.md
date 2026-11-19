# 🏛️ Contexto Arquitetural e os 5 Pilares da Skill `repo-architect`

> **Documento de Contexto & Governança de Engenharia Assistida por IA**  
> Este documento pode ser editado, expandido ou anexado como contexto em futuras conversas com Agentes de IA para alinhar decisões de Clean Code, SOLID, Arquitetura Limpa (Clean Architecture) e integração com a tríade **`repo-architect` + `repo-builder` + `repo-visualizer`**.

---

## 1. O Problema Real: A "Entropia de Código Gerado por IA" (*AI Code Rot*)

Quando um Agente de IA programa sem uma diretriz estrutural ativa, ele otimiza para **"fazer funcionar rápido no menor número de passos imediatos"**. Ao longo das sessões, isso gera 5 patologias arquiteturais clássicas:

1. **Duplicação Silenciosa de Componentes e Funções:** A IA não verifica se já existe um `<Button />`, `<StatusBadge />` ou `formatCurrency()` no projeto; ela cria outro componente parecido ou escreve a lógica *inline* dentro da tela.
2. **Quebra Total de Encapsulamento OOP:** Por viés estatístico dos modelos de linguagem, quase todas as propriedades de classes nascem `public`, expondo estados internos, chaves de API e configurações sensíveis para qualquer módulo alterar.
3. **Acoplamento Espaguete (Violação de Camadas C3):** A IA importa o banco de dados (`prisma.order.create`) ou uma API externa (`stripe.charges`) diretamente dentro de uma Tela React (`CheckoutScreen`), pulando a camada de domínio.
4. **"God Files" (Arquivos Monolíticos):** A IA coloca a Tela, múltiplos Componentes de UI, funções de cálculo e chamadas de banco dentro de um único arquivo de 500+ linhas.
5. **Tabelas Órfãs no Banco de Dados:** Ao criar tabelas SQL ou models Prisma, a IA frequentemente cria colunas `userId: String` soltas sem declarar a chave estrangeira (`@relation` / `FOREIGN KEY`), quebrando a integridade referencial e deixando o Diagrama Entidade-Relacionamento (DER) desconectado.

---

## 2. A Tríade Simbiótica de Governança de IA

As três skills foram desenhadas sob o Princípio da Responsabilidade Única (SRP) para operarem em conjunto gastando o mínimo possível de tokens:

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

## 3. Os 5 Pilares Técnicos e Suas Justificativas

### Pilar 1: Protocolo "Check-Before-Create" (Anti-Duplicação + Economia de Tokens)
* **Regra Operacional:** Antes de criar qualquer novo Componente UI (`components/`), Função Utilitária (`utils/`) ou Serviço (`domain/`), a IA deve inspecionar o inventário existente (lendo `.arch-visualizer/arch-data.json`, listando as pastas ou buscando por `@arch:role`). Se já existir um componente ou função equivalente, a IA é **obrigada a importar e reutilizar**.
* **Justificativa:**
  * **Economia de Tokens:** Reutilizar 1 linha de `<Button />` consome 10x menos tokens de geração do que recriar um botão estilizado do zero.
  * **Métricas Visuais:** Aumenta o índice de reuso na **Aba 4 do `repo-visualizer`** e evita alertas de *"Componente UI Sem Uso Detectado"* na **Aba 6**.

### Pilar 2: Lei da Direção das Dependências (Arquitetura em Camadas C3)
* **Regra Operacional:** Todo `import` deve respeitar estritamente o sentido unidirecional das 5 camadas topológicas do modelo C3:
  * **Camada 1 (`Screens / Pages`)** $\rightarrow$ só pode importar da **Camada 2 (`UI Components`)** e **Camada 3 (`Services / UseCases / Utils`)**. *Proibido acessar Banco de Dados (`prisma.*`, SQL) ou SDKs externos direto da Tela.*
  * **Camada 2 (`UI Components`)** $\rightarrow$ componentes visuais puros (*presentational/stateless*), recebem dados via `props` e não conhecem regras de banco.
  * **Camada 3 (`Domain Services, Adapters & Utils`)** $\rightarrow$ serviços orquestram regras de negócio e dependem da **Camada 4 (`Interfaces / Contracts`)**; adaptadores implementam as interfaces da Camada 4 para conversar com APIs externas e com a **Camada 5 (`Database`)**.
  * **Camada 4 (`Interfaces & Abstract Base Entities`)** $\rightarrow$ núcleo estável; não depende de nenhuma camada externa.
* **Justificativa:**
  * Garante que o **Diagrama C3 do `repo-visualizer` nunca fique emaranhado**! Quando o código respeita camadas unidirecionais, todas as setas do diagrama fluem limpas de cima para baixo, sem dependências cíclicas.

### Pilar 3: Deep Modules (Ousterhout), Encapsulamento Estrito (*Private-First*) & Inversão de Dependência (SOLID)
* **Regra Operacional:**
  1. **Encapsulamento por Padrão:** Todo atributo interno de classe (estado, dependências injetadas, segredos, contadores, configurações) deve ser declarado como `private` (ou `protected` em classes base abstratas). Apenas métodos de negócio do contrato devem ser `public`.
  2. **Deep Modules & Teste de Deleção (*Deletion Test* — John Ousterhout):** Baseado em *A Philosophy of Software Design*, prefira **Módulos Profundos** (interfaces públicas pequenas e claras que escondem complexidade real por trás). Evite criar *Shallow Modules* (wrappers/helpers rasos que apenas repassam uma chamada sem adicionar valor). Antes de criar uma camada extra, aplique o **Teste de Deleção**: *"Se eu deletar esta classe e chamar o alvo diretamente, o código fica mais simples sem perder abstração?"*
  3. **Inversão de Dependência (DIP):** Serviços de domínio nunca acoplam diretamente em provedores externos concretos (ex.: Stripe, SendGrid, AWS S3); eles dependem de uma `interface` (ex.: `IPaymentGateway`) implementada por um Adapter (`StripeGatewayAdapter`).
* **Justificativa:**
  * Elimina os alertas de *"Quebra de Encapsulamento OOP"*, *"Módulo Raso (Teste de Deleção)"* e *"Alto Acoplamento"* na **Aba 6 do `repo-visualizer`**.
  * Torna o **Diagrama de Classes UML (Aba 3)** claro, seguro e extensível.

### Pilar 4: Padronização de Estrutura de Pastas, Anti-"God File" (SRP) & Filtro Triplo de ADRs
* **Regra Operacional:**
  * Cada arquivo deve ter uma única responsabilidade clara e morar em seu diretório semântico:
    * `src/pages/` ou `src/app/` $\rightarrow$ Telas e rotas (`Tier 1`)
    * `src/components/ui/` $\rightarrow$ Componentes visuais reutilizáveis (`Tier 2`)
    * `src/domain/` $\rightarrow$ Serviços de domínio, entidades base e interfaces/contratos (`Tiers 3 & 4`)
    * `src/adapters/` ou `src/infra/` $\rightarrow$ Implementações de gateways externos e repositórios (`Tier 3`)
    * `src/utils/` $\rightarrow$ Funções utilitárias puras e formatadores (`Tier 3`)
    * `prisma/` ou `db/` $\rightarrow$ Schemas e migrações de banco de dados (`Tier 5`)
  * **Limite Anti-Monolito:** Evitar arquivos com mais de 300 linhas ou que misturem Telas de rota com Componentes UI genéricos e classes de serviço no mesmo arquivo.
  * **Filtro Triplo de ADR (`doc/architecture/09_architecture_decisions.md`):** Só documente uma decisão como ADR no Capítulo 09 do arc42 se ela for: **(1) difícil de reverter**, **(2) surpreendente sem contexto** e **(3) envolver trade-offs reais**.
* **Justificativa:**
  * Quando cada arquivo é pequeno e coeso, nas sessões futuras a IA só precisa ler **1 arquivo de 60 linhas** em vez de um arquivo monolítico de 600 linhas, gerando economia contínua de tokens.

---

## 4. Auditoria de Eixo Duplo (*Dual-Axis Audit*)

Inspirada em revisões isoladas de alta disciplina, o validador `check_arch_rules.cjs` e a Aba 6 do `repo-visualizer` **nunca fundem as notas** em um placar único. Eles reportam dois eixos independentes:
1. **🏛️ Eixo 1 — Saúde Estrutural:** Avalia Clean Architecture, Camadas C3, Encapsulamento OOP, *Deep Modules* (*Teste de Deleção*), *God Files* e Integridade DER.
2. **🏷️ Eixo 2 — Aderência Semântica (`@arch` vs. Código Real):** Verifica se o que a IA declarou nas tags `@arch:*` corresponde à realidade do código (*Role Drift*, cobertura `@arch`, `@arch:external` ausente e status `pending`/`modified` não sincronizados).

### Pilar 5: Integridade Relacional Explícita no Banco de Dados
* **Regra Operacional:** Ao criar ou modificar tabelas (`.prisma`, `.sql`, Drizzle, TypeORM), toda coluna de chave estrangeira (`*Id` ou `*_id`) deve obrigatoriamente declarar seu vínculo relacional explícito (`@relation` no Prisma, `FOREIGN KEY ... REFERENCES` no SQL, `.references()` no Drizzle), além de `@id` / `PRIMARY KEY`.
* **Justificativa:**
  * Garante integridade referencial no banco e permite que o **Diagrama DER (Aba 2 do `repo-visualizer`)** desenhe todas as conexões Pé-de-Galinha (`1:N`, `N:1`) sem deixar tabelas órfãs.
