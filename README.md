![Banner Fluig](assets/FluigTrackerBannerReload.webp)

# Fluig — Extensão para Desenvolvimento

<p align="center">
  <img src="https://img.shields.io/badge/TOTVS-FLUIG-0072C6?style=for-the-badge" alt="TOTVS Fluig" />
  <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Extensão para VS Code" />
  <img src="https://img.shields.io/badge/Community-Edition-8A63D2?style=for-the-badge" alt="Community Edition" />
</p>

<p align="center">
  <strong>Desenvolvimento Fluig com integração Git</strong><br />
  Uma alternativa comunitária para desenvolver com TOTVS Fluig no Visual Studio Code.
</p>

<p align="center">
  <a href="https://github.com/fluiggers/fluig-vscode-extension">
    <img src="https://img.shields.io/badge/Baseado%20em-Fluiggers-181717?style=flat-square&logo=github&logoColor=white" alt="Projeto original Fluiggers" />
  </a>
  <img src="https://img.shields.io/badge/Package-VSIX-orange?style=flat-square" alt="Pacote VSIX" />
</p>

---

## ✨ Sobre o projeto

Esta é uma versão alternativa da **Fluig — Extensão para Desenvolvimento**, originalmente desenvolvida pela comunidade [Fluiggers](https://github.com/fluiggers/fluig-vscode-extension).

A proposta é preservar a experiência e os recursos da extensão original e acrescentar integração com Git para registrar automaticamente as exportações realizadas no Fluig.

## 🔗 Integração com Git

Após uma exportação bem-sucedida, a extensão pode criar um commit e enviá-lo ao repositório remoto. Assim, as alterações ficam registradas no histórico do GitHub sem que cada operação precise ser anotada manualmente.

### Um histórico compartilhado para a equipe

Quando dois desenvolvedores trabalham no mesmo ambiente Fluig, manter as exportações em um repositório Git compartilhado é uma forma simples de acompanhar as mudanças. Cada commit registra autor, data e conteúdo alterado, ajudando a identificar quem realizou a última exportação e facilitando a consulta do histórico da atividade.

Esse registro também ajuda a equipe a entender o que mudou entre exportações e a recuperar versões anteriores quando necessário. Para que o histórico identifique corretamente cada pessoa, cada desenvolvedor deve usar sua própria identidade Git.

### Como funciona

```mermaid
flowchart LR
    A[Fluig] --> B[Exportação VS Code]
    B --> C[Git Commit]
    C --> D[Git Push]
    D --> E[Histórico compartilhado no GitHub]
```

<p align="center">
  <img src="assets/FluigTrackerGifFlow.webp" alt="Fluxo de exportação do Fluig com registro no Git" width="800" />
</p>

### Tecnologias e plataformas

<p align="center">
  <img src="assets/FluigTrackerIcon.png" alt="FluigTracker" width="46" />
  <img src="https://skillicons.dev/icons?i=vscode,git,github&theme=dark" alt="Visual Studio Code, Git e GitHub" />
  <img src="https://cdn.simpleicons.org/totvs" alt="TOTVS" width="46" />
</p>

---

## 📦 Instalação

A instalação é feita manualmente por meio do pacote `.vsix`:

| Etapa | Instrução |
|:---:|---|
| **01** | Acesse a seção [Releases](../../releases). |
| **02** | Baixe o arquivo `.vsix` da versão desejada. |
| **03** | Abra o Visual Studio Code. |
| **04** | Pressione `Ctrl + Shift + P`. |
| **05** | Execute `Extensions: Install from VSIX...`. |
| **06** | Selecione o arquivo baixado. |

> **Atenção:** a integração Git depende da configuração do repositório de atividade no ambiente local. O pacote atual utiliza um caminho local específico, que precisa ser adaptado para outros ambientes.

---

## 🧩 Créditos e projeto de origem

Projeto baseado na extensão **Fluig — Extensão para Desenvolvimento**, criada pela comunidade [Fluiggers](https://github.com/fluiggers/fluig-vscode-extension).

[![Conheça o projeto original Fluiggers](https://img.shields.io/badge/Conheça%20o%20projeto%20original-Fluiggers-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fluiggers/fluig-vscode-extension)

Esta é uma iniciativa comunitária independente, com uma funcionalidade adicional, sem vínculo oficial com a TOTVS ou representação oficial da equipe Fluiggers.

---

<p align="center">
  <strong>Desenvolvido com 💙 pela comunidade</strong><br />
  <sub>Fluig + Visual Studio Code + Git + GitHub</sub>
</p>
