## 1. Aviso na tela de login

- [x] 1.1 `src/features/auth/LoginScreen.tsx`: adicionar um aviso curto de uso pessoal
  (acesso por convite) dentro do `.login-card`, sem alterar o botão "Entrar com Google" nem o
  fluxo. Texto via React (sem HTML injetado).
- [x] 1.2 (Opcional) `src/index.css`: estilo discreto `.login-note` (texto secundário),
  reusando os tokens — só se necessário.

## 2. Qualidade

- [x] 2.1 `npm run typecheck`, `npm run lint`, `npm run build` verdes; sem recurso externo
  novo; CSP intacta.
- [ ] 2.2 Verificação manual: o aviso aparece na tela de login (claro/escuro) e o login
  continua funcionando.
