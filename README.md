# FMAB RPG - Fullmetal Alchemist: Brotherhood Text RPG

## Descripción
RPG narrativo de texto ambientado en la fantasía oscura militar de Fullmetal Alchemist: Brotherhood.

## Características
- Sistema de dados 2D6 (Powered by the Apocalypse)
- Alquimia con Intercambio Equivalente
- Salud localizada, Automail, Estrés y Cordura
- Facciones y Sospecha Militar
- Modo Hardcore Permanente
- IA Narrativa (Groq + OpenRouter)
- Base de datos TiDB Cloud

## Stack
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- MySQL2 (TiDB)
- Groq SDK + OpenAI (OpenRouter)

## Instalación
\`\`\`bash
npm install
npm run db:init
npm run dev
\`\`\`

## Variables de Entorno
\`\`\`env
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=mysql://...@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/fmab
\`\`\`

## Estructura
\`\`\`
FMAB/
├── src/
│   ├── app/           # Páginas Next.js (App Router)
│   ├── engine/        # Motor del juego
│   │   ├── core/      # Núcleo (dados, estado, relojes, input)
│   │   ├── systems/   # 15 sistemas mecánicos
│   │   ├── ai/        # Integración IA
│   │   └── data/      # Catálogos (materiales, ubicaciones, NPCs)
│   ├── components/    # Componentes React
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilidades (DB, IA, Guardado)
│   └── types/         # Tipos TypeScript
├── scripts/           # Scripts de inicialización
├── saves/             # Guardados locales (backup)
└── public/            # Assets estáticos
\`\`\`

## Modos de Juego
- **Libertad** (Principal): Sandbox total, creación libre
- **Historia Original**: Lineal, personaje predefinido

## Sistema de Dados
- 2D6 + Atributo
- 10+: Éxito Completo
- 7-9: Éxito con Costo
- ≤6: Fallo / Consecuencia Dura

## Guardado Hardcore
- No se puede recargar si mueres
- Guarda automático cada turno importante
- Historial de decisiones permanente