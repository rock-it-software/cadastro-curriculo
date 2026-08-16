# Feature Specification: Filtrar Currículos

**Feature Branch**: `002-filtrar-curriculos`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Eu como recrutador gostaria de filtrar currículos para vaga de trabalho."

## Clarifications

### Session 2026-08-15

- Q: A busca por "Cidade" deve usar correspondência parcial ("contém") ou correspondência exata? → A: Correspondência parcial ("contém"), case/whitespace-insensitive.
- Q: Quando o download de um currículo falha (arquivo indisponível/removido), como o recrutador deve ser avisado? → A: Mensagem de feedback pontual (ex.: toast/inline) associada à linha, sem diálogo modal e sem interromper a listagem.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buscar candidatos por vaga (Priority: P1)

Como recrutador, acesso a tela de busca de candidatos e seleciono uma vaga de
interesse ("Pedreiro", "Eletricista", etc.) para ver a lista de candidatos
que se candidataram a essa vaga, sem precisar informar nenhum outro critério.

**Why this priority**: É o único critério obrigatório e o caso de uso mínimo
que já entrega valor: encontrar candidatos para uma vaga específica é o
motivo central da funcionalidade.

**Independent Test**: Pode ser testado selecionando apenas uma vaga no
filtro e verificando que a lista exibe somente candidatos que indicaram
aquela vaga entre seus interesses, ordenados por data de inclusão (mais
antigos primeiro).

**Acceptance Scenarios**:

1. **Given** a tela de busca de candidatos carregada e nenhum filtro
   selecionado, **When** o recrutador seleciona a vaga "Eletricista",
   **Then** a lista é atualizada automaticamente exibindo somente
   candidatos que indicaram "Eletricista" como vaga de interesse,
   ordenados do mais antigo para o mais recente.
2. **Given** uma vaga já selecionada, **When** o recrutador troca para outra
   vaga na mesma lista de opções, **Then** a lista é recalculada para a nova
   vaga selecionada e o resumo de filtros é atualizado.
3. **Given** nenhuma vaga selecionada, **When** a tela é carregada,
   **Then** nenhuma lista de candidatos é exibida, pois o campo "Vagas" é
   obrigatório.

---

### User Story 2 - Refinar busca por cidade e UF (Priority: P2)

Como recrutador, além da vaga, informo cidade e/ou UF para restringir a
lista de candidatos àqueles localizados na região de interesse, combinando
todos os critérios preenchidos.

**Why this priority**: Refina o resultado do fluxo principal (US1), mas
depende dele — a vaga já deve estar selecionada. Sem esses filtros a busca
ainda funciona, então é uma melhoria e não um bloqueador.

**Independent Test**: Pode ser testado selecionando uma vaga, depois
preenchendo cidade e/ou selecionando uma UF, e verificando que a lista passa
a exibir somente candidatos que atendem simultaneamente a todos os critérios
preenchidos.

**Acceptance Scenarios**:

1. **Given** uma vaga selecionada e a lista de candidatos exibida,
   **When** o recrutador digita uma cidade e sai do campo (perde o foco),
   **Then** a busca é refeita somando o critério de cidade ao de vaga, e o
   resumo de filtros passa a exibir a cidade informada.
2. **Given** uma vaga e uma cidade já selecionadas, **When** o recrutador
   seleciona uma UF no dropdown, **Then** a busca é refeita somando os três
   critérios (vaga + cidade + UF) e o resumo reflete os três filtros.
3. **Given** vaga, cidade e UF preenchidos, **When** o recrutador limpa o
   campo cidade e sai do campo, **Then** a busca é refeita considerando
   apenas vaga e UF.
4. **Given** filtros preenchidos que não correspondem a nenhum candidato,
   **When** a busca é executada, **Then** a lista exibe uma mensagem
   informando que nenhum candidato foi encontrado.

---

### User Story 3 - Baixar currículo da lista (Priority: P2)

Como recrutador, a partir da lista de candidatos filtrados, baixo o
currículo de um candidato específico clicando no ícone correspondente na
linha da tabela.

**Why this priority**: Sem essa ação a lista é apenas informativa — o
download é o que permite ao recrutador avançar no processo seletivo, mas só
faz sentido depois que uma lista (US1) já está sendo exibida.

**Independent Test**: Pode ser testado clicando no ícone "Baixar currículo"
de uma linha da lista já filtrada e verificando que o arquivo de currículo
daquele candidato é baixado.

**Acceptance Scenarios**:

1. **Given** uma lista de candidatos filtrados exibida, **When** o
   recrutador clica no ícone "Baixar currículo" de uma linha, **Then** o
   navegador baixa o arquivo de currículo original enviado por aquele
   candidato.

---

### User Story 4 - Paginar a lista de resultados (Priority: P3)

Como recrutador, navego pelos resultados filtrados em páginas, podendo
alterar quantos candidatos são exibidos por página, e vejo o total de
candidatos encontrados.

**Why this priority**: Melhora a usabilidade quando há muitos resultados,
mas o filtro (US1/US2) e o download (US3) já entregam valor completo mesmo
sem paginação avançada — na prática, com poucos candidatos, uma única
página já resolveria.

**Independent Test**: Pode ser testado aplicando um filtro que retorne mais
candidatos do que o tamanho de página atual, navegando entre páginas e
alterando a quantidade de registros por página.

**Acceptance Scenarios**:

1. **Given** um filtro que retorna mais de 20 candidatos, **When** a lista é
   exibida, **Then** somente os primeiros 20 candidatos (ordenados por data
   de inclusão, mais antigos primeiro) são exibidos, com controles para
   navegar às páginas seguintes.
2. **Given** uma lista paginada, **When** o recrutador altera a quantidade
   de registros por página, **Then** a lista é reexibida com a nova
   quantidade por página, retornando à primeira página.
3. **Given** uma lista de resultados exibida, **When** o recrutador observa
   o rodapé da tabela, **Then** vê o número total de candidatos que atendem
   aos filtros atuais.

---

### Edge Cases

- Nenhuma vaga selecionada: a lista de candidatos não é exibida (campo
  obrigatório não preenchido).
- Filtro aplicado sem nenhum candidato correspondente: a tabela exibe uma
  mensagem de "nenhum candidato encontrado" e o total de registros é zero.
- Cidade preenchida com espaços em branco ou variação de maiúsculas/minúsculas:
  a busca por cidade não deve ser sensível a caixa e deve ignorar espaços
  extras nas extremidades.
- Candidato com currículo indisponível ou removido do armazenamento: o
  download falha e o sistema exibe uma mensagem de feedback pontual (ex.:
  toast/inline) associada àquela linha, sem diálogo modal e sem interromper
  a listagem.
- Alteração de filtro enquanto uma busca anterior ainda está em andamento:
  o resultado exibido deve corresponder sempre à última combinação de
  filtros selecionada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir, na rota `/app/recrutador`, um
  formulário de busca intitulado "Buscar candidatos", acessível sem
  autenticação.
- **FR-002**: O formulário MUST oferecer um campo "Vagas" de seleção única,
  com as opções: "Pedreiro", "Ajudante de pedreiro", "Eletricista",
  "Motorista", "Cozinheiro", "Marceneiro", "Técnico em segurança do
  trabalho", "Porteiro", "Outros".
- **FR-003**: O campo "Vagas" MUST ser obrigatório para que qualquer busca
  seja executada.
- **FR-004**: O formulário MUST oferecer um campo de texto livre "Cidade",
  opcional.
- **FR-005**: O formulário MUST oferecer um campo "UF" do tipo dropdown de
  seleção única, opcional, contendo as 27 unidades federativas brasileiras.
- **FR-006**: O sistema MUST combinar (operador "E") todos os critérios
  preenchidos ao filtrar candidatos — um candidato só aparece se atender
  simultaneamente à vaga selecionada e, quando preenchidos, à cidade e à UF
  informadas.
- **FR-007**: O sistema MUST disparar uma nova busca automaticamente sempre
  que o campo "Vagas" ou o campo "UF" forem alterados.
- **FR-008**: O sistema MUST disparar uma nova busca automaticamente quando
  o campo "Cidade" perder o foco (o recrutador clicar fora do campo ou sair
  dele), e não a cada tecla digitada.
- **FR-009**: A busca por "Cidade" MUST usar correspondência parcial (um
  candidato corresponde quando o texto digitado está contido no nome da
  cidade cadastrada), MUST ser não sensível a maiúsculas e minúsculas e
  MUST ignorar espaços em branco nas extremidades do texto digitado.
- **FR-010**: O sistema MUST exibir, abaixo do formulário, um resumo textual
  dos filtros atualmente aplicados, destacando visualmente a vaga
  selecionada.
- **FR-011**: O sistema MUST exibir, abaixo do resumo de filtros, uma
  listagem em formato de tabela com os candidatos que atendem a todos os
  critérios filtrados, quando o campo "Vagas" estiver preenchido.
- **FR-012**: O sistema MUST NOT exibir nenhuma listagem de candidatos
  enquanto o campo "Vagas" não estiver preenchido.
- **FR-013**: A listagem MUST ser ordenada pela data de inclusão do
  candidato, do mais antigo para o mais recente.
- **FR-014**: Cada linha da tabela MUST exibir, nesta ordem: "Nome
  completo", "Idade", "Cidade", "UF" e um ícone de download ("Docs") na
  coluna "Baixar currículo".
- **FR-015**: O sistema MUST calcular a "Idade" exibida a partir da data de
  nascimento do candidato e da data atual.
- **FR-016**: Ao clicar no ícone "Baixar currículo" de uma linha, o sistema
  MUST iniciar o download do arquivo de currículo original daquele
  candidato.
- **FR-016a**: Se o download de um currículo falhar (ex.: arquivo
  indisponível ou removido do armazenamento), o sistema MUST exibir uma
  mensagem de feedback pontual (ex.: toast/inline) associada à linha do
  candidato, sem usar diálogo modal e sem interromper a exibição da
  listagem.
- **FR-017**: A listagem MUST ser paginada, exibindo 20 registros por
  página por padrão.
- **FR-018**: O sistema MUST permitir que o recrutador altere a quantidade
  de registros exibidos por página.
- **FR-019**: O sistema MUST exibir, ao final da tabela, o número total de
  candidatos que atendem aos critérios filtrados atualmente.
- **FR-020**: Quando nenhum candidato atender aos critérios filtrados, o
  sistema MUST exibir uma mensagem indicando que nenhum resultado foi
  encontrado, em vez de uma tabela vazia sem explicação.
- **FR-021**: Um candidato MUST ser considerado correspondente ao filtro de
  "Vagas" quando a vaga selecionada estiver entre as vagas de interesse que
  o candidato indicou no cadastro do currículo.

### Key Entities

- **Candidato (Currículo cadastrado)**: registro existente criado pela
  funcionalidade de cadastro de currículo, com nome completo, data de
  nascimento, cidade, UF, uma ou mais vagas de interesse, arquivo de
  currículo e data de inclusão. É a entidade consultada e listada por esta
  funcionalidade; nenhum novo dado é criado ou alterado nela.
- **Filtro de busca**: combinação transitória (não persistida) de vaga
  (obrigatória, única), cidade (opcional, texto) e UF (opcional, única)
  usada para restringir a listagem de candidatos exibida ao recrutador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao alterar qualquer critério do filtro, a lista de candidatos
  exibida reflete o novo resultado em até 2 segundos, sem exigir ação
  adicional do recrutador além de preencher o filtro.
- **SC-002**: Um recrutador consegue localizar todos os candidatos
  cadastrados para uma vaga específica selecionando apenas o filtro de vaga,
  sem nenhuma etapa adicional.
- **SC-003**: 100% dos cliques no ícone "Baixar currículo" resultam no
  download do arquivo de currículo correto do candidato correspondente
  àquela linha.
- **SC-004**: A listagem nunca exibe mais candidatos por página do que a
  quantidade configurada (20 por padrão, ou o valor escolhido pelo
  recrutador).
- **SC-005**: O total de candidatos exibido no rodapé da tabela corresponde
  sempre à contagem exata de candidatos que atendem aos filtros aplicados no
  momento, independentemente da página exibida.

## Assumptions

- A lista de vagas do filtro é a mesma lista de vagas de interesse
  utilizada no cadastro de currículo (mesmas nove opções), permitindo
  reaproveitar os mesmos valores armazenados.
- Um candidato pode ter indicado mais de uma vaga de interesse no cadastro;
  o filtro por "Vagas" considera correspondência quando a vaga selecionada
  está entre as vagas indicadas pelo candidato, não exigindo que seja a
  única.
- As opções de quantidade de registros por página são um conjunto pequeno e
  fixo de valores comuns (ex.: 10, 20, 50, 100), com 20 como padrão inicial.
- Como a tela não exige autenticação, qualquer pessoa com acesso à URL
  `/app/recrutador` pode consultar e baixar currículos; não há registro de
  quem realizou cada busca ou download.
- A idade exibida é calculada em anos completos, com base na data atual no
  momento da consulta.
