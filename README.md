# Choponet

Red social del chisme dominicano. PWA estática hosteada en GitHub Pages, con backend en Firebase (Auth + Firestore).

## Stack

- HTML + CSS + JavaScript vanilla (sin build step, sin frameworks)
- Firebase Auth (anónimo + email/password con email ficticio)
- Firestore (tiempo real con `onSnapshot`)
- PWA (manifest + service worker)

## Estructura

```
choponet/
├── index.html              SPA shell
├── manifest.json           PWA manifest
├── service-worker.js       Cache offline básico
├── firestore.rules         Reglas de seguridad (pegar en Firebase Console)
├── css/
│   ├── base.css            Reset
│   ├── theme.css           Variables (colores, espacios)
│   ├── layout.css          Estructura general
│   └── components/         Estilos por feature
├── js/
│   ├── main.js             Bootstrap + wiring
│   ├── router.js           SPA routing hash-based
│   ├── firebase-config.js  Init Firebase
│   ├── auth/               Login/registro/nick generator
│   ├── posts/              Service + view de posts
│   ├── replies/            Service + view de respuestas anidadas
│   ├── reactions/          Service + view de reacciones emoji
│   └── ui/                 Helpers UI (toast, view-manager)
└── icons/                  Iconos PWA
```

**Principio modular:** un archivo, una responsabilidad.

## Setup en Firebase Console

Antes de que la app funcione necesitas activar 3 cosas en tu proyecto Firebase (`testfire-27c40`):

### 1. Habilitar Authentication
1. Ve a **Authentication** → **Sign-in method**
2. Habilita **Anonymous**
3. Habilita **Email/Password** (NO el de "Email link")

### 2. Habilitar Firestore Database
1. Ve a **Firestore Database** → **Create database**
2. Modo: **production**
3. Ubicación: la más cercana (ej. `us-east4`)

### 3. Pegar las Security Rules
1. Ve a **Firestore Database** → **Rules**
2. Copia el contenido de `firestore.rules` (en este repo)
3. Pégalo y dale **Publish**

## Probar local

Como usamos ES modules, abrir `index.html` directo no funciona — necesitas un servidor local. Cualquiera de estos sirve:

```bash
# Opción A — Python (viene preinstalado en muchos sistemas)
python -m http.server 5500

# Opción B — Node
npx serve .

# Opción C — VS Code: extensión "Live Server" → click derecho en index.html → "Open with Live Server"
```

Luego abre http://localhost:5500 (o el puerto que use serve).

## Deploy a GitHub Pages

1. `git init && git add . && git commit -m "Initial choponet MVP"`
2. Crea un repo en GitHub y haz push
3. En GitHub: **Settings** → **Pages** → Source: `main` branch / root
4. Espera ~1 minuto y entra a `https://<tu-usuario>.github.io/<repo>/`

> **Importante:** Si el sitio queda en `https://user.github.io/choponet/`, el `start_url` y `scope` del manifest funcionan tal cual porque usan rutas relativas (`./`).

## Iconos PWA

Coloca `icon-192.png` y `icon-512.png` en `icons/`. Generadores recomendados:
- https://realfavicongenerator.net
- https://www.pwabuilder.com/imageGenerator

## Notificaciones in-app

Cada usuario tiene una inbox personal en `choponet_users/{uid}/notifications/{notifId}`. Las notifs se generan automáticamente desde el cliente cuando:

- Alguien responde tu chisme → `type: 'reply'`
- Alguien responde tu comentario → `type: 'reply-to-reply'`
- Alguien reacciona a tu chisme → `type: 'reaction-post'`
- Alguien reacciona a tu comentario → `type: 'reaction-reply'`

Reglas: solo el dueño de la inbox puede leer/marcar/borrar; cualquier user con profile choponet puede crear notifs (con su uid firmando como actor) excepto en su propia inbox.

⚠️ **Si actualizas el proyecto** y ya tenías rules publicadas: hay que re-publicar las nuevas rules (con el bloque de `notifications` añadido) para que las notifs no fallen con permission-denied. Ver paso "Pegar las Security Rules" arriba.

## Modelo de datos (Firestore)

> **Nota:** todas las colecciones usan el prefijo `choponet_` porque el proyecto Firebase (`testfire-27c40`) está compartido con otra app. Las reglas exigen tener un doc en `choponet_users/{uid}` para acceder a las demás colecciones — esto aísla las sesiones autenticadas de la otra app.

```
choponet_meta/guestCounter
  └─ count: number       (autoincremental para Chopo#N)

choponet_users/{uid}
  ├─ nick: string
  ├─ isGuest: boolean
  └─ createdAt: timestamp

choponet_posts/{postId}
  ├─ authorUid, authorNick
  ├─ text: string
  ├─ createdAt
  ├─ reactionCounts: { "🔥": 12, ... }
  └─ replyCount: number

choponet_posts/{postId}/replies/{replyId}
  ├─ authorUid, authorNick
  ├─ text
  ├─ parentReplyId: string | null
  ├─ createdAt
  ├─ reactionCounts, replyCount

choponet_posts/{postId}/reactions/{uid}_{emoji}
  └─ uid, emoji, createdAt

choponet_posts/{postId}/replies/{replyId}/reactions/{uid}_{emoji}
  └─ uid, emoji, createdAt

choponet_users/{uid}/notifications/{notifId}
  ├─ type: 'reply' | 'reply-to-reply' | 'reaction-post' | 'reaction-reply'
  ├─ actorUid, actorNick
  ├─ postId
  ├─ replyId: string | null
  ├─ emoji: string | null
  ├─ snippet: string
  ├─ createdAt
  └─ read: boolean
```

## Roadmap post-MVP (ideas para iterar)

- [ ] Edición/borrado de posts propios desde la UI
- [ ] Filtros del feed (más populares, más recientes, hashtags)
- [ ] Tendencias y trending de emojis
- [ ] Imágenes en posts (Firebase Storage)
- [ ] Notificaciones cuando alguien responde a tu chisme
- [ ] Reportar contenido / moderación
- [ ] Tema claro
- [ ] Migrar de proyecto `testfire-27c40` a un proyecto Firebase dedicado `choponet`

## Troubleshooting

- **Error "Missing or insufficient permissions"**: las Security Rules no están publicadas o están mal copiadas.
- **Error "Firebase: Error (auth/operation-not-allowed)"**: no habilitaste Anonymous o Email/Password en Authentication.
- **El service worker da 404**: estás abriendo `index.html` por `file://`. Usa un servidor local.
- **Error "The query requires an index"** al abrir un hashtag**: la primera vez que se filtre por tag, Firestore necesita un índice compuesto sobre `hashtags` (array-contains) + `createdAt` (desc). El error que muestra Firebase incluye un link directo — click ahí, **Create index**, espera ~1 minuto a que se construya, y refresca.
- **Error "The query requires an index"** al activar el sort "Calientes"**: Firestore también necesita un índice compuesto sobre `reactionTotal` (desc) + `createdAt` (desc). Mismo flujo: link en el error → Create index → esperar.
