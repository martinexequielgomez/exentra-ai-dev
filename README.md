# exentra-ai-dev

Un entorno de desarrollo controlado sobre OpenCode V2. Cada tarea va al modelo que
le corresponde, el contexto se mantiene chico y el gasto de tokens queda acotado por
diseño, no por suerte.

Windows primero. También corre en macOS y Linux.

## El problema

Trabajar con IA en un proyecto real se rompe siempre en los mismos tres lugares:

| Problema | Qué pasa en la práctica | Cómo lo resuelve el harness |
| --- | --- | --- |
| Un solo modelo para todo | Pagás precio de modelo caro para renombrar una variable, o usás uno barato para decidir una arquitectura | Cuatro tiers: el pensamiento es caro, el tipeo es barato |
| El contexto crece sin control | Cada paso reenvía la historia completa y el costo por turno se multiplica | Compactación agresiva, límite de salida de herramientas, agentes ocultos gratis |
| El agente hace de más | Sin reglas toca archivos que no debía, inventa comandos, rompe la base | Permisos por recurso, contrato explícito, revisores de solo lectura |

## Cómo funciona

```
tarea
  │
  ├── ¿hay que pensar?    →  T3   arquitectura · review · seguridad
  ├── ¿hay que escribir?  →  T2   implementación diaria
  ├── ¿es mecánico?       →  T1   rename · formato · correr tests
  └── ¿es solo buscar?    →  T0   mapear código · títulos · resumen
```

La escalada es explícita: cambiás de agente, o usás `/fast` y `/deep` sobre la misma
tarea. El tier profundo piensa y devuelve un plan; no escribe el código.

## Tiers de modelo

| Tier | Modelo | Entrada / salida por Mtok | Para qué |
| --- | --- | --- | --- |
| T0 gratis | `opencode/deepseek-v4.1-flash-free` | $0 / $0 | títulos, resúmenes, compactación, mapeo |
| T1 barato | `opencode/deepseek-v4.1-flash` | $0.30 / $1.20 | cambios mecánicos, correr verificación |
| T2 caballo de batalla | `opencode/claude-sonnet-5-5` | $2 / $10 | implementación diaria, auditoría de diseño |
| T3 profundo | `opencode/claude-opus-5-5` | $4 / $20 | arquitectura, review, seguridad |

Regla: **T3 piensa, T2 escribe, T1 tipea, T0 mapea.**

Los precios salen de models.dev y cambian. Los agentes ocultos (`title`, `summary`,
`compaction`) corren siempre en T0: mantenimiento gratis mientras trabajás.

## Agentes (11)

| Agente | Modo | Tier | Para qué |
| --- | --- | --- | --- |
| `exentra-dev` | primary | T2 | Implementación por defecto |
| `exentra-plan` | primary | T3 | Arquitectura y planes, solo lectura |
| `exentra-quick` | primary | T1 | Cambios mecánicos |
| `exentra-scout` | subagent | T0 | Mapeo de código, solo lectura |
| `exentra-reviewer` | subagent | T3 | Hallazgos ordenados por severidad |
| `exentra-security` | subagent | T3 | AuthZ, secretos, aislamiento entre inquilinos |
| `exentra-design` | subagent | T2 | Auditoría de interfaz contra el sistema de diseño |
| `exentra-fixer` | subagent | T2 | Aplica solo hallazgos confirmados |
| `exentra-migrator` | subagent | T2 | Cambios de esquema, backfill y rollback, solo local |
| `exentra-verifier` | subagent | T1 | Corre lint/build/test y reporta la salida exacta |
| `exentra-docs` | subagent | T2 | README, ADRs, documentación de API |

Cada agente tiene su propio modelo, sus propios límites de pasos y sus propios
permisos. No hay un agente comodín que pueda hacer todo.

## Comandos (10)

`/fast` · `/deep` · `/review` · `/security` · `/ui` · `/test` · `/commit` · `/ship` · `/map` · `/migrate`

Cada comando fija agente y modelo. Escalás una tarea puntual sin tocar configuración.

## Optimización de tokens

| Palanca | Valor | Efecto |
| --- | --- | --- |
| `compaction.keep.tokens` | 12000 | Cola literal más chica después de compactar |
| `compaction.buffer` | 15% | Margen para que la compactación nunca desborde |
| `experimental.background_compaction` | `true` | Compacta sin bloquear el turno |
| `tool_output.max_lines` | 800 | Corta volcados de 5000 líneas |
| `tool_output.max_bytes` | 30000 | Corta salidas enormes de un solo comando |
| Agentes ocultos | T0 | Títulos, resúmenes y compactación a costo cero |
| Skills | on demand | Se carga solo la que coincide con la tarea |
| Contextos | por proyecto | Se compone el stack que usás, no los cinco |
| Delegación | `exentra-scout` | El hilo principal no se llena mapeando archivos |

El detalle completo está en `docs/TOKENS.md`.

## Instalación

```powershell
git clone https://github.com/martinexequielgomez/exentra-ai-dev.git
cd exentra-ai-dev

# Revisa la máquina antes de instalar
.\scripts\doctor.ps1

# Instala en un proyecto
.\scripts\install.ps1 -Target C:\ruta\al\proyecto -Profile nextjs
```

| Modo | Dónde escribe | Cuándo usarlo |
| --- | --- | --- |
| `-Mode project` (default) | `<proyecto>\.opencode` y `<proyecto>\opencode.jsonc` | Un proyecto concreto |
| `-Mode global` | Configuración del usuario, con backup previo | Todos tus proyectos |

El instalador es idempotente: correrlo dos veces da el mismo resultado. No pisa tu
configuración: fusiona reglas y deja tus MCP y tus denegaciones como estaban. El
bloque que compone en `AGENTS.md` está delimitado por marcadores
`<!-- exentra-ai-dev:begin -->` y `<!-- exentra-ai-dev:end -->`.

Perfiles de stack disponibles: `nextjs`, `web-spa`, `api`, `data`, `saas`. Podés
combinar varios: `-Profile nextjs,api`.

Después abrís el proyecto con OpenCode y elegís agente con `/agents`.

## Costos

Los modelos gratis funcionan sin saldo. Los tiers T1, T2 y T3 necesitan que la cuenta
tenga fondos, porque son modelos pagos. Sin saldo, la API responde
`Insufficient account funds` y el agente no arranca.

Hay dos formas de pagar, y no cubren lo mismo:

| Vía | Cómo funciona | Qué modelos te da |
| --- | --- | --- |
| Console, pago por uso | Cargás créditos ($10, $50, $100 o el monto que quieras) y pagás por token consumido | Todos, incluidos `claude-sonnet-5-5` y `claude-opus-5-5` |
| OpenCode Go | Suscripción de $10/mes con límite de uso incluido | Modelos abiertos: DeepSeek V4.1 Flash, GLM-5.3, Qwen3.8 Max, Kimi, Claude Haiku 5.5. **No incluye Sonnet 5.5 ni Opus 5.5** |

Con créditos, el harness funciona tal como está diseñado. Con Go, los tiers T2 y T3
hay que remapearlos a los modelos que incluye la suscripción.

Para no llevarte una sorpresa, en el Console podés fijar un presupuesto mensual en
dólares, por workspace o por miembro: cuando el gasto llega al tope, las requests se
cortan solas.

## Verificación

```powershell
node scripts/validate.mjs   # estructura, agentes, permisos, conteos
.\scripts\doctor.ps1        # entorno, herramientas, proyecto
```

`validate.mjs` falla si un agente declara un modelo inexistente, si una regla de
permisos usa el vocabulario equivocado, o si falta una denegación de secretos. El
workflow de `.github/workflows/validate.yml` corre lo mismo en Ubuntu y Windows.

## Estructura

```
agents/     definiciones de agente (markdown + frontmatter)
commands/   comandos con agente y modelo fijados
skills/     un SKILL.md por skill, con referencias cuando hace falta
contexts/   fragmentos de stack que se componen en el AGENTS.md del proyecto
scripts/    install, doctor, validate
docs/       SECURITY, DESIGN, TOKENS
```

## Requisitos

- OpenCode V2
- Node.js 20+
- Git
- PowerShell 5.1 o superior (Windows)
- Opcional: Engram (memoria), Context7 (documentación), CodeGraph (mapeo de código)

## Licencia

MIT
