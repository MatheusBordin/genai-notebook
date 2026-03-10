# Desmistificando a IA Generativa

Se você estuda sobre IA Generativa provavelmente já ouviu termos como **agentes**, **RAG**, **tool calling**, **reasoning models**, **structured outputs**, etc. Os modelos mdoernos são facilmente confundidos como “entidades inteligentes” que conversam, decidem e executam coisas sozinhas, como se os modelos realmente agissem como humanos.

O objetivo desta postagem é **desmistificar**: mostrar o fundamento técnico que explica como a IA generativa funciona por baixo do capô — e como algumas práticas (prompts estruturados, stop sequences, chain-of-thought, etc.) são implementados nativamente, sem as abstrações dos provedores atuais.

Para isso, vamos voltar para **2021** — antes de ChatGPT, antes de abstrações modernas dominarem — e usar os conceitos e APIs da época. A partir daí, vamos conectar com os formatos modernos e como, fechando com as implicações práticas para quem constrói produtos.

> **Disclaimer:** `davinci-002` é um modelo antigo e os exemplos deste tutorial usam prompts em inglês para aumentar a acuracia.

---

# Partindo do princípio

Antes da IA generativa se popularizar como interface de conversa, ela era usada de forma muito mais direta.
Em 2021, os primeiros modelos liberados pela OpenAI eram simples: a partir de uma cadeia de palavras, o modelo completava a sentença até que um dos limites fossem atingidos (max_tokens, stop, etc).

O endpoint principal era de Text Completions, e ele foi mantido por muitos softwares modernos até poucos meses atrás (Github Copilot line suggestion, por exemplo). 

Os modelos possuiam poucas opções de configuração:
- prompt: cadeia inicial.
- temperature: funcionava da mesma forma que os modelos mais recentes, ajustando a "criatividade" do modelo.
- max_tokens: limitando o tamanho da cadeia de saída.
- frequency_penalty e presence_penalty: configurações para ajustar a penalidade a repetição de palavras.

O *output* do modelo era simples, a continuação do texto que você iniciou no Prompt. Essa simplicidade revela algo importante: o modelo não foi concebido originalmente como um “assistente conversacional”. Ele foi treinado para continuar sequências de texto da maneira mais estatisticamente provável possível, com algum grau de criatividade controlada por parâmetros.

Além disso, havia uma limitação técnica importante: a janela de contexto. Modelos como `davinci-002` trabalhavam com cerca de **4.096 tokens de contexto total**, somando prompt e resposta. Isso significa que tudo o que o modelo conseguia considerar para gerar texto precisava caber dentro desse limite. Comparado aos modelos atuais, que operam com janelas significativamente maiores, essa restrição impactava diretamente o tipo de aplicação que podia ser construída.

A operação fundamental, no entanto, já estava definida. O modelo recebia uma sequência de tokens e calculava qual deveria ser o próximo token. Repetia esse processo até atingir o limite definido.

Mesmo com todas as evoluções arquiteturais que vieram depois, o princípio permanece o mesmo: prever o próximo token com base nos anteriores. Funcionalidades como as que conhecemos hoje são a combinação de dois fatores:
1. Treinamento especializado.
2. Abstração nas camadas de API dos provedores.

---

# Chega de teoria. Vamos para o código.

Até aqui discutimos o funcionamento conceitual dos modelos. Agora é hora de observar o comportamento real da API como ela era utilizada em 2021.

Para executar os exemplos citados daqui pra frente, utilize meu Github: [GenAI Notebook](https://github.com/MatheusBordin/genai-notebook). O repositório contém notebooks Python e Typescript com cada exemplo desse post.

Vamos usar diretamente o endpoint legado da OpenAI, um dos únicos provedores a manter esse endpoint.
```
POST https://api.openai.com/v1/completions
```

## Hello World

Vamos iniciar com um simples "Ola", e ver como o modelo se comporta.

```ts
async function run() {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "davinci-002",
      prompt: "Hello",
      max_tokens: 20,
      temperature: 0.7
    })
  });

  const data = await response.json();
  console.log(data.choices[0].text);
  console.log(data.choices[0].finish_reason);
}

run();
```

Ao executar, é provável que o retorno seja algo como:

```text
, how are you?
```

Esse pequeno experimento já revela algo essencial. O modelo não “respondeu” ao seu cumprimento. Ele simplesmente **continuou o texto** fornecido. Dado o padrão aprendido durante o treinamento, após um “Hello” é comum aparecer algo como “, how are you?”. Portanto, o que parece uma resposta é, na prática, uma continuação altamente provável daquela sequência.

## Criando experiência de Conversa

A partir desse ponto surge uma pergunta natural: se o modelo apenas completa texto, como conseguimos criar a sensação de diálogo? A resposta está no próprio formato do prompt. Podemos estruturar o texto como se fosse uma conversa, utilizando prefixos como “User:” e “Assistant:”. O modelo não “vira conversacional” por causa disso — mas ele reconhece o padrão e tende a continuar naquele formato.

> Curiosidade, no final de 2022 quando a OpenAI lançou o Chat GPT, ainda não existia a API de Chat Completion.

Veja o exemplo:

```ts
async function run() {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "davinci-002",
      prompt: `
User: Hello, how are you?
Assistant:
`,
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  console.log(data.choices[0].text);
  console.log(data.choices[0].finish_reason);
}

run();
```

Uma saída comum pode ser algo como:

```text
I'm doing well! How can I help?
User: Can you explain what cloud computing is?
Assistant: Sure! Cloud computing is a model for delivering computing resources over the internet...
User: Is it secure?
Assistant:
```

O ponto aqui é bem direto: o modelo não apenas respondeu à primeira pergunta. Ele **continuou o diálogo** sozinho porque esse é um padrão recorrente nos dados de treinamento. Para ele, aquilo não é uma “conversa real com turnos controlados”; é um bloco de texto com estrutura previsível que pode ser continuado.

> Até hoje esse comportamento é usado como técnica de Prompt Engineering, o nome técnico mais conhecido no mercado é: Few Shot Examples.

Para observar esse efeito com mais clareza, vale aumentar `max_tokens` nesse experimento. Em modelos antigos, isso frequentemente faz o modelo inventar turnos extras, repetir padrões ou seguir por caminhos menos confiáveis. Para melhorar esse comportamento, podemos introduzir um mecanismo de trava no modelo.

## Mecanismo de Trava

Se queremos que o comportamento pareça mais natural — isto é, que o modelo responda apenas como “Assistant” e pare ali — precisamos impor essa trava manualmente. Em 2021, isso era feito com o parâmetro `stop`.

O ajuste fica assim:

```ts
async function run() {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "davinci-002",
      prompt: `
User: Hello, how are you?
Assistant:
`,
      max_tokens: 150,
      temperature: 0.7,
      stop: ["User:"]
    })
  });

  const data = await response.json();
  console.log(data.choices[0].text);
  console.log(data.choices[0].finish_reason);
}

run();
```

Agora a saída tende a ser apenas:

```text
I'm doing well! How can I help?
```

O modelo não “aprendeu a parar”. O modelo é interrompido quando detectado a sequência definida em `stop`. Esse detalhe é fundamental: o controle de turno é imposto externamente pela aplicação. Nos modelos mais recentes, ele é automático.

Na prática, vale observar também o campo `finish_reason`:
- `length`: a resposta parou porque atingiu o limite de tokens
- `stop`: a resposta parou porque encontrou uma sequência definida em `stop`

Essa comparação é importante porque mostra a diferença entre:
- um encerramento causado por limite artificial de tamanho
- um encerramento causado por uma regra explícita da aplicação

## Padronização é a alma do mecanismo

Para tornar esse processo mais estruturado, surgiu o **ChatML (Chat Markup Language)**, um padrão de formatação que organiza mensagens em blocos delimitados por marcadores específicos como `<|im_start|>` e `<|im_end|>`. A documentação oficial descreve esse formato e sua aplicação nas APIs modernas de chat.

> Infelizmente, alguns anos atrás a OpenAI fechou a evolução do ChatML, tornando-a um desenvolvimento interno. Desde então, temos pouco acesso a evolução do formato. O último link que tive acesso foi: https://github.com/openai/openai-python/blob/release-v0.28.0/chatml.md

A grande sacada do ChatML é transformar uma “conversa” em texto com delimitadores claros, e usar `stop` para cortar a geração no ponto certo. Um exemplo (simulando o formato com o endpoint de completions) fica assim:

```ts
async function run() {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "davinci-002",
      prompt: `
<|im_start|>system
You are a helpful assistant.
<|im_end|>
<|im_start|>user
Explain what cloud computing is.
<|im_end|>
<|im_start|>assistant
`,
      max_tokens: 300,
      temperature: 0.7,
      stop: ["<|im_end|>"]
    })
  });

  const data = await response.json();
  console.log(data.choices[0].text);
  console.log(data.choices[0].finish_reason);
}

run();
```

A estrutura delimita claramente cada mensagem, e o parâmetro `stop` garante que a geração seja encerrada ao final do bloco do assistant. O modelo, por sua vez, continua fazendo o que sempre fez: gerar texto a partir do contexto — só que agora o contexto está muito melhor estruturado.

---

# O que é IA e o que é abstração?

Quando planejei essa postagem, queria passar uma mensagem: os modelos de IA Generativo como consumimos hoje possuem mais Engenharia de Software do que a maior parte dos profissionais de TI imaginam. Recursos como: memória, saída estruturada e tool calling são abstrações construídas ao redor dos modelos e incorporadas de forma nativa nas APIs modernas.

No entanto, esses mecanismos evoluíram drasticamente quando passaram a ser incorporados no processo de pre-training dos modelos. Técnicas de treinamento como fine-tuning supervisionado e aprendizado por reforço com feedback humano (RLHF) tornaram as saídas mais úteis, coerentes e contextualizadas. Os próprios modelos passaram a incorporar algumas arquiteturas que foram antes sugeridas pela comunidade, o exemplo disso é a arquitetura **Mixture of Experts (MoE)**, que permitiu expandir a capacidade e eficiência ao ativar subconjuntos especializados de parâmetros conforme a tarefa (Muito similar a uma arquitetura de Roteamento de multi-agentes).

Além disso, os modelos passaram a ser treinados explicitamente para responder de maneira conversacional, seguir instruções complexas e estruturar melhor suas saídas. O comportamento que hoje percebemos como “natural” ou “inteligente” é resultado de um treinamento direcionado e de uma engenharia cuidadosa sobre grandes volumes de dados.

Mais recentemente, surgiram padrões ainda mais estruturados, como o **Harmony Response Format**, usado inicialmente nos modelos GPT-OSS da OpenAI. O novo padrão consegue representar mensagens em canais distintos (por exemplo, separando raciocínio intermediário da resposta final). Se quiser se aprofundar no assunto, este é o [link](https://developers.openai.com/cookbook/articles/openai-harmony/) para a documentação oficial.

Mesmo com todas essas evoluções, o funcionamento fundamental continua sendo a geração sequencial condicionada ao contexto disponível. É exatamente essa base que permite que técnicas avançadas funcionem tão bem.

Um exemplo recente é o artigo científico “Prompt Repetition Improves Non-Reasoning LLMs”** ([arXiv, 2025](https://arxiv.org/abs/2512.14982)). Os autores mostram que simplesmente repetir o prompt — concatenando a mesma instrução duas vezes — melhora de forma consistente o desempenho em tarefas complexas para diversos modelos, reforçando instruções e padrões relevantes ao longo da sequência.

O mesmo raciocínio ajuda a explicar o sucesso da técnica de [Chain-of-Thought (cadeia de pensamento)](https://www.promptingguide.ai/techniques/cot). Quando pedimos que o modelo resolva um problema passo a passo, expandimos o contexto antes da conclusão final. Cada etapa intermediária passa a integrar o contexto que influencia a geração subsequente, enriquecendo a qualidade da resposta.

Modelos de *reasoning* exploram esse princípio de forma ainda mais sofisticada. Ao produzir etapas intermediárias estruturadas antes da resposta final, ampliam a coerência e a consistência da saída. Esse comportamento decorre da forma como o contexto acumulado influencia a geração seguinte, reduzindo ambiguidades e ajudando a “ancorar” a resposta em uma sequência lógica.

Compreender esse funcionamento é essencial para tomar melhores decisões na construção de aplicações que usam modelos de IA Generativa. Quando entendemos como o modelo opera, conseguimos estruturar melhor prompts, projetar melhores sistemas e aplicar as técnicas mais adequadas.

Esse é o primeiro post de uma sequência onde pretendo mostrar como essas técnicas avançadas podem ser construídas do zero, combinando IA Generativa com Engenharia de Software. Ao fim, espero que isso nos leve a discutir e testar novas abordagens eficiêntes para roteamento de Agentes, memórias de longa duração, tool search e etc.
