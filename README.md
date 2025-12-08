# MCPForge

**Build Model Context Protocol servers visually — no code required.**

MCPForge is a no-code builder for creating MCP (Model Context Protocol) servers. Define tools, configure schemas, and export production-ready Python code in minutes.

---

## Features

- 🎨 **Visual Schema Builder** — No raw JSON editing
- 📦 **14 Pre-built Templates** — Common tools ready to use
- 👁️ **Live Code Preview** — See generated code in real-time
- ✅ **Validation** — Catch errors before export
- 🌙 **Dark Mode** — Easy on the eyes
- 💾 **Project Backup** — Export/import as JSON
- 🚀 **One-Click Export** — Download working MCP server

---

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sanmay266/MCP_Builder.git
   cd MCP_Builder
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open** http://localhost:3000

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.

### Quick Deploy

1. **Database**: Sign up at [Neon](https://neon.tech) and create a PostgreSQL database
2. **Backend**: Deploy to [Render](https://render.com) using `backend/render.yaml`
3. **Frontend**: Deploy to [Vercel](https://vercel.com) with one click

---

## Usage

1. **Create a Project** — Give it a name
2. **Add Tools** — Use templates or create custom
3. **Configure** — Define input/output schemas visually
4. **Preview** — See generated Python code live
5. **Export** — Download complete MCP server

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Python 3.11+
- **Database**: PostgreSQL (Neon) / SQLite (local)
- **Deployment**: Vercel (frontend), Render (backend)

---

## Project Structure

```
MCP_Builder/
├── frontend/          # Next.js frontend
│   ├── app/          # Pages and layouts
│   ├── src/          # Components and utilities
│   └── public/       # Static assets
├── backend/          # FastAPI backend
│   └── app/          # API routes and models
├── DEPLOYMENT.md     # Deployment guide
├── PRODUCTION_READY.md  # Production checklist
└── PHASE_2_PLAN.md   # Future features roadmap
```

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```env
DATABASE_URL=sqlite:///./mcpforge.db
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

---

## API Endpoints

- `GET /` — API info
- `GET /health` — Health check
- `GET /health/db` — Database health
- `GET /projects` — List projects
- `POST /projects` — Create project
- `GET /projects/{id}` — Get project
- `DELETE /projects/{id}` — Delete project
- `GET /projects/{id}/export` — Export server ZIP
- `GET /projects/{id}/export-json` — Backup as JSON
- `POST /projects/import-json` — Import from JSON

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Roadmap

See [PHASE_2_PLAN.md](PHASE_2_PLAN.md) for upcoming features:

- 🧪 Tool Testing Simulator
- 🐛 MCP Message Debugger
- 🔄 Hot Reload
- 🤖 AI-Powered Suggestions
- 🌐 Browser Runtime

---

## License

MIT License - see LICENSE file for details

---

## Support

- 📖 [MCP Documentation](https://github.com/modelcontextprotocol)
- 🐛 [Report Issues](https://github.com/Sanmay266/MCP_Builder/issues)
- 💬 [Discussions](https://github.com/Sanmay266/MCP_Builder/discussions)

---

## Acknowledgments

Built with ❤️ for the MCP community
