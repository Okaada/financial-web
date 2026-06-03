## MODIFIED Requirements

### Requirement: Headers de segurança nos assets

O **Worker** (`worker/index.ts`) SHALL anexar headers de segurança às respostas de asset do
SPA (e NÃO às respostas de `/api/*`), sendo a fonte autoritativa desses headers. Os headers
SHALL incluir a **CSP completa** — incluindo `frame-ancestors 'none'`, que o `<meta>` do
HTML **não** consegue definir — além de `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy` restritivo e `X-Frame-Options: DENY`.
Não se SHALL depender de `public/_headers` (mecanismo de Cloudflare Pages, não garantido sob
Workers + Static Assets); o `<meta>` CSP do `index.html` permanece apenas como fallback para
servir estático sem o Worker.

#### Scenario: Headers presentes nas respostas do SPA

- **WHEN** o Worker serve um documento/asset do SPA (via `env.ASSETS`)
- **THEN** a resposta inclui `Content-Security-Policy` (com `frame-ancestors 'none'`),
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
  restritivo e `X-Frame-Options: DENY`

#### Scenario: frame-ancestors é entregue como header, não via meta

- **WHEN** a proteção contra enquadramento (clickjacking) é aplicada
- **THEN** `frame-ancestors 'none'` vem no header `Content-Security-Policy` da resposta (o
  `<meta>` não a define, por ser ignorada ali)

#### Scenario: Respostas de API não são tocadas

- **WHEN** o Worker encaminha uma requisição `/api/*` para a Finance API
- **THEN** a resposta do backend passa intocada (Set-Cookie, Location e demais headers), sem
  os headers de segurança do SPA serem sobrepostos
