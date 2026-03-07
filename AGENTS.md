# AGENTS.md

## Purpose

This repository is a content workspace for GenAI builders.

Given either:

- a blog post
- a fully described use case

the expected output is a matched set of assets:

1. a tutorial document under `./tutorials`
2. a full working notebook in Python
3. a full working notebook in TypeScript using the Deno kernel

The tutorial is the canonical explanation.
The notebooks are executable companions to the tutorial.

## Output Contract

For every new topic, generate all of the following:

1. `tutorials/<slug>.md`
2. `notebooks/python/<slug>.ipynb`
3. `notebooks/deno/<slug>.ipynb`

All three files must use the same base filename `<slug>`.

Example:

- `tutorials/chat-ml.md`
- `notebooks/python/chat-ml.ipynb`
- `notebooks/deno/chat-ml.ipynb`

## Workflow

When a new blog post or use case is provided:

1. Extract the core teaching goal.
2. Break the topic into clear sections.
3. Write the tutorial first.
4. Build the Python notebook from the tutorial structure.
5. Build the Deno TypeScript notebook from the same structure.
6. Ensure every notebook section maps to a concrete section in the tutorial.
7. Ensure every notebook section contains executable code, not placeholders.

## Tutorial Rules

Tutorials live under `./tutorials`.

Tutorials should:

- be concise, structured, and documentation-oriented
- explain the concept, workflow, constraints, and tradeoffs clearly
- define the sequence of examples that the notebooks will implement
- act as the source of truth for section order and naming

Tutorials should not:

- be written like a blog post with long narrative sections
- contain excessive motivational or marketing language
- rely on notebooks to explain missing conceptual steps

## Notebook Rules

Notebooks must be implementation-oriented companions to the tutorial.

Each notebook must:

- use the same topic filename as the tutorial
- have a first Markdown cell that cites the matching tutorial path
- follow the same section order as the tutorial
- make each major section a working example
- run as a practical end-to-end walkthrough of the process

Notebooks must not:

- duplicate the tutorial text verbatim
- copy long prose from the tutorial
- contain fake or placeholder execution for sections that are meant to be runnable

Instead, notebooks should:

- add technical context
- explain what the code is doing
- explain what is happening at runtime
- focus on implementation details, request/response shape, parsing, control flow, and output inspection

## Section Mapping Rule

Every meaningful tutorial section should have a corresponding notebook section.

The mapping should be:

- tutorial section explains the concept and desired behavior
- notebook section demonstrates that behavior with executable code

If a tutorial section is conceptual only, the notebook should still include a minimal technical demonstration or inspection cell related to that concept.

## Environment Rules

Only secrets belong in `.env`.

Use `.env` for values such as:

- `OPENAI_API_KEY`
- provider API keys
- other secret tokens

Do not put non-secret configuration in `.env` when it can be hard-coded in the tutorial or notebook.

Examples of values that should usually not go into `.env`:

- model names used for fixed examples
- tutorial slugs
- static URLs
- sample prompts

## API Usage Rules

For non-legacy APIs, always use provider SDKs.

Examples:

- OpenAI modern APIs: use the OpenAI SDK
- Anthropic modern APIs: use the Anthropic SDK
- other providers: use their official SDK when available

Use raw HTTP only when:

- demonstrating a legacy API
- explaining protocol details intentionally
- the SDK is unavailable or clearly unsuitable for the teaching goal

If using a legacy API, say so explicitly in the tutorial and notebooks.

## Language-Specific Rules

### Python notebooks

- place under `notebooks/python`
- use Python 3 kernel
- prefer provider SDKs for modern APIs
- keep code idiomatic and readable

### TypeScript notebooks

- place under `notebooks/deno`
- use the Deno kernel
- prefer modern `import` syntax
- prefer `npm:` imports when consuming Node ecosystem SDKs in Deno
- keep examples compatible with Deno runtime behavior

## Naming Rules

Use the same base filename across all generated assets.

Good:

- `tutorials/rag-basics.md`
- `notebooks/python/rag-basics.ipynb`
- `notebooks/deno/rag-basics.ipynb`

Bad:

- `tutorials/rag-basics.md`
- `notebooks/python/01-rag.ipynb`
- `notebooks/deno/rag-tutorial.ipynb`

## First Cell Rule

The first notebook cell must be a Markdown cell that:

- states the topic
- states the goal
- cites the matching tutorial file path

Example:

```md
# ChatML

Goal: understand how ChatML structures conversation context in practice.

Tutorial: `tutorials/chat-ml.md`
```

## Content Quality Bar

Generated assets should be:

- technically correct
- runnable
- concise
- aligned across tutorial and notebooks
- explicit about assumptions and setup

Avoid:

- prose-heavy notebook cells
- mismatched section ordering
- notebooks that reference concepts not introduced in the tutorial
- tutorials that promise examples not implemented in both notebooks

## Default Deliverable Pattern

For any new topic, default to:

1. tutorial first
2. Python notebook second
3. Deno TypeScript notebook third

The three deliverables should be reviewed together as one unit, not as unrelated files.
