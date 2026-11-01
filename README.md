# exentra-ai-dev

Un entorno para programar con IA sin que se me vaya el presupuesto.

Lo armé para trabajar en Windows, con PowerShell, y para que cada tarea la haga el
modelo que le corresponde. No el más caro para todo.

## Por qué lo armé

Cuando empecé a usar IA para programar me pasaban tres cosas todo el tiempo:

- Le pedía algo simple, como renombrar una función, y me lo resolvía un modelo carísimo.
- La conversación crecía y cada mensaje costaba más que el anterior.
- El agente tocaba archivos que no tenía que tocar.

Esto ataca esas tres cosas. Reparte el trabajo entre modelos baratos y caros, mantiene
el contexto corto, y le pone límites a lo que el agente puede hacer.

## Cómo reparte el trabajo

Uso cuatro niveles. La idea es simple: el que piensa cuesta caro y se usa poco, el que
tipea cuesta barato y se usa mucho.

| Nivel | Para qué | Ejemplo |
| --- | --- | --- |
| **T0** | Buscar, mapear, resumir | "¿Dónde está la lógica de login?" |
| **T1** | Cosas mecánicas y correr testeos | "Renombrá esta función en los 8 archivos donde aparece" |
| **T2** | Escribir el código del día a día | "Armá la pantalla de facturas" |
| **T3** | Pensar, revisar y decidir | "¿Cómo guardo los pagos sin romper lo que ya anda?" |

T0 usa un modelo gratis y no gasta nada. T1, T2 y T3 usan el plan de $10.

## Los agentes

Cada agente hace una sola cosa y tiene su propio nivel asignado.

| Agente | Qué hace | Cuándo lo uso |
| --- | --- | --- |
| `exentra-dev` | Escribe el código | "Armá la pantalla de facturas" |
| `exentra-plan` | Piensa y planifica, no escribe nada | "¿Cómo organizo esto?" |
| `exentra-quick` | Cambios mecánicos | "Renombrá esto en todos lados" |
| `exentra-scout` | Mapea el código y no toca nada | "¿Dónde está el login?" |
| `exentra-reviewer` | Revisa antes de mergear | "¿Esto está bien?" |
| `exentra-security` | Busca problemas de seguridad | "¿Esto es seguro?" |
| `exentra-design` | Revisa que la pantalla no parezca plantilla | "¿Esto se ve bien?" |
| `exentra-fixer` | Aplica solo lo que el review confirmó | "Arreglá lo que encontró el review" |
| `exentra-migrator` | Migraciones de base de datos | "Agregá una columna sin romper nada" |
| `exentra-verifier` | Corre lint, build y tests | "¿Compila?" |
| `exentra-docs` | Documentación | "Escribime el README" |

Además hay tres agentes internos que no ves: generan los títulos de las sesiones, los
resúmenes y la compactación. Corren en T0, así que no cuestan nada.

## Los comandos

Cuando no quiero cambiar de agente a mano, uso un comando.

| Comando | Qué hace |
| --- | --- |
| `/fast` | Pasa la tarea a T1, para algo mecánico |
| `/deep` | Pasa la tarea a T3, para algo que necesita pensar |
| `/review` | Revisa el código antes de mergear |
| `/security` | Busca problemas de seguridad |
| `/ui` | Revisa que la interfaz no parezca una plantilla |
| `/test` | Corre los testeos |
| `/commit` | Arma el commit |
| `/ship` | Deja todo listo para subir |
| `/map` | Mapea el código antes de tocarlo |
| `/migrate` | Prepara una migración de base de datos |

## Cómo lo instalo

Necesitás OpenCode V2, Node 20 o más, y Git.

```powershell
git clone https://github.com/martinexequielgomez/exentra-ai-dev.git
cd exentra-ai-dev

# Revisa que la máquina tenga todo
.\scripts\doctor.ps1

# Lo instala en mi proyecto
.\scripts\install.ps1 -Target C:\ruta\a\mi\proyecto -Profile nextjs
```

Después abro el proyecto con OpenCode, escribo `/agents` y elijo con qué agente
trabajar.

Se puede instalar de dos formas:

| Forma | Dónde escribe | Cuándo la uso |
| --- | --- | --- |
| `-Mode project` | Solo en ese proyecto | Un proyecto concreto |
| `-Mode global` | En toda mi máquina, con backup previo | Todos mis proyectos |

Se puede correr las veces que quieras: no duplica nada y no pisa mi configuración. Si
ya tenía servidores MCP o reglas propias, las respeta y las deja como estaban.

Los perfiles de stack son `nextjs`, `web-spa`, `api`, `data` y `saas`. Se pueden
combinar: `-Profile nextjs,api`.

## Cuánto sale

**$10 por mes.** Es el plan OpenCode Go, y no hace falta cargar créditos aparte.

T0 no gasta nada porque usa un modelo gratis. Si algún día se agota la asignación de un
modelo, los gratis siguen andando, así que nunca me quedo sin nada.

Si quiero margen extra, en la página de Go se puede activar **Extra Usage**: cuando se
termina la asignación, sigue con saldo prepago en vez de cortarse.

## Cómo cuida los tokens

- La conversación se compacta sola y guarda solo lo último, no todo.
- Las salidas largas de los comandos se cortan antes de entrar al contexto.
- Los títulos y resúmenes los hace el modelo gratis.
- Las skills se cargan solo cuando la tarea las necesita.
- El mapeo del código lo hace T0 en vez del agente principal.

## Qué hace por la seguridad

- No puede leer archivos `.env`, claves `.pem`, `.key` ni credenciales.
- No puede correr comandos destructivos como `rm -rf` o `git push --force`.
- Hay un agente dedicado a revisar seguridad antes de mergear.
- Las migraciones de base de datos solo corren contra una base local. Si el host no es
  local, el agente se detiene y me pide permiso.

## Qué hay adentro

```
agents/     los agentes, uno por archivo
commands/   los comandos, con su agente y su modelo
skills/     el conocimiento que se carga solo cuando hace falta
contexts/   pedazos de configuración por tipo de proyecto
scripts/    instalador, chequeo de máquina y validador
docs/       seguridad, diseño y tokens
```

## Requisitos

- OpenCode V2
- Node.js 20 o más
- Git
- PowerShell 5.1 o más (en Windows)

Opcional: Engram para memoria, Context7 para documentación y CodeGraph para mapear el
código.

## Licencia

MIT
