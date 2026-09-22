# Plan de Mejoras — FMAB RPG

**Rama:** `plan/improve-game-systems`
**Fecha:** 2026-09-21

---

## Fase 1: Integración IA (Alta Prioridad)

### 1.1 Prompt del narrador — World primer
**Archivo:** `src/engine/ai/router.ts`

El AI no sabe nada del mundo de FMAB. Agregar al system prompt:
- Geografía de Amestris (11 ubicaciones con descripciones)
- Facciones (Militar, Ishvalanos, Resistencia, Estado)
- Personajes clave (Edward, Alphonse, Mustang, Father, Homúnculos)
- Temática (alquimia, equivalencia equivalente, círculos, Puerta de la Verdad)
- Tono (culpa, determinación, peso moral, horror sobrio)

### 1.2 Prompt — Contexto completo del juego
**Archivo:** `src/engine/ai/router.ts` (buildPrompt)

Lo que falta actualmente en el prompt:
- [ ] Descripción de ubicación (no solo el ID `central_city`)
- [ ] Apariencia del personaje (cicatrices, automail, ropa)
- [ ] Habilidades del personaje
- [ ] Estados de relojes (sospecha 3/6, enfermedad 0/4)
- [ ] Reputación de facciones (militar +5, ishvalan -10)
- [ ] Condiciones de cordura
- [ ] Personalidad de compañeros (traumas, vicios)
- [ ] Detalles de NPCs (arma, personalidad, diálogo)
- [ ] Últimas 2-3 narrativas (continuidad)
- [ ] Conteo de turnos y modo de juego

### 1.3 Prompt — Eliminar duplicación
**Archivos:** `router.ts`, `prompts.ts`

- `prompts.ts` tiene prompts que nunca se usan (CHARACTER_CREATION_PROMPT, DEATH_PROMPT, INSANITY_PROMPT, VICTORY_PROMPT)
- `router.ts` tiene su propio FMAB_SYSTEM_PROMPT más débil
- **Plan:** Unificar en un solo archivo, usar los prompts especiales en el engine

### 1.4 Cascade de modelos — Lógica mejorada
**Archivo:** `src/engine/ai/router.ts`

Problemas actuales:
- Fallo en un modelo afecta a todos del mismo proveedor
- Sin timeout por request (streams pueden colgar)
- Sin validación de respuesta vacía
- Sin retry por modelo

Mejoras:
- [ ] Timeout de 30s por request (AbortController)
- [ ] Validar respuesta no vacía antes de retornar
- [ ] Conteo de fallos por modelo, no por proveedor
- [ ] Distinguir 429 (rate limit) de 500 (server error)
- [ ] Fallback a templates cuando todos los proveedores fallan

### 1.5 Narrativa — Memoria conversacional
**Archivo:** `src/engine/ai/router.ts`

- Pasar las últimas 2-3 narrativas al prompt para continuidad
- El estado `SaveData.messages` ya existe, solo necesita ser pasado a `generateNarrative`
- Agregar instrucciones de continuidad: "Recuerda lo que pasó en turnos anteriores"

### 1.6 Narrativa — Optimización de tokens
**Archivo:** `src/engine/ai/router.ts`

- [ ] Reducir `max_tokens` de 2048 a 512
- [ ] Eliminar duplicación de instrucciones (system prompt + user prompt)
- [ ] Comprimir detalles mecánicos en resumen en vez de strings crudos
- [ ] Comprimir inventario/NPCs en listas condensadas

---

## Fase 2: Sistema de Dados (Alta Prioridad)

### 2.1 Dados — Tipos unificados
**Archivos:** `src/engine/core/dice.ts`, `src/types/game.ts`

- `DiceResult` está definido en ambos archivos (duplicado)
- **Plan:** Eliminar de `dice.ts`, importar desde `types/game.ts`

### 2.2 Dados — Dificultad variable
**Archivo:** `src/engine/core/dice.ts`

- [ ] Agregar tiers de dificultad: fácil (12/9), normal (10/7), difícil (8/5), extremo (6/3)
- [ ] Cada sistema pasa su dificultad al dado
- [ ] Modificadores situacionales (terreno, clima, heridas)

### 2.3 Dados — Ventaja/Desventaja
**Archivo:** `src/engine/core/dice.ts`

- [ ] Ventaja: tirar 3d6, quitar el menor
- [ ] Desventaja: tirar 3d6, quitar el mayor
- [ ] Orígenes: sigilo (ventaja en combate), heridas graves (desventaja), clima (ventaja/desventaja)

### 2.4 Dados — Crítico y pifia
**Archivo:** `src/engine/core/dice.ts`

- [ ] Dados dobles 1-1: pifia automática + trauma
- [ ] Dados dobles 6-6: éxito crítico + beneficio extra
- [ ] Integrar con sistema de traumas existente

### 2.5 Dados — Eliminar umbral duplicado
**Archivos:** `social.ts`, `downtime.ts`

- Ambos re-calculan el resultado (10/7) en vez de usar `DiceResult.outcome`
- **Plan:** Usar directamente `dice.outcome` en vez de recalcular

---

## Fase 3: Sistemas Existentes (Media Prioridad)

### 3.1 Social — NPCs reactivos
**Archivo:** `src/engine/systems/social.ts`

- [ ] Aplicar modificador de carisma real (no hardcoded 0)
- [ ] Considerar reputación de facción al interactuar
- [ ] NPCs con personalidad afectan resistencia social
- [ ] Intimidación puede escalar a combate
- [ ] Inquire debería dar información local

### 3.2 Social — Multi-turno
**Archivo:** `src/engine/systems/social.ts`

- [ ] Negociaciones de múltiples turnos
- [ ] Actitudes persistentes (amigable/hostil/etc)
- [ ] Consecuencias de partial success (información incompleta)

### 3.3 Downtime — Mejoras
**Archivo:** `src/engine/systems/downtime.ts`

- [ ] Aplicar modificador de voluntad real (no hardcoded 0)
- [ ] Entrenamiento: permitir elegir habilidad
- [ ] Trabajo: ingresos según ubicación y habilidad
- [ ] Investigación: contenido según ubicación
- [ ] Curación: requerir recursos (medicina)
- [ ] Descanso: cooldown o rendimientos decrecientes

### 3.4 Facciones — Integración activa
**Archivo:** `src/engine/systems/factions.ts`

- [ ] Conflicto entre facciones (subir militar baja ishvalan)
- [ ] Recompensas por reputación alta (equipo, información, alianzas)
- [ ] Decaimiento pasivo de reputación con el tiempo
- [ ] Faction quests activados por umbrales de reputación
- [ ] Conectado con social y exploración

### 3.5 Clima — Persistencia y eventos
**Archivo:** `src/engine/systems/weather.ts`

- [ ] Persistencia de clima (no solo cambia al amanecer)
- [ ] Transiciones graduales (tormenta → lluvia → nublado → claro)
- [ ] Eventos por clima (inundación, rayo, niebla)
- [ ] Eliminar dual weather/environment.weather
- [ ] Agregar ubicaciones forest/coast al mapa

### 3.6 NPCs — Templates completos
**Archivo:** `src/engine/data/npcs.ts`

- [ ] Templates para las 4 ubicaciones faltantes (eastern_desert, xerxes_ruins, drachma_border, father_lair)
- [ ] NPCs únicos con nombre (Major Armstrong, Winry, Mustang, Scar)
- [ ] Sistemas de diálogos básicos
- [ ] Escalado de dificultad según progreso
- [ ] Tabla de loot con pesos aleatorios

### 3.7 Ubicaciones — Conexiones bidireccionales
**Archivo:** `src/engine/data/locations.ts`

- [ ] Auto-generar enlaces reversos
- [ ] Validación de integridad del grafo
- [ ] Alias fuzzy para `extractLocation` ("Briggs" → northern_border)
- [ ] Eventos por ubicación y hora del día
- [ ] Tablas de encuentro por ubicación

---

## Fase 4: Motor del Juego (Media Prioridad)

### 4.1 applyStateChanges — Campos faltantes
**Archivo:** `src/engine/core/state.ts`

- [ ] `money` (trabajo, sobornos)
- [ ] `social` (actitud NPC, persistencia)
- [ ] `exploration` (descubrimientos)
- [ ] `perception` (alertas activas)
- [ ] `investigation` (info descubierta)
- [ ] `resistance` (resistencia armada)
- [ ] `automailMaintained` (mantenimiento)
- [ ] `timeAdvanced` (avance de tiempo)

### 4.2 Alquimia — Efectos secundarios
**Archivo:** `src/engine/systems/alchemy.ts`

- [ ] Sanity/stress de efectos especiales sobreescribe el base (Object.assign)
- [ ] `changes.health` de alquimia sobreescribía heridas (ya arreglado pero verificar)

### 4.3 Compañeros — Interacción profunda
**Archivo:** `src/engine/systems/companions.ts`

- [ ] `checkCompanionDeath` ahora se llama (ya arreglado)
- [ ] Reclutamiento: dar a elegir entre disponibles
- [ ] Compañeros con personalidad reacciona a acciones del jugador
- [ ] Diálogos de compañeros basados en traumas/vicios

---

## Fase 5: Frontend / UX (Baja Prioridad)

### 5.1 Terminal — Efecto typewriter
**Archivo:** `src/components/ui/GameTerminal.tsx`

- [ ] Efecto de máquina de escribir para mensajes del narrador
- [ ] Indicador de typing más elaborado (no solo `_`)
- [ ] Scroll-to-bottom flotante

### 5.2 Panel de dados — Mejoras visuales
**Archivo:** `src/components/effects/DiceRoll.tsx`

- [ ] SVG de dados en vez de Unicode
- [ ] Animación de física (rebote con easing)
- [ ] Feedback visual por resultado (verde/amarillo/rojo)
- [ ] Cierre con click o Escape
- [ ] Reducir overlay a esquina, no pantalla completa

### 5.3 Relojes — Indicador de urgencia
**Archivo:** `src/components/ui/Clocks.tsx`

- [ ] Pulso/glow cuando el reloj está casi lleno
- [ ] Animación de completado
- [ ] Tooltip con descripción del reloj

### 5.4 Feedback de estado
**Archivo:** `src/app/game/page.tsx`

- [ ] Flash/toast cuando HP, estrés o facciones cambian
- [ ] Pantalla de game over con opciones
- [ ] Eliminar display duplicado de clima/hora
- [ ] Panel de NPCs interactuable (click para targetear)
- [ ] Mini-mapa o lista de conexiones de ubicación

### 5.5 Performance
**Archivos:** múltiples

- [ ] React.memo en mensajes del terminal
- [ ] Virtualización del scroll para conversaciones largas
- [ ] Debounce en auto-save
- [ ] `beforeunload` para guardar antes de cerrar

---

## Fase 6: Type Safety (Baja Prioridad)

### 6.1 Eliminar tipos duplicados
- [ ] `DiceResult` — unificar en `types/game.ts`
- [ ] `LocationData` — unificar en `types/game.ts`
- [ ] `GameStateChanges` — eliminar index signature

### 6.2 Tipos más estrictos
- [ ] `GameState.weather` → `WeatherType` union
- [ ] `GameState.timeOfDay` → `TimeOfDay` union
- [ ] `GameState.terrain` → `TerrainType` union
- [ ] `NarrativeContext.mechanicalResult` → typed
- [ ] `Item.properties` → typed per item_type

---

## Orden de Ejecución Recomendado

1. **Fase 1** (IA): Mayor impacto en calidad narrativa
2. **Fase 2** (Dados): Base para todas las demás mejoras
3. **Fase 3** (Sistemas): Profundizar mecánicas existentes
4. **Fase 4** (Motor): Completar integración entre sistemas
5. **Fase 5** (UX): Mejorar experiencia visual
6. **Fase 6** (Types): Mantenibilidad a largo plazo

---

## Estimación de Complejidad

| Fase | Archivos | Complejidad | Dependencias |
|------|----------|-------------|--------------|
| 1.1-1.3 | router.ts, prompts.ts | Media | Ninguna |
| 1.4-1.6 | router.ts | Alta | 1.1-1.3 |
| 2.1-2.5 | dice.ts, social.ts, downtime.ts | Baja | Ninguna |
| 3.1-3.2 | social.ts | Media | 2.2-2.4 |
| 3.3 | downtime.ts | Baja | 2.2-2.4 |
| 3.4 | factions.ts | Media | Ninguna |
| 3.5 | weather.ts | Baja | Ninguna |
| 3.6-3.7 | npcs.ts, locations.ts | Media | 2.2-2.4 |
| 4.1-4.3 | state.ts, alchemy.ts, companions.ts | Baja | Ninguna |
| 5.1-5.5 | Múltiples UI | Media | Ninguna |
| 6.1-6.2 | types/game.ts | Baja | Ninguna |
