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

| Tier | Modelo | Entrada / salida por Mtok | Incluido en Go | Para qué |
| --- | --- | --- | --- | --- |
| T0 gratis | `opencode/deepseek-v4.1-flash-free` | $0 / $0 | no consume plan | títulos, resúmenes, compactación, mapeo |
| T1 barato | `opencode-go/glm-5.3-flash` | $0.15 / $0.50 | $60/mes | cambios mecánicos, correr verificación |
| T2 caballo de batalla | `opencode-go/kimi-k2.7-code` | $0.95 / $4.00 | $60/mes | implementación diaria, diseño, fixes |
| T3 profundo | `opencode-go/kimi-k3.1-pro` | $2 / $10 | $15/mes | arquitectura, review, seguridad |

Regla: **T3 piensa, T2 escribe, T1 tipea, T0 mapea.**

Los precios salen de models.dev y cambian. Los agentes ocultos (`title`, `summary`,
`compaction`) corren siempre en T0, con el modelo gratis: mantenimiento sin costo
mientras trabajás.

El remapeo de tiers vive en el frontmatter de cada agente y en cada comando. Para
cambiar un tier, cambiás el `model:` y listo: no hay una tabla central que se pueda
desincronizar.

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

El harness corre sobre **OpenCode Go**, $10/mes. No hace falta cargar créditos.

La suscripción no es un pozo único: cada modelo tiene su propia asignación mensual en
dólares, y el plan la reparte entre todos.

| Modelo | Entrada / salida por Mtok | Incluido por mes |
| --- | --- | --- |
| GLM-5.3-Flash | $0.15 / $0.50 | $60 |
| Kimi K2.7 Code | $0.95 / $4.00 | $60 |
| Kimi K3.1 Pro | $2 / $10 | $15 |

Además hay topes por ventana: 20% de la asignación cada 5 horas, 50% semanal, 100%
mensual. Cuando un modelo se agota, los modelos gratis siguen respondiendo.

Si querés margen extra, en la página de Go se activa **Extra Usage**: al llegar al
tope, la request cae sobre tu saldo prepago en vez de cortarse. Es opcional.

Los modelos gratis funcionan sin suscripción ni saldo. Los tiers T1, T2 y T3 necesitan
Go activo; sin suscripción la API responde
`An active OpenCode Go subscription is required to use Go models`.

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
