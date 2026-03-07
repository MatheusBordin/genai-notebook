# Desmistificando a IA Generativa
## Uma volta para 2021 para entender o que realmente está acontecendo

Se você acompanha o mercado de tecnologia, provavelmente já ouviu termos como **agentes**, **RAG**, **tool calling**, **reasoning models**, **LLM** e **SLM**. Às vezes parece que estamos falando de “entidades inteligentes” que conversam, decidem e executam coisas sozinhas.

O objetivo desta postagem é **desmistificar sem diminuir**: mostrar o fundamento técnico que explica por que a IA generativa funciona tão bem — e por que algumas práticas (prompts estruturados, stop sequences, chain-of-thought, etc.) melhoram tanto os resultados.

Para isso, vamos voltar para **2021** — antes de ChatGPT “virar padrão”, antes de abstrações modernas dominarem — e usar os conceitos e APIs da época (o endpoint de **Completion**). A partir daí, vamos conectar com os formatos modernos (ChatML e padrões mais recentes como Harmony), fechando com as implicações práticas para quem constrói produtos.

---

# Parte 1 — Antes do ChatGPT

Antes da IA generativa se popularizar como interface de conversa, ela era usada de forma muito mais direta.

Em 2021, a API da OpenAI era simples: você enviava um texto e recebia outro texto como continuação.

O endpoint principal era `/v1/completions`.  
Você passava um `prompt`, escolhia um modelo e ajustava alguns poucos parâmetros — como `temperature`, `max_tokens`, penalidades de repetição (`frequency_penalty`, `presence_penalty`) e sequências de parada (`stop`).

O modelo então gerava texto a partir daquele ponto.

Essa simplicidade revela algo importante: o modelo não foi concebido originalmente como um “assistente conversacional”. Ele foi treinado para continuar sequências de texto da maneira mais estatisticamente provável possível, com algum grau de criatividade controlada por parâmetros.

Os modelos da época também eram mais segmentados em termos de capacidade. Você tinha versões como `text-davinci-002`, mais fortes em linguagem natural e criatividade. Modelos como `curie`, `babbage` e `ada` eram menores, mais baratos e menos capazes. Cada um tinha um perfil de desempenho diferente, mas todos compartilhavam a mesma essência técnica.

Além disso, havia uma limitação técnica importante: a janela de contexto. Modelos como `text-davinci-002` trabalhavam com cerca de **4.096 tokens de contexto total**, somando prompt e resposta. Isso significa que tudo o que o modelo conseguia considerar para gerar texto precisava caber dentro desse limite. Comparado aos modelos atuais, que operam com janelas significativamente maiores, essa restrição impactava diretamente o tipo de aplicação que podia ser construída.

A operação fundamental, no entanto, já estava definida. O modelo recebia uma sequência de tokens e calculava qual deveria ser o próximo token. Repetia esse processo até atingir o limite definido.

Mesmo com todas as evoluções arquiteturais que vieram depois, o princípio permanece o mesmo: prever o próximo token com base nos anteriores. O que mudou foi a qualidade da previsão e a escala dos modelos, não a natureza do processo.

---

# Parte 2 — Chega de teoria. Vamos para o código.

Até aqui discutimos o funcionamento conceitual dos modelos. Agora é hora de observar o comportamento real da API como ela era utilizada em 2021.

Para rodar os exemplos, gere uma API key na plataforma da OpenAI:

https://platform.openai.com/account/api-keys

Depois exporte sua chave (ou use um `.env`):

```bash
export OPENAI_API_KEY="sua_chave_aqui"
```

Vamos usar diretamente o endpoint legado:

```
POST https://api.openai.com/v1/completions
```

## Primeiro experimento: apenas um “Olá”

Abaixo está um exemplo em TypeScript realizando a chamada manualmente via HTTP.

> **Nota:** o código usa `node-fetch`. Se você estiver em Node 18+ pode usar `fetch` nativo e remover a dependência.

Instale dependências:

```bash
npm install node-fetch dotenv
```

Crie `completion.ts`:

```ts
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-davinci-002",
      prompt: "Olá",
      max_tokens: 20,
      temperature: 0.7
    })
  });

  const data = await response.json();
  console.log(data.choices[0].text);
}

run();
```

Ao executar, é bastante provável que o retorno seja algo como:

```text
, tudo bem?
```

Esse pequeno experimento já revela algo essencial. O modelo não “respondeu” ao seu cumprimento. Ele simplesmente **continuou o texto** fornecido. Dado o padrão aprendido durante o treinamento, após “Olá” é comum aparecer “, tudo bem?”. Portanto, o que parece uma resposta é, na prática, uma continuação altamente provável daquela sequência.

## Transformando texto em algo que parece conversa

A partir desse ponto surge uma pergunta natural: se o modelo apenas completa texto, como conseguimos criar a sensação de diálogo? A resposta está no próprio formato do prompt. Podemos estruturar o texto como se fosse uma conversa, utilizando prefixos como “User:” e “Assistant:”. O modelo não “vira conversacional” por causa disso — mas ele reconhece o padrão e tende a continuar naquele formato.

Veja o exemplo:

```ts
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-davinci-002",
      prompt: `
User: Olá, tudo bem?
Assistant:
`,
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  console.log(data.choices[0].text);
}

run();
```

Uma saída comum pode ser algo como:

```text
Tudo bem! Como posso ajudar?
User: Você pode me explicar o que é computação em nuvem?
Assistant: Claro! Computação em nuvem é um modelo de entrega de recursos de TI pela internet...
User: E isso é seguro?
Assistant:
```

O ponto aqui é bem direto: o modelo não apenas respondeu à primeira pergunta. Ele **continuou o diálogo** sozinho porque esse é um padrão recorrente nos dados de treinamento. Para ele, aquilo não é uma “conversa real com turnos controlados”; é um bloco de texto com estrutura previsível que pode ser continuado.

## Controlando o encerramento com `stop`

Se queremos que o comportamento pareça mais natural — isto é, que o modelo responda apenas como “Assistant” e pare ali — precisamos impor essa regra manualmente. Em 2021, isso era feito com o parâmetro `stop`.

O ajuste fica assim:

```ts
body: JSON.stringify({
  model: "text-davinci-002",
  prompt: `
User: Olá, tudo bem?
Assistant:
`,
  max_tokens: 150,
  temperature: 0.7,
  stop: ["User:"]
})
```

Agora a saída tende a ser apenas:

```text
Tudo bem! Como posso ajudar?
```

O modelo não “aprendeu a parar”. A API interrompe a geração quando detecta a sequência definida em `stop`. Esse detalhe é fundamental: o controle de turno é imposto externamente pela aplicação.

## A evolução do formato: nasce o ChatML

Para tornar esse processo mais estruturado, surgiu o **ChatML (Chat Markup Language)**, um padrão de formatação que organiza mensagens em blocos delimitados por marcadores específicos como `<|im_start|>` e `<|im_end|>`. A documentação oficial descreve esse formato e sua aplicação nas APIs modernas de chat (se quiser se aprofundar: https://platform.openai.com/docs/guides/text-generation/chat-completions-api).

A grande sacada do ChatML é transformar uma “conversa” em texto com delimitadores claros, e usar `stop` para cortar a geração no ponto certo. Um exemplo (simulando o formato com o endpoint de completions) fica assim:

```ts
body: JSON.stringify({
  model: "text-davinci-002",
  prompt: `
<|im_start|>system
Você é um assistente útil.
<|im_end|>
<|im_start|>user
Explique o que é computação em nuvem.
<|im_end|>
<|im_start|>assistant
`,
  max_tokens: 150,
  temperature: 0.7,
  stop: ["<|im_end|>"]
})
```

A estrutura delimita claramente cada mensagem, e o parâmetro `stop` garante que a geração seja encerrada ao final do bloco do assistant. O modelo, por sua vez, continua fazendo o que sempre fez: gerar texto a partir do contexto — só que agora o contexto está muito melhor estruturado.

---

# Parte 3 — Conclusão: o que realmente evoluiu (e o que permanece como base)

Ao longo desta postagem, voltamos para 2021 para entender como a IA generativa funciona na sua essência. Vimos o endpoint de `completions`, observamos o comportamento do modelo continuando texto e simulamos diálogos estruturando manualmente o prompt. Também exploramos como o ChatML surgiu como um padrão textual mais organizado para estruturar conversas.

Agora é hora de fechar o raciocínio.

Desde 2021, a evolução foi significativa. Os modelos ficaram maiores, mais robustos, mais alinhados e muito mais capazes. Técnicas de treinamento como fine-tuning supervisionado e aprendizado por reforço com feedback humano (RLHF) tornaram as respostas mais úteis, coerentes e contextualizadas. Arquiteturas modernas, como **Mixture of Experts (MoE)**, permitiram expandir capacidade e eficiência ao ativar subconjuntos especializados de parâmetros conforme a tarefa.

Além disso, os modelos passaram a ser treinados explicitamente para responder de maneira conversacional, seguir instruções complexas e estruturar melhor suas saídas. O comportamento que hoje percebemos como “natural” ou “inteligente” é resultado de um treinamento direcionado e de uma engenharia cuidadosa sobre grandes volumes de dados.

Em paralelo, as APIs evoluíram drasticamente. Saímos de um simples `prompt` textual para abstrações como Chat Completions e Responses API. Essas interfaces organizam mensagens, delimitam turnos e oferecem mecanismos de controle mais sofisticados. O ChatML foi um passo importante nesse processo, introduzindo marcações como `<|im_start|>` e `<|im_end|>` para estruturar conversas de forma previsível.

Mais recentemente, surgiram padrões ainda mais estruturados, como o **Harmony Response Format**, usado em modelos e stacks modernas para representar mensagens e saídas em canais distintos (por exemplo, separando raciocínio intermediário da resposta final). Se você quiser ler um material técnico direto sobre isso, um bom ponto de partida é o artigo “OpenAI Harmony” no cookbook: https://developers.openai.com/cookbook/articles/openai-harmony/

Mesmo com todas essas evoluções, o funcionamento fundamental continua sendo a geração sequencial condicionada ao contexto disponível. É exatamente essa base que permite que técnicas avançadas funcionem tão bem.

Um exemplo recente é o artigo científico **“Prompt Repetition Improves Non-Reasoning LLMs”** (arXiv, 2025). Os autores mostram que simplesmente repetir o prompt — concatenando a mesma instrução duas vezes — melhora de forma consistente o desempenho em tarefas complexas para diversos modelos, reforçando instruções e padrões relevantes ao longo da sequência (ref.: https://arxiv.org/abs/2512.14982).

O mesmo raciocínio ajuda a explicar o sucesso da técnica de **Chain-of-Thought (cadeia de pensamento)**. Quando pedimos que o modelo resolva um problema passo a passo, expandimos o contexto antes da conclusão final. Cada etapa intermediária passa a integrar o contexto que influencia a geração subsequente, enriquecendo a qualidade da resposta.

Modelos de *reasoning* exploram esse princípio de forma ainda mais sofisticada. Ao produzir etapas intermediárias estruturadas antes da resposta final, ampliam a coerência e a consistência da saída. Esse comportamento decorre da forma como o contexto acumulado influencia a geração seguinte, reduzindo ambiguidades e ajudando a “ancorar” a resposta em uma sequência lógica.

Compreender essa base não diminui a IA generativa. Pelo contrário, fortalece nossa capacidade de utilizá-la com precisão. Quando entendemos como o modelo opera, conseguimos estruturar melhor prompts, projetar melhores sistemas e aplicar técnicas como repetição estratégica, cadeia de pensamento e delimitação formal de contexto de forma consciente.

A IA generativa evoluiu enormemente. Os modelos estão mais sofisticados, as arquiteturas mais eficientes e as APIs mais poderosas. Mas o fio condutor que conecta 2021 aos modelos atuais permanece o mesmo: geração sequencial baseada em contexto.

