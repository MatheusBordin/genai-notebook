# GenAI Notebook

Documentation-first Jupyter workspace for GenAI builders.

## Purpose

This repository is organized as focused notebooks.
Each notebook should explain one concept with executable examples.

## Project Structure

```text
.
|-- .env.example
|-- .nvmrc
|-- install-kernel.mjs
|-- notebooks/
|   |-- deno/
|   |   `-- 01-chat-ml.ipynb
|   `-- python/
|       `-- 01-chat-ml.ipynb
|-- package.json
|-- requirements.txt
`-- start-jupyter.mjs
```

## Runtimes

- Deno notebooks for modern JavaScript and TypeScript syntax
- Python notebooks for Python-based examples

## Requirements

- Python 3.13+
- Node.js 20.x
- `nvm` recommended

## Setup

### 1. Use the project Node version

```bash
source ~/.nvm/nvm.sh
nvm use
```

### 2. Create the Python environment

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

### 3. Install Node dependencies

```bash
npm install
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Set `OPENAI_API_KEY` in `.env`.

### 5. Install Deno locally

```bash
export DENO_INSTALL="$PWD/.deno"
curl -fsSL https://deno.land/install.sh | sh
```

### 6. Register the Deno kernel

```bash
npm run install:kernel
```

### 7. Start Jupyter

```bash
npm run notebook
```

or:

```bash
npm run lab
```

`start-jupyter.mjs` loads `.env` once at startup, so all notebook kernels inherit the same environment variables automatically.

## Current Notebooks

- [Deno ChatML notebook](./notebooks/deno/01-chat-ml.ipynb)
- [Python ChatML notebook](./notebooks/python/01-chat-ml.ipynb)
