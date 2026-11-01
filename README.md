# exentra-ai-dev

Un entorno de desarrollo controlado para trabajar con IA.

No es un agente más inteligente. Es un agente con reglas: qué puede tocar, quién
revisa lo que hizo, qué queda guardado y cuánto puede gastar.

Lo armé para Windows, con PowerShell, y para proyectos de verdad.

## Por qué lo armé

Cuando empecé a usar IA para programar, el código no era el problema. El problema era
que no sabía qué había pasado.

- Tocaba archivos que no le había pedido.
- Me decía "listo, funciona" y no funcionaba.
- Al día siguiente no se acordaba de nada y me hacía explicar todo otra vez.
- Un cambio de dos líneas me costaba lo mismo que una feature completa.

Un agente sin reglas escribe rápido y te deja adivinando. Esto es lo contrario.

## Qué significa "controlado"

Cinco controles. Ninguno depende de que el modelo tenga un buen día.

| Control | Cómo funciona | Qué evita |
| --- | --- | --- |
| Qué puede tocar | Permisos por archivo y por comando | Que lea un `.env` o borre una carpeta |
| Quién hace qué | Un agente por tarea, cada uno con sus permisos | Que el que escribe sea el que se aprueba |
| Qué se da por hecho | Revisor y verificador antes del commit | "Funciona" sin pruebas |
| Qué queda | Memoria entre sesiones | Explicar lo mismo cada mañana |
| Cuánto gasta | Cuatro niveles de modelo | Pagar precio caro por renombrar una variable |

## Cómo trabaja

El ciclo es siempre el mismo. No cambia según el humor del modelo.

```
entender  →  planear  →  implementar  →  verificar  →  commit
```

- **Entender**: lee lo mínimo necesario. Si no sabe dónde está algo, manda a un agente
  de mapeo en vez de llenar el contexto principal.
- **Planear**: tres bullets como máximo. Si hay una decisión de producto, pregunta y
  espera la respuesta.
- **Implementar**: una unidad de trabajo a la vez, con los tests al lado del código.
- **Verificar**: corre lint, build y tests de verdad. Si no corrió, no está terminado.
- **Commit**: uno por unidad de trabajo, en formato Conventional Commits.

El push y el merge los decido yo. El agente no publica nada por su cuenta.

## Los niveles

Uso cuatro niveles de modelo. La idea es simple: el que piensa cuesta caro y se usa
poco, el que tipea cuesta barato y se usa mucho.

| Nivel | Para qué | Ejemplo |
| --- | --- | --- |
| **T0** | Buscar, mapear, resumir | "¿Dónde está la lógica de login?" |
| **T1** | Cosas mecánicas y correr testeos | "Renombrá esta función en los 8 archivos donde aparece" |
| **T2** | Escribir el código del día a día | "Armá la pantalla de facturas" |
| **T3** | Pensar, revisar y decidir | "¿Cómo guardo los pagos sin romper lo que ya anda?" |

T0 usa un modelo gratis y no gasta nada. T1, T2 y T3 usan el plan de $10.

## Los agentes

Cada agente hace una sola cosa y tiene sus propios permisos. No hay un agente comodín
que pueda hacer todo.

| Agente | Qué hace | Edita código | Ejemplo de uso |
| --- | --- | --- | --- |
| `exentra-dev` | Escribe el código | Sí | "Armá la pantalla de facturas" |
| `exentra-plan` | Piensa y planifica | Solo `docs/plans/` | "¿Cómo organizo esto?" |
| `exentra-quick` | Cambios mecánicos | Sí | "Renombrá esto en todos lados" |
| `exentra-scout` | Mapea el código | **No** | "¿Dónde está el login?" |
| `exentra-reviewer` | Busca problemas antes de mergear | **No** | "¿Esto está bien?" |
| `exentra-security` | Busca problemas de seguridad | **No** | "¿Esto es seguro?" |
| `exentra-design` | Revisa que la pantalla no parezca plantilla | **No** | "¿Esto se ve bien?" |
| `exentra-fixer` | Aplica solo lo que el review confirmó | Sí | "Arreglá lo que encontró el review" |
| `exentra-migrator` | Migraciones de base de datos | Sí | "Agregá una columna sin romper nada" |
| `exentra-verifier` | Corre lint, build y tests | **No** | "¿Compila?" |
| `exentra-docs` | Documentación | Solo `.md` | "Escribime el README" |

Los que no editan no pueden editar: no es una instrucción que puedan ignorar, es un
permiso que el editor no les da. El que revisa no puede arreglar, y el que arregla no
puede aprobarse a sí mismo.

Además hay tres agentes internos que no ves: generan los títulos de las sesiones, los
resúmenes y la compactación. Corren en T0, así que no cuestan nada.

## Los comandos

Cuando no quiero cambiar de agente a mano, uso un comando. Cada uno fija el agente y
el nivel por mí.

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

## Lo que no puede hacer

Esto es lo que más me importa del harness. No son recomendaciones, son reglas que se
aplican antes de que el agente intente nada.

**No puede leer ni editar:**

- Archivos `.env` de cualquier carpeta. Sí puede leer `.env.example`, que no tiene
  secretos.
- Claves `.pem`, `.key` y `.p12`.
- Carpetas `.ssh`, credenciales de AWS, credenciales de `gh`, `.npmrc` y cualquier
  carpeta de credenciales.
- Nada dentro de `.git/`.

**No puede correr:**

- `rm -rf`, `Remove-Item -Recurse -Force`, `rmdir /s /q`.
- `git clean -f` y `git push --force`.
- `Invoke-Expression` sobre algo que venga de una descarga.

**Te pide permiso antes de:**

- `git reset --hard`
- `npm publish`
- `gh repo delete`
- Descargar un archivo con `curl -o`

**Las migraciones** solo corren contra una base local. Si el host no es local, el
agente se detiene y me pide permiso. Tampoco borra ni trunca datos sin un sí explícito.

## La memoria

OpenCode por sí solo olvida. Cada sesión arranca de cero y volvés a explicar lo mismo.

Con Engram instalado, el agente guarda decisiones, bugs y convenciones, y las busca
antes de preguntarme. Si cierro la sesión y vuelvo en dos semanas, la decisión de por
qué usé una tabla y no dos sigue ahí, con el motivo.

Sin Engram funciona igual, solo que sin memoria entre sesiones.

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
ya tenía servidores MCP o reglas propias, las respeta y las deja como estaban. El
bloque que compone en `AGENTS.md` está delimitado por marcadores, así que también se
puede actualizar sin romper lo demás.

Los perfiles de stack son `nextjs`, `web-spa`, `api`, `data` y `saas`. Se pueden
combinar: `-Profile nextjs,api`.

## Cómo sé que no está roto

```powershell
node scripts/validate.mjs   # estructura, agentes, permisos, conteos
.\scripts\doctor.ps1        # qué le falta a la máquina
```

El validador falla si un agente apunta a un modelo que no existe, si una regla de
permisos usa el vocabulario equivocado, o si alguien borra una denegación de secretos.
Corre en Windows y en Linux en cada push, así que un cambio que rompe el contrato no
llega a `main`.

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
