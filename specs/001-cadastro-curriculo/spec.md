# Feature Specification: Cadastro de Currículo

**Feature Branch**: `001-cadastro-curriculo`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Cadastrar currículo - Eu como candidato gostaria de cadastrar meu currículo para vagas de trabalho, através de um formulário estilo Google Forms com upload de currículo (Word/PDF, até 4MB), dados pessoais (nome, data de nascimento, email, telefone, cidade e UF) e seleção de vagas desejadas (checkboxes, múltipla escolha), com botões Salvar e Limpar, validação de campos obrigatórios e mensagens de feedback em dialog."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar currículo com sucesso (Priority: P1)

Como candidato, eu preencho todos os campos do formulário, anexo meu currículo e
seleciono ao menos uma vaga desejada, para que meus dados fiquem registrados e eu
possa ser considerado para as vagas de interesse.

**Why this priority**: É o fluxo principal e único motivo de existir da feature —
sem ele não há valor entregue. Constitui o MVP completo.

**Independent Test**: Pode ser testado preenchendo todos os campos obrigatórios,
anexando um arquivo PDF ou Word válido dentro do limite de tamanho, selecionando
uma ou mais vagas, e clicando em "Salvar" — o registro deve ser persistido e a
mensagem de sucesso exibida.

**Acceptance Scenarios**:

0. **Given** o candidato acessa `/app` (ou a raiz `/`, que redireciona para
   `/app`), **When** a página carrega, **Then** o formulário "Cadastre seu
   currículo" é exibido imediatamente, em branco e pronto para preenchimento.
1. **Given** o formulário "Cadastre seu currículo" está em branco, **When** o
   candidato preenche todos os campos obrigatórios (nome completo, data de
   nascimento, email, telefone, cidade, UF, ao menos uma vaga desejada) e anexa um
   arquivo PDF de 2MB, **Then** ao clicar em "Salvar" os dados são persistidos,
   é exibido o diálogo "Salvo com sucesso" e todos os campos do formulário são
   limpos.
2. **Given** o formulário está preenchido corretamente, **When** o candidato
   anexa um arquivo `.docx` dentro do limite de 4MB, **Then** o arquivo é
   aceito e associado ao envio.
3. **Given** o formulário está preenchido, **When** o candidato seleciona mais
   de uma vaga desejada (ex.: "Eletricista" e "Motorista"), **Then** ambas as
   seleções são aceitas e persistidas com o cadastro.

---

### User Story 2 - Impedir envio de formulário incompleto (Priority: P2)

Como candidato, se eu esquecer de preencher algum campo obrigatório ou anexar o
currículo, quero ser avisado claramente para poder corrigir antes de enviar.

**Why this priority**: Garante a integridade dos dados coletados; sem essa
validação, cadastros incompletos poderiam ser salvos, reduzindo o valor da
funcionalidade principal.

**Independent Test**: Pode ser testado deixando um ou mais campos obrigatórios
vazios (incluindo o anexo do currículo ou a seleção de vaga) e clicando em
"Salvar" — o sistema deve impedir a gravação e exibir a mensagem de erro.

**Acceptance Scenarios**:

1. **Given** o formulário está com o campo "Nome completo" vazio e os demais
   preenchidos, **When** o candidato clica em "Salvar", **Then** o sistema
   exibe o diálogo "Preencha todos os campos" e nenhum dado é persistido.
2. **Given** nenhuma vaga desejada foi selecionada, **When** o candidato clica
   em "Salvar", **Then** o sistema exibe o diálogo "Preencha todos os campos" e
   nenhum dado é persistido.
3. **Given** nenhum arquivo de currículo foi anexado, **When** o candidato
   clica em "Salvar", **Then** o sistema exibe o diálogo "Preencha todos os
   campos" e nenhum dado é persistido.

---

### User Story 3 - Limpar formulário (Priority: P3)

Como candidato, quero poder reiniciar o formulário a qualquer momento, para
recomeçar o preenchimento caso eu tenha cometido um erro.

**Why this priority**: Melhora a experiência de uso, mas o cadastro continua
funcional mesmo sem essa ação de conveniência (o candidato poderia apagar os
campos manualmente).

**Independent Test**: Pode ser testado preenchendo parcialmente o formulário,
anexando um arquivo e clicando em "Limpar" — todos os campos e o anexo devem
voltar ao estado inicial vazio.

**Acceptance Scenarios**:

1. **Given** o formulário está parcialmente preenchido e possui um arquivo
   anexado, **When** o candidato clica em "Limpar", **Then** todos os campos de
   texto, a data, as vagas selecionadas e o anexo são removidos, retornando o
   formulário ao estado inicial.

---

### User Story 4 - Acessar a Área do Recrutador (Priority: P3)

Como recrutador, quero um acesso visível a partir da tela de cadastro para
chegar à área de filtragem de currículos, sem precisar decorar uma URL.

**Why this priority**: É apenas o ponto de entrada para uma funcionalidade que
será construída em uma feature posterior; o cadastro de candidatos continua
plenamente funcional sem ele.

**Independent Test**: Pode ser testado clicando no botão "Área do Recrutador"
no cabeçalho e verificando que a aplicação navega para `/recrutador` exibindo
a tela correspondente.

**Acceptance Scenarios**:

1. **Given** o candidato ou recrutador está na tela de cadastro, **When**
   observa o topo da página, **Then** vê um cabeçalho contendo o botão
   "Área do Recrutador".
2. **Given** o usuário está na tela de cadastro, **When** clica em
   "Área do Recrutador", **Then** a aplicação navega para `/recrutador` sem
   recarregar a página, exibindo a tela "Filtrar currículos" (nesta entrega,
   o espaço reservado descrito em FR-001e).
3. **Given** o usuário está na rota `/recrutador`, **When** observa a tela,
   **Then** o mesmo cabeçalho e tema visual das demais telas são exibidos, e
   existe um caminho de volta ao formulário de cadastro.

---

### Edge Cases

- O que acontece se o candidato tentar anexar um arquivo em formato diferente
  de Word ou PDF (ex.: imagem, `.txt`)? O sistema deve rejeitar o arquivo e
  informar que o formato não é aceito, sem permitir que ele seja anexado.
- O que acontece se o arquivo anexado ultrapassar 4MB? O sistema deve
  rejeitar o arquivo e informar o limite de tamanho, sem permitir que ele seja
  anexado.
- O que acontece se o candidato tentar anexar um segundo arquivo? O novo
  arquivo substitui o anteriormente anexado (apenas um arquivo é permitido por
  cadastro).
- O que acontece se o candidato informar uma data de nascimento futura? O
  campo deve ser rejeitado com uma mensagem indicando que a data não pode ser
  posterior à data atual.
- O que acontece se o telefone for digitado em formato inválido (fora do
  padrão brasileiro)? O sistema deve indicar que o valor está em formato
  inválido e impedir o envio até a correção.
- O que acontece se o candidato não selecionar nenhuma UF na lista suspensa?
  O campo permanece inválido e o envio é bloqueado com a mensagem "Preencha
  todos os campos".
- O que acontece se ocorrer uma falha ao persistir os dados (ex.: falha de
  conexão com o banco de dados) mesmo com todos os campos válidos? O sistema
  deve exibir uma mensagem de erro em formato de diálogo informando que não
  foi possível salvar, sem limpar os campos preenchidos pelo candidato.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir um formulário com o título "Cadastre seu
  currículo", em um layout de página única no estilo de um formulário do tipo
  Google Forms (título no topo, campos organizados verticalmente, um campo por
  vez).
- **FR-001a**: O formulário de cadastro de currículo MUST ser a tela de
  entrada do sistema, exibida na raiz da aplicação, no caminho `/app`.
  Acessar `/app` MUST exibir o formulário diretamente, sem etapa intermediária
  (sem tela de login, menu ou página inicial anterior).
- **FR-001b**: O sistema MUST redirecionar o acesso à raiz do domínio (`/`)
  para `/app`, e MUST redirecionar qualquer caminho desconhecido dentro da
  aplicação para `/app`, de modo que o candidato sempre chegue ao formulário.
- **FR-001c**: O sistema MUST exibir um cabeçalho fixo no topo de todas as
  telas da aplicação, contendo o nome do sistema à esquerda e um botão
  "Área do Recrutador" à direita. O cabeçalho é distinto do título do
  formulário ("Cadastre seu currículo"), que permanece dentro do corpo da
  página conforme FR-001.
- **FR-001d**: O botão "Área do Recrutador" MUST navegar para a tela
  "Filtrar currículos", na rota `/recrutador`, sem recarregar a página
  (navegação interna da aplicação).
- **FR-001e**: A tela "Filtrar currículos" NÃO faz parte desta feature. Nesta
  entrega, a rota `/recrutador` MUST exibir uma tela mínima de espaço
  reservado, usando o mesmo cabeçalho e o mesmo tema visual das demais telas,
  informando que a área está em construção e oferecendo um caminho de volta
  ao formulário de cadastro.
- **FR-002**: O sistema MUST exibir, como primeiro campo do formulário, um
  controle de anexo de arquivo com um botão "Anexar currículo" e um texto
  explicativo indicando que os formatos aceitos são Word e PDF.
- **FR-003**: O sistema MUST aceitar apenas arquivos nos formatos Word (.doc,
  .docx) ou PDF (.pdf) para o anexo de currículo, rejeitando qualquer outro
  formato.
- **FR-004**: O sistema MUST rejeitar arquivos de currículo com tamanho
  superior a 4MB.
- **FR-005**: O sistema MUST permitir apenas um arquivo de currículo anexado
  por vez; um novo anexo substitui o anterior.
- **FR-006**: O sistema MUST exibir os campos "Nome completo", "Data de
  nascimento", "Email para contato", "Telefone para contato", "Cidade", "UF"
  e "Vagas desejadas", além do controle de anexo de currículo.
- **FR-007**: O sistema MUST tratar todos os campos do formulário (anexo de
  currículo, nome completo, data de nascimento, email, telefone, cidade, UF e
  ao menos uma vaga desejada) como obrigatórios.
- **FR-008**: O sistema MUST limitar o campo "Nome completo" a no máximo 100
  caracteres.
- **FR-009**: O sistema MUST apresentar o campo "Data de nascimento" como um
  seletor de data com dia, mês e ano, e MUST rejeitar datas posteriores à data
  atual.
- **FR-010**: O sistema MUST validar que o campo "Email para contato" segue um
  formato de email válido.
- **FR-011**: O sistema MUST validar que o campo "Telefone para contato" segue
  o padrão de telefone brasileiro (DDD + número, com ou sem o nono dígito).
- **FR-012**: O sistema MUST exibir o campo "Cidade" como campo de texto livre
  para o nome da cidade de residência, com no máximo 100 caracteres.
- **FR-012a**: O sistema MUST exibir o campo "UF" como uma lista suspensa
  (dropdown) contendo exatamente as 27 unidades federativas brasileiras (AC,
  AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN,
  RS, RO, RR, SC, SP, SE, TO), permitindo a seleção de exatamente uma delas.
- **FR-012b**: O sistema MUST tratar "Cidade" e "UF" como campos obrigatórios
  e independentes; o valor de "UF" MUST ser um dos 27 códigos válidos.
- **FR-013**: O sistema MUST apresentar o campo "Vagas desejadas" como uma
  lista de checkboxes com as opções: "Pedreiro", "Ajudante de pedreiro",
  "Eletricista", "Motorista", "Cozinheiro", "Marceneiro", "Técnico em
  segurança do trabalho", "Porteiro" e "Outros".
- **FR-014**: O sistema MUST exigir a seleção de ao menos uma vaga desejada,
  permitindo a seleção de múltiplas vagas simultaneamente.
- **FR-015**: O sistema MUST exibir os botões "Limpar" e "Salvar" ao final do
  formulário.
- **FR-016**: O sistema MUST, ao clicar em "Salvar" com algum campo
  obrigatório não preenchido ou inválido, exibir a mensagem "Preencha todos os
  campos" em formato de diálogo e MUST NOT persistir os dados.
- **FR-017**: O sistema MUST, ao clicar em "Salvar" com todos os campos
  válidos e preenchidos, persistir os dados do formulário (incluindo o
  currículo anexado) e MUST exibir a mensagem "Salvo com sucesso" em formato
  de diálogo, limpando em seguida todos os campos do formulário.
- **FR-018**: O sistema MUST, ao clicar em "Limpar", reiniciar o formulário
  removendo todos os valores preenchidos, seleções e o arquivo anexado,
  independentemente do botão "Salvar" ter sido acionado.
- **FR-019**: O sistema MUST exibir uma mensagem de erro em formato de
  diálogo caso a persistência dos dados falhe por motivo diverso de validação
  de campos (ex.: falha de comunicação com o armazenamento), sem limpar os
  campos já preenchidos pelo candidato.

### Key Entities

- **Cadastro de Currículo**: Representa o envio de um candidato, contendo
  nome completo, data de nascimento, email de contato, telefone de contato,
  cidade e UF de residência, uma ou mais vagas desejadas, o arquivo de currículo
  anexado (nome do arquivo, formato, tamanho) e a data/hora do envio.
- **Vaga Desejada**: Representa uma das opções fixas de vaga que o candidato
  pode selecionar ("Pedreiro", "Ajudante de pedreiro", "Eletricista",
  "Motorista", "Cozinheiro", "Marceneiro", "Técnico em segurança do
  trabalho", "Porteiro", "Outros"); um Cadastro de Currículo pode estar
  associado a uma ou mais Vagas Desejadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um candidato consegue preencher e enviar com sucesso o
  formulário completo (incluindo anexo do currículo) em menos de 3 minutos.
- **SC-002**: 100% das tentativas de envio com campos obrigatórios ausentes
  ou inválidos são bloqueadas, exibindo a mensagem "Preencha todos os campos"
  e sem gerar registros incompletos no armazenamento.
- **SC-003**: 100% dos envios com todos os campos válidos resultam em um
  registro persistido e na exibição da mensagem "Salvo com sucesso".
- **SC-004**: 100% das tentativas de anexar um arquivo fora dos formatos
  aceitos (Word/PDF) ou acima de 4MB são rejeitadas antes do envio do
  formulário.
- **SC-005**: Após o uso do botão "Limpar" ou após um envio bem-sucedido, o
  formulário retorna ao estado inicial em 100% dos casos, sem reter valores
  do preenchimento anterior.

## Assumptions

- O padrão de telefone brasileiro aceito é DDD (2 dígitos) + número de 8 ou 9
  dígitos, com ou sem formatação (parênteses, espaço, hífen).
- O campo "Cidade" é texto livre; não há validação de que a cidade informada
  exista de fato, nem de que ela pertença à UF selecionada (não é feita
  consulta a uma base de municípios). As duas validações se limitam a: cidade
  preenchida e UF entre as 27 opções válidas.
- A lista de UFs é fixa no sistema (27 opções) e exibida apenas pela sigla
  (ex.: "RJ"), sem o nome do estado por extenso, por ser o formato usual em
  formulários brasileiros.
- A opção "Outros" na lista de vagas desejadas é uma opção de checkbox como
  as demais, sem campo de texto livre adicional para detalhamento, pois o
  input do usuário não solicitou esse detalhamento.
- Não há necessidade de autenticação/login do candidato para preencher o
  formulário — o cadastro é público e aberto. Como o formulário é a tela de
  entrada em `/app` (FR-001a), não existe nenhuma outra tela antes dele.
- `/app` é a raiz da aplicação. Nesta versão existem duas rotas: o formulário
  de cadastro (raiz) e `/recrutador` (espaço reservado). Caminhos
  desconhecidos retornam ao formulário (FR-001b) em vez de exibir uma página
  de erro 404 dedicada.
- A tela "Filtrar currículos" (listagem, filtros e download de currículos)
  será especificada e construída como uma feature separada. Esta feature
  entrega apenas o cabeçalho, o botão e a rota de destino.
- A decisão sobre exigir autenticação na Área do Recrutador fica adiada para
  a feature da tela "Filtrar currículos". Enquanto a rota exibir apenas o
  espaço reservado, nenhum dado pessoal de candidato é exposto por ela.
- Não há verificação de duplicidade de cadastro (mesmo candidato podendo se
  cadastrar mais de uma vez) — não solicitado pelo input do usuário.
- Não é exigido um checkbox de consentimento de uso de dados (LGPD) para o
  MVP, por não ter sido solicitado; poderá ser adicionado em iteração futura
  caso necessário.
- Não há limite mínimo de idade para o campo "Data de nascimento" além de a
  data não poder ser futura.
