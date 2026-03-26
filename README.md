# Obsidian Planner

Planner personal multi-usuario con calendario, gestión de tareas y seguimiento financiero. Incluye una REST API para integraciones externas.

**Live:** [calendario.exegestion.com](https://calendario.exegestion.com)
**API:** [api.exegestion.com](https://api.exegestion.com)

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Base de datos | Supabase (Postgres + Auth + RLS) |
| Deploy frontend | Cloudflare Workers (static assets) |
| Deploy API | Cloudflare Workers |
| Autenticación | Google OAuth / Email via Supabase Auth |

---

## Funcionalidades

- **Calendario** tipo Google Calendar — vista mensual con tareas y chips financieros por día
- **Panel de día** — agregar/completar/eliminar tareas y registrar gastos/ingresos
- **Reporte mensual** — resumen financiero con totales, tasa de ahorro y breakdown por categoría
- **Multi-usuario** — cada usuario ve solo sus propios datos (Row Level Security en Supabase)
- **REST API** — integración con herramientas externas via API key

---

## Estructura del proyecto

```
09-calendario-personal/
├── src/
│   ├── components/
│   │   ├── AuthGate.jsx        # Pantalla de login (Google + email/password)
│   │   ├── BigCalendar.jsx     # Calendario mensual principal
│   │   ├── DayPanel.jsx        # Panel lateral del día seleccionado
│   │   ├── MonthlyReport.jsx   # Reporte financiero mensual
│   │   └── Settings.jsx        # Gestión de API key
│   ├── contexts/
│   │   └── AuthContext.jsx     # Proveedor de autenticación
│   ├── hooks/
│   │   └── useData.js          # Hook principal de datos (tasks + expenses)
│   ├── lib/
│   │   ├── supabase.js         # Cliente Supabase
│   │   └── db.js               # Helpers CRUD (tasks, expenses, api_keys)
│   ├── App.jsx                 # Layout principal + sidebar
│   └── index.css               # Design system (variables, keyframes, clases)
├── api-worker/                 # Cloudflare Worker — REST API
│   ├── src/index.js
│   └── wrangler.toml
├── wrangler.toml               # Config deploy frontend
└── .env.local                  # Variables de entorno (no commiteado)
```

---

## Setup local

### 1. Clonar e instalar

```bash
git clone https://github.com/execriss/obsidian-planner
cd obsidian-planner
npm install
```

### 2. Variables de entorno

Crear `.env.local` en la raíz:

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Base de datos (Supabase)

Ejecutar las migraciones en orden desde el Supabase SQL Editor:

```sql
-- Tabla de tareas
CREATE TABLE tasks (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text       text        NOT NULL,
  done       boolean     DEFAULT false NOT NULL,
  priority   text        DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  category   text        DEFAULT 'Personal',
  date       date        NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabla de gastos/ingresos
CREATE TABLE expenses (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        text        NOT NULL CHECK (type IN ('income','expense')),
  amount      numeric     NOT NULL,
  description text        NOT NULL,
  category    text        DEFAULT 'Otro',
  date        date        NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Tabla de API keys
CREATE TABLE api_keys (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_key    text        DEFAULT encode(gen_random_bytes(32), 'hex') NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies tasks
CREATE POLICY "tasks: user access" ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies expenses
CREATE POLICY "expenses: user access" ON expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies api_keys
CREATE POLICY "api_keys: user access" ON api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 4. Auth — Google OAuth

En Supabase → Authentication → Providers → Google:
- Activar Google
- Completar Client ID y Client Secret desde [Google Cloud Console](https://console.cloud.google.com/)
- Authorized JavaScript Origins: `http://localhost:5173`
- Authorized Redirect URIs: `https://<project-id>.supabase.co/auth/v1/callback`

### 5. Correr en desarrollo

```bash
npm run dev
```

---

## Deploy

### Frontend (Cloudflare Workers)

```bash
npm run build
npx wrangler deploy
```

El `wrangler.toml` ya está configurado para el dominio `calendario.exegestion.com`.

### API (Cloudflare Workers)

```bash
cd api-worker
npm install

# Configurar secrets
echo "https://..." | npx wrangler secret put SUPABASE_URL
echo "eyJ..."      | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

npx wrangler deploy
```

---

## REST API

Base URL: `https://api.exegestion.com`

Documentación interactiva disponible en `GET /`.

### Autenticación

Todas las rutas requieren un API key generada desde Ajustes en la app:

```
Authorization: Bearer <api-key>
```

### Endpoints

#### Tareas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/tasks` | Listar tareas |
| `POST` | `/tasks` | Crear tarea |
| `PATCH` | `/tasks/:id` | Actualizar tarea |
| `DELETE` | `/tasks/:id` | Eliminar tarea |

**Filtros disponibles en `GET /tasks`:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `date` | string | Fecha exacta `YYYY-MM-DD` |
| `date_from` | string | Desde fecha |
| `date_to` | string | Hasta fecha |
| `done` | boolean | `true` completadas / `false` pendientes |
| `priority` | string | `high` · `medium` · `low` |
| `category` | string | Nombre de categoría |
| `limit` | number | Máximo de resultados |

**Crear tarea — body:**
```json
{
  "text":     "Ir al gym",
  "date":     "2026-03-26",
  "priority": "high",
  "category": "Salud"
}
```

**Actualizar tarea — body (campos opcionales):**
```json
{
  "done":     true,
  "text":     "Nuevo texto",
  "priority": "low",
  "date":     "2026-03-27"
}
```

#### Gastos e Ingresos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/expenses` | Listar movimientos |
| `POST` | `/expenses` | Registrar gasto/ingreso |
| `DELETE` | `/expenses/:id` | Eliminar movimiento |

**Filtros disponibles en `GET /expenses`:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `date` | string | Fecha exacta |
| `date_from` / `date_to` | string | Rango de fechas |
| `type` | string | `income` o `expense` |
| `category` | string | Nombre de categoría |
| `limit` | number | Máximo de resultados |

**Crear movimiento — body:**
```json
{
  "type":        "expense",
  "amount":      1500,
  "description": "Almuerzo",
  "category":    "Alimentación",
  "date":        "2026-03-26"
}
```

#### Resúmenes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/summary/today` | Tareas + finanzas del día |
| `GET` | `/summary/monthly?year=2026&month=3` | Reporte mensual completo |

**Respuesta `GET /summary/today`:**
```json
{
  "data": {
    "date": "2026-03-26",
    "tasks": {
      "total": 3,
      "pending": 1,
      "done": 2,
      "items": [...]
    },
    "finances": {
      "income": 50000,
      "expense": 1500,
      "balance": 48500,
      "items": [...]
    }
  }
}
```

**Respuesta `GET /summary/monthly`:**
```json
{
  "data": {
    "year": 2026,
    "month": 3,
    "finances": {
      "income": 150000,
      "expense": 45000,
      "balance": 105000,
      "saving_rate": 70.0,
      "by_category": {
        "income":  [{ "category": "Salario", "amount": 150000 }],
        "expense": [{ "category": "Alimentación", "amount": 20000 }]
      }
    },
    "tasks": {
      "total": 22,
      "done": 18,
      "pending": 4
    }
  }
}
```

### Ejemplos rápidos

```bash
# Listar tareas pendientes de hoy
curl "https://api.exegestion.com/tasks?date=2026-03-26&done=false" \
  -H "Authorization: Bearer <api-key>"

# Crear una tarea
curl -X POST https://api.exegestion.com/tasks \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Estudiar inglés","date":"2026-03-26","priority":"high"}'

# Marcar tarea como completada
curl -X PATCH https://api.exegestion.com/tasks/<id> \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

# Registrar un gasto
curl -X POST https://api.exegestion.com/expenses \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"type":"expense","amount":1500,"description":"Almuerzo","date":"2026-03-26"}'

# Resumen del mes
curl "https://api.exegestion.com/summary/monthly?year=2026&month=3" \
  -H "Authorization: Bearer <api-key>"
```

### Formato de errores

```json
{ "error": "Mensaje descriptivo del error" }
```

| Código | Significado |
|---|---|
| `401` | API key ausente o inválida |
| `400` | Datos inválidos o campos requeridos faltantes |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |
