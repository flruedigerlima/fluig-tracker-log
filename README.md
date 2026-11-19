# Fluig — Extensão para Desenvolvimento

<p align="center">
  <strong>Uma extensão comunitária para desenvolver com TOTVS Fluig no Visual Studio Code.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visualstudiocode&logoColor=white" />
  <img src="https://img.shields.io/badge/TOTVS-Fluig-blue" />
  <img src="https://img.shields.io/badge/Community-Edition-8A63D2" />
  <img src="https://img.shields.io/badge/Package-VSIX-orange" />
</p>

---

## Sobre

Esta é uma versão alternativa da **Fluig — Extensão para Desenvolvimento**, originalmente desenvolvida pela comunidade [Fluiggers](https://github.com/fluiggers/fluig-vscode-extension).

A proposta é preservar a experiência e os recursos da extensão original, adicionando uma integração com Git para registrar automaticamente as exportações realizadas no Fluig.

### O que muda?

<details>
<summary><strong>↗ Integração com Git</strong></summary>

Após uma exportação concluída com sucesso, a extensão registra a atividade em um repositório Git, cria um commit e executa o push para o repositório remoto.

Assim, o histórico de exportações pode ser acompanhado diretamente pelo GitHub, sem precisar registrar cada operação manualmente.

</details>

---

## Instalação

A instalação é feita manualmente por meio do pacote `.vsix`.

1. Acesse a seção [Releases](../../releases).
2. Baixe o arquivo `.vsix` da versão desejada.
3. Abra o Visual Studio Code.
4. Pressione `Ctrl + Shift + P`.
5. Execute `Extensions: Install from VSIX...`.
6. Selecione o arquivo baixado.

> **Atenção:** a integração Git depende da configuração do repositório de atividade no ambiente local. O pacote atual utiliza um caminho local específico, que precisa ser adaptado para outros ambientes.

---

## Créditos

Projeto baseado na extensão **Fluig — Extensão para Desenvolvimento**, criada pela comunidade [Fluiggers](https://github.com/fluiggers/fluig-vscode-extension).

Esta é uma iniciativa comunitária independente, com uma funcionalidade adicional, sem vínculo oficial com a TOTVS ou representação oficial da equipe Fluiggers.

---

<p align="center">
  Desenvolvido com 💙 pela comunidade.
  <br />
  <sub>Fluig + VS Code + Git</sub>
</p>
