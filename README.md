# AutoGestão Pro — Sistema de Gestão para Oficinas Mecânicas

Sistema web desenvolvido como projeto final da Residência Tecnológica (**Bolsa Futuro Digital / UFRGS / HBR**), utilizando arquitetura Full Stack multi-oficinas (*multi-tenancy*).

## Tecnologias

### Frontend
- React.js
- JavaScript (ES6+)
- Vite
- React Router DOM & Context API
- HTML5 & CSS3

### Backend
- Node.js
- Express.js
- JavaScript
- `pg` (node-postgres)
- `dotenv` & `cors`

### Banco de dados
- PostgreSQL (Relacional)

### Versionamento
- Git
- GitHub
- Conventional Commits

---

## Estrutura do projeto

```text
autogestao-pro/
├── .gitignore
├── README.md
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── backend/
    ├── server.js
    └── package.json
