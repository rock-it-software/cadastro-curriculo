# Feature Specification: Adicionar campo Bairro

**Feature Branch**: `003-add-bairro-field`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Create field \"Bairro\" in form, grid and filter. Field is string non nullable with max of 100 characters. Also, create a script that inserts \"bairro\" to existing records in database based on the city. Bairro means \"Neighborhood\" so add neighborhoods of \"Recife\" to a record where \"Recife\" is the city and so on."

## Amendments to Prior Features

This feature adds a new field alongside the existing "Cidade" field introduced in
[001-cadastro-curriculo](../001-cadastro-curriculo/spec.md) (FR-012, FR-012b) and
consumed by the filter in
[002-filtrar-curriculos](../002-filtrar-curriculos/spec.md) (FR-004, FR-006,
FR-008, FR-009). Those requirements remain true as written; this spec is
additive and only changes *where* "Bairro" sits relative to "Cidade" on
screen — no existing FR in 001 or 002 is edited or removed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Informar bairro ao cadastrar currículo (Priority: P1)

Como candidato, ao preencher o formulário de cadastro de currículo, informo
meu bairro de residência, em um campo posicionado imediatamente antes do
campo "Cidade".

**Why this priority**: É o ponto de entrada do dado — sem essa captura, não
existe bairro para exibir na grade ou usar no filtro do recrutador. É
pré-requisito para as demais histórias.

**Independent Test**: Pode ser testado preenchendo o formulário de cadastro
sem informar o bairro e verificando que o envio é bloqueado com a mesma
mensagem de erro genérica já usada para outros campos obrigatórios ausentes;
em seguida, preenchendo o bairro e confirmando que o cadastro é salvo com
sucesso.

**Acceptance Scenarios**:

1. **Given** o formulário de cadastro carregado, **When** o candidato observa
   os campos do formulário, **Then** o campo "Bairro" aparece imediatamente
   antes do campo "Cidade".
2. **Given** todos os campos preenchidos exceto "Bairro", **When** o
   candidato tenta enviar o formulário, **Then** o envio é bloqueado e a
   mensagem "Preencha todos os campos" é exibida, do mesmo modo que hoje
   ocorre para "Cidade" ausente.
3. **Given** um bairro com mais de 100 caracteres digitado, **When** o
   candidato tenta enviar o formulário, **Then** o envio é bloqueado pela
   mesma validação de tamanho máximo já aplicada a "Cidade".
4. **Given** todos os campos, incluindo "Bairro", preenchidos corretamente,
   **When** o candidato envia o formulário, **Then** o cadastro é salvo com
   sucesso, incluindo o bairro informado.

---

### User Story 2 - Filtrar candidatos por bairro (Priority: P2)

Como recrutador, na tela de busca de candidatos, informo um bairro (texto
livre, opcional) para restringir a lista de candidatos, combinando esse
critério com os já existentes (vaga, cidade, UF).

**Why this priority**: Depende de US1 já existir (candidatos com bairro
cadastrado) para ter valor prático, mas é o objetivo final do recurso do
ponto de vista do recrutador — sem esse filtro, o dado de bairro coletado
em US1 fica visível apenas na grade, sem poder ser usado para restringir a
busca.

**Independent Test**: Pode ser testado selecionando uma vaga, digitando um
bairro e saindo do campo (perde o foco), e verificando que a lista passa a
exibir somente candidatos cujo bairro contém o texto digitado, combinado aos
demais critérios já preenchidos.

**Acceptance Scenarios**:

1. **Given** a tela de busca de candidatos carregada, **When** o recrutador
   observa o formulário de filtros, **Then** o campo "Bairro" aparece
   imediatamente antes do campo "Cidade".
2. **Given** uma vaga selecionada e a lista de candidatos exibida, **When**
   o recrutador digita um bairro e sai do campo, **Then** a busca é refeita
   somando o critério de bairro aos demais critérios preenchidos (operador
   "E"), e a lista exibe somente candidatos cujo bairro contém o texto
   digitado.
3. **Given** um bairro preenchido com espaços em branco ou variação de
   maiúsculas/minúsculas, **When** a busca é executada, **Then** a
   correspondência não é sensível a caixa e ignora espaços extras nas
   extremidades, do mesmo modo que já ocorre para "Cidade".
4. **Given** um bairro digitado, **When** o recrutador continua digitando
   sem sair do campo, **Then** nenhuma nova busca é disparada até que o
   campo perca o foco.

---

### User Story 3 - Ver bairro na listagem de candidatos (Priority: P2)

Como recrutador, ao visualizar a lista de candidatos filtrados, vejo o bairro
de cada candidato em uma coluna posicionada imediatamente antes da coluna
"Cidade".

**Why this priority**: Complementa US1 e US2 — o dado só tem valor visível
para o recrutador se aparecer na grade de resultados, mas a grade só faz
sentido depois que a busca (US1/US2 do 002) já está funcionando.

**Independent Test**: Pode ser testado aplicando um filtro que retorne
candidatos e verificando que a coluna "Bairro" aparece na tabela,
imediatamente à esquerda da coluna "Cidade", com o valor correto para cada
candidato.

**Acceptance Scenarios**:

1. **Given** uma lista de candidatos filtrados exibida, **When** o
   recrutador observa as colunas da tabela, **Then** a coluna "Bairro"
   aparece imediatamente antes da coluna "Cidade", exibindo o bairro de cada
   candidato.

---

### User Story 4 - Migrar registros existentes para incluir bairro (Priority: P1)

Como responsável técnico pelo sistema, executo um script único que preenche
o campo "bairro" dos registros já existentes no banco de dados, usando um
bairro real da cidade já cadastrada em cada registro, para que os dados
existentes fiquem consistentes com a nova exigência de bairro obrigatório.

**Why this priority**: Sem essa migração, os registros existentes ficariam
sem bairro e o campo não poderia se tornar obrigatório no banco sem quebrar
esses dados — é pré-requisito técnico para tornar "Bairro" de fato
obrigatório de ponta a ponta.

**Independent Test**: Pode ser testado executando o script contra uma base
com registros de teste (incluindo cidades reconhecidas, como "Recife", e
cidades não reconhecidas) e verificando que os registros de cidades
reconhecidas recebem um bairro real daquela cidade, enquanto os registros de
cidades não reconhecidas são listados em um relatório de pendências, sem
receber um valor genérico.

**Acceptance Scenarios**:

1. **Given** um registro existente com cidade "Recife" e bairro vazio,
   **When** o script de migração é executado, **Then** o registro passa a
   ter um bairro real de Recife preenchido (ex.: um bairro que de fato existe
   naquela cidade).
2. **Given** um registro existente com uma cidade não reconhecida pelo
   script (ex.: nome de cidade digitado de forma incomum ou não coberta),
   **When** o script é executado, **Then** o registro não recebe nenhum
   valor de bairro e é listado em um relatório de registros pendentes de
   ajuste manual.
3. **Given** um registro que já possui bairro preenchido, **When** o script
   é executado novamente, **Then** esse registro não é alterado (o script
   pode ser executado mais de uma vez com segurança).

---

### Edge Cases

- Bairro preenchido com espaços em branco ou variação de maiúsculas/minúsculas
  no filtro do recrutador: a busca não deve ser sensível a caixa e deve
  ignorar espaços extras nas extremidades, igual ao comportamento já existente
  para "Cidade".
- Filtro de bairro sem nenhum candidato correspondente: a listagem deve
  informar que nenhum candidato foi encontrado, reaproveitando o
  comportamento já existente para os demais filtros.
- Registro existente cuja cidade não é reconhecida pelo script de migração:
  o registro NÃO recebe um bairro genérico/placeholder — permanece pendente
  até ajuste manual, para não introduzir dados incorretos no sistema.
- Enquanto existirem registros sem bairro preenchido (pendentes do ajuste
  manual da migração), o campo "bairro" no banco de dados permanece opcional
  no nível do banco; ele só passa a ser obrigatório no banco depois que todos
  os registros existentes tiverem um valor preenchido. Novos cadastros, no
  entanto, já exigem "Bairro" desde o momento em que o formulário é
  atualizado, independentemente do estado da migração dos registros antigos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O formulário de cadastro de currículo MUST exibir um campo de
  texto livre "Bairro", obrigatório, com no máximo 100 caracteres, posicionado
  imediatamente antes do campo "Cidade".
- **FR-002**: O sistema MUST validar o campo "Bairro" no momento do envio do
  formulário, com a mesma regra de obrigatoriedade e tamanho máximo já
  aplicada a "Cidade", bloqueando o envio com a mensagem existente de erro
  genérico quando ausente ou inválido.
- **FR-003**: O formulário de busca de candidatos (`/app/recrutador`) MUST
  oferecer um campo de texto livre "Bairro", opcional, posicionado
  imediatamente antes do campo "Cidade".
- **FR-004**: O sistema MUST combinar (operador "E") o critério de "Bairro",
  quando preenchido, com os demais critérios já existentes (vaga, cidade, UF)
  ao filtrar candidatos.
- **FR-005**: O sistema MUST disparar uma nova busca automaticamente quando o
  campo "Bairro" perder o foco, e não a cada tecla digitada, do mesmo modo
  que já ocorre para "Cidade".
- **FR-006**: A busca por "Bairro" MUST usar correspondência parcial (um
  candidato corresponde quando o texto digitado está contido no bairro
  cadastrado), MUST ser não sensível a maiúsculas e minúsculas e MUST ignorar
  espaços em branco nas extremidades do texto digitado.
- **FR-007**: A listagem de candidatos MUST exibir uma coluna "Bairro",
  posicionada imediatamente antes da coluna "Cidade", com o bairro de cada
  candidato.
- **FR-008**: O sistema MUST disponibilizar um script único, executável sob
  demanda, que preenche o campo "bairro" de registros existentes que ainda
  não o possuem, com base na cidade já cadastrada em cada registro, atribuindo
  um bairro real conhecido daquela cidade.
- **FR-009**: O script de migração MUST NOT atribuir um bairro genérico ou
  inventado a um registro cuja cidade não seja reconhecida por ele; esses
  registros MUST ser listados em um relatório de pendências para ajuste
  manual, sem alteração no registro.
- **FR-010**: O script de migração MUST ser seguro para execução repetida —
  registros que já possuem bairro preenchido MUST NOT ser alterados em
  execuções subsequentes.
- **FR-011**: O sistema MUST permitir que o campo "bairro" permaneça
  temporariamente ausente em registros existentes até que o ajuste manual do
  FR-009 seja concluído, sem impedir a exibição ou o funcionamento da
  listagem e do filtro para esses registros; novos cadastros, entretanto,
  MUST sempre exigir "Bairro" desde a ativação do formulário atualizado
  (FR-001/FR-002), independentemente do estado da migração dos registros
  antigos.

### Key Entities

- **Candidato (Currículo cadastrado)**: entidade já existente (ver
  [001-cadastro-curriculo](../001-cadastro-curriculo/spec.md)), estendida com
  um novo atributo "Bairro" (texto livre, até 100 caracteres), posicionado
  conceitualmente junto aos demais dados de localização (Cidade, UF).
- **Filtro de busca**: combinação transitória já existente (ver
  [002-filtrar-curriculos](../002-filtrar-curriculos/spec.md)), estendida com
  um novo critério opcional "Bairro" (texto livre), combinado por "E" aos
  critérios já existentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos novos cadastros de currículo exigem o preenchimento de
  "Bairro" antes de serem salvos com sucesso.
- **SC-002**: Um recrutador consegue restringir a lista de candidatos a
  apenas aqueles de um bairro específico preenchendo somente o campo
  "Bairro" (além da vaga obrigatória), sem nenhuma etapa adicional.
- **SC-003**: Após a execução do script de migração contra a base de dados
  existente, 100% dos registros cuja cidade é reconhecida pelo script passam
  a ter um bairro real preenchido, e 0% desses registros recebe um valor
  genérico ou incorreto.
- **SC-004**: Todo registro cuja cidade não é reconhecida pelo script de
  migração aparece no relatório de pendências gerado pela execução do
  script, permitindo o acompanhamento até o ajuste manual.

## Assumptions

- Assim como "Cidade", o campo "Bairro" é texto livre, sem validação contra
  uma lista real de bairros no momento do cadastro — qualquer texto de até
  100 caracteres é aceito.
- A associação entre um bairro real e uma cidade, usada apenas pelo script de
  migração, não precisa corresponder ao bairro real de cada candidato
  individual — qualquer bairro real e conhecido daquela cidade é aceitável
  para preencher registros históricos, já que o dado real não está disponível
  retroativamente.
- O conjunto de cidades reconhecidas pelo script de migração é uma lista
  restrita e mantida manualmente (não uma base geográfica completa),
  cobrindo pelo menos as cidades já usadas em dados de exemplo/demonstração
  do sistema.
- A obrigatoriedade de "Bairro" no banco de dados (impedindo valores vazios)
  só é aplicada depois que todos os registros existentes tiverem um bairro
  preenchido (via migração automática ou ajuste manual); esse é um processo
  operacional separado da entrega do formulário e do filtro.
