![Banner Fluig](assets/FluigTrackerBanner.webp)

# Fluig — Extensão para Desenvolvimento

<p align="center">
  <img src="https://img.shields.io/badge/TOTVS-FLUIG-0072C6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" />
  <img src="https://img.shields.io/badge/Community-Edition-8A63D2?style=for-the-badge" />
</p>

<p align="center">
  <strong>Desenvolvimento Fluig com integração Git.</strong><br>
  Uma alternativa comunitária para desenvolver com TOTVS Fluig no Visual Studio Code.
</p>

<p align="center">
  <a href="https://github.com/fluiggers/fluig-vscode-extension">
    <img src="https://img.shields.io/badge/Baseado%20em-Fluiggers-181717?style=flat-square&logo=github&logoColor=white" />
  </a>
  <img src="https://img.shields.io/badge/Package-VSIX-orange?style=flat-square" />
</p>

---

## ✨ Sobre o projeto

Esta é uma versão alternativa da **Fluig — Extensão para Desenvolvimento**, originalmente desenvolvida pela comunidade [Fluiggers](https://github.com/fluiggers/fluig-vscode-extension).

A proposta é preservar a experiência e os recursos da extensão original, adicionando uma integração com Git para registrar automaticamente as exportações realizadas no Fluig.

## 🔗 Integração com Git

A funcionalidade adicional permite registrar automaticamente uma exportação bem-sucedida, criar um commit e executar o push para um repositório remoto.

Dessa forma, o histórico de exportações pode ser acompanhado diretamente pelo GitHub, sem precisar registrar cada operação manualmente.

### Como funciona

```mermaid
flowchart LR
    A["Fluig"] --> B["Exportação concluída"]
    B --> C["Git Commit"]
    C --> D["Git Push"]
    D --> E["GitHub"]
```

### Tecnologias e plataformas

<p align="center">
  <img src="assets/FluigTrackerIcon.png"
    alt="FluigTracker"
  width="46">
  </img>
  <img src="https://skillicons.dev/icons?i=vscode,git,github&theme=dark" alt="Visual Studio Code, Git e GitHub" />
  <img
  src="https://cdn.simpleicons.org/totvs"
  alt="TOTVS"
  width="46"
/>
</p> 

<p align="center">
<img src="assets/FluigTrackerGifFlow.webp"
    alt="FluigTrackerFlow"
  width="600">
  </img>
</p>


---

## 📦 Instalação

A instalação é feita manualmente por meio do pacote `.vsix`.

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

[![Fluiggers](https://img.shields.io/badge/Conheça%20o%20projeto%20original-Fluiggers-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fluiggers/fluig-vscode-extension)

Esta é uma iniciativa comunitária independente, com uma funcionalidade adicional, sem vínculo oficial com a TOTVS ou representação oficial da equipe Fluiggers.

---

<p align="center">
  <strong>Desenvolvido com 💙 pela comunidade.</strong><br>
  <sub>Fluig + Visual Studio Code + Git + GitHub</sub>
</p>
