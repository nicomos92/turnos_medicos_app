# Sistema de Gestion de Turnos para Consultorios Medicos

MVP SaaS con Next.js App Router, TypeScript, Tailwind y Supabase (PostgreSQL + Auth + RLS).

## Inicio rapido
1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` (si venias con una version anterior, conviene resetear DB antes).
3. Copia `.env.example` a `.env.local` y completa keys.
4. Corre:

```bash
npm install
npm run dev
```

Primer login: la app auto-crea perfil, establecimiento inicial, membresia y datos demo.

## Variables de entorno
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Auth (Supabase)
1. Habilita `Email/Password`.
2. Opcional: Google OAuth.
3. Redirect URLs:
- `http://localhost:3000/app/dashboard`
- `http://127.0.0.1:3000/app/dashboard`

## Modulos incluidos
- Login/Signup + OAuth Google
- Dashboard
- Turnos con consultorio
- Profesionales + disponibilidad semanal
- Pacientes + obra social
- Visitas medicas (historial), adjuntos por URL, control de importes
- Establecimientos + consultorios
- Roles y membresias multi-establecimiento en DB

## SQL
- `supabase/schema.sql`: esquema completo con RLS, roles, membresias y nuevas entidades.
- `supabase/seed.sql`: dataset demo ampliado.

## Build
```bash
npm run build
```
