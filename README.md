<!-- Arquivos usados por este README (pasta assets/): FluigTrackerBanner.webp, FluigTrackerIcon.png, FluigTrackerGifLoad.gif, fluxo-git.gif -->

<a name="top"></a>

<div align="center"> <img src="assets/FluigTrackerBannerReload.webp" alt="Banner Fluig Tracker" /> <h1>Fluig Tracker — Extensão para Desenvolvimento</h1> <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=3200&pause=1200&color=1F8BD1&center=true&vCenter=true&width=720&height=44&lines=Desenvolvimento+Fluig+com+integra%C3%A7%C3%A3o+Git;Cada+exporta%C3%A7%C3%A3o+vira+um+commit+autom%C3%A1tico;Hist%C3%B3rico+de+exporta%C3%A7%C3%B5es+direto+no+GitHub" alt="Desenvolvimento Fluig com integração Git" /> <p> <img src="https://img.shields.io/badge/TOTVS-FLUIG-0072C6?style=for-the-badge" alt="TOTVS Fluig" /> <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="VS Code Extension" /> <img src="https://img.shields.io/badge/Community-Edition-8A63D2?style=for-the-badge" alt="Community Edition" /> </p> <p> <a href="https://github.com/fluiggers/fluig-vscode-extension"><img src="https://img.shields.io/badge/Baseado%20em-Fluiggers-181717?style=flat-square&logo=github&logoColor=white" alt="Baseado em Fluiggers" /></a> <img src="https://img.shields.io/badge/Package-VSIX-orange?style=flat-square" alt="Package VSIX" /> </p> <p> <a href="../../releases/latest"><img src="https://img.shields.io/badge/Baixar-%C3%9Altima%20vers%C3%A3o-3FB950?style=for-the-badge&logo=github&logoColor=white" alt="Baixar a última versão" /></a> </p> <p> <a href="#sobre">Sobre</a> &nbsp;•&nbsp; <a href="#git">Integração Git</a> &nbsp;•&nbsp; <a href="#instalacao">Instalação</a> &nbsp;•&nbsp; <a href="#creditos">Créditos</a> </p> </div>

<a name="sobre"></a>

✨ Sobre o projeto

O Fluig Tracker é uma versão independente derivada da extensão de desenvolvimento Fluig, criada originalmente pela comunidade Fluiggers.

A proposta é preservar a experiência e os recursos da extensão original, adicionando uma integração com Git para registrar automaticamente as exportações realizadas no Fluig.

<a name="git"></a>

🔗 Integração com Git

A funcionalidade adicional permite registrar automaticamente uma exportação bem-sucedida, criar um commit e executar o push para um repositório remoto.

Dessa forma, o histórico de exportações pode ser acompanhado diretamente pelo GitHub, sem precisar registrar cada operação manualmente.

Como funciona
<p align="center">
  <br>
  <img src="assets/FluigTrackerGifFlowIcon.gif" alt="Fluxo de exportação do Fluig com registro no Git" width="800" />
  <div align="center"><br> <sub>Exportação da extensão original (Fluiggers) • commit e push automáticos pelo Fluig Tracker.</sub> </div>
</p>

Tecnologias e plataformas
<p align="center"> <img src="assets/FluigTrackerIcon.png" alt="FluigTracker" height="48" /> <img src="https://skillicons.dev/icons?i=vscode,git,github&theme=dark" alt="Visual Studio Code, Git e GitHub" height="48" /> <img src="https://cdn.simpleicons.org/totvs" alt="TOTVS" height="48" /> </p> <p align="center"> </p>

## Registro automático de exportações

Configure um repositório Git pelo menu do formulário. Após cada exportação concluída, o Tracker acrescenta uma linha ao arquivo activity.md, cria um commit e envia o histórico ao repositório configurado.

### 1. Configurar o repositório pelo menu

<p align="center"><img src="./images/Registro_Log_1.png" width="1000" alt="Opção Configurar Repositório de Log no menu de contexto"></p>

**Etapa:** selecione Configurar Repositório de Log, logo abaixo de Exportar Formulário. **Aviso:** abrir essa opção apenas inicia a configuração; ainda não registra uma exportação.

### 2. Informar a URL ou o caminho do repositório

<p align="center"><img src="./images/Registro_Log_2.png" width="1000" alt="Campo para URL ou caminho do repositório Git"></p>

**Etapa:** informe uma URL Git HTTPS/SSH ou o caminho de um repositório Git local. **Aviso:** a conta precisa ter acesso de gravação. Configure a autenticação do Git no sistema e não coloque tokens ou senhas na URL.

### 3. Confirmar o repositório configurado

<p align="center"><img src="./images/Registro_Log_3.png" width="1000" alt="Mensagem de repositório configurado"></p>

**Etapa:** a mensagem confirma que o destino foi salvo. **Aviso:** ela não confirma um commit; o registro só acontece depois de uma exportação bem-sucedida.

### 4. Verificar a confirmação da exportação

<p align="center"><img src="./images/Registro_Log_4.png" width="1000" alt="Notificação de exportação registrada"></p>

**Etapa:** após a exportação, a notificação confirma o registro. **Aviso:** ela aparece quando o commit e o envio ao remoto terminam com sucesso.

### 5. Consultar o commit no GitHub

<p align="center"><img src="./images/Registro_Log_5.png" width="1000" alt="Commit de histórico de exportações no GitHub"></p>

**Etapa:** o histórico mostra o commit e a linha de activity.md. **Aviso:** o Tracker envia o histórico e os atributos de merge relacionados, não os arquivos-fonte do projeto Fluig.

## Créditos à comunidade Fluiggers

<p align="center"><img src="./images/icon.png" width="96" alt="Ícone da comunidade Fluiggers"> &nbsp; → &nbsp; <img src="./images/FluigTrackerGrey.png" width="96" alt="Logo do Fluig Tracker"></p>

A seta representa a evolução da extensão original da comunidade Fluiggers para o Fluig Tracker. **Nada disso seria possível sem a extensão original.** O ícone colorido do Fluig Tracker é usado como ícone da extensão; a versão cinza aparece na barra lateral do VS Code.

<a name="instalacao"></a>

📦 Instalação

A instalação é feita manualmente por meio do pacote .vsix.

Etapa	Instrução
01	Acesse a seção Releases.
02	Baixe o arquivo .vsix da versão desejada.
03	Abra o Visual Studio Code.
04	Pressione <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>.
05	Execute Extensions: Install from VSIX....
06	Selecione o arquivo baixado.
<details> <summary><b>💻 Prefere o terminal?</b></summary> <br />
bash
code --install-extension caminho/do/arquivo.vsix
</details>

[!NOTE] Configure o destino pelo comando Configurar Repositório de Log. O endereço, a autenticação e as permissões são definidos no ambiente de cada usuário.

<a name="creditos"></a>

🧩 Créditos e projeto de origem

Projeto baseado na extensão Fluig — Extensão para Desenvolvimento, criada pela comunidade Fluiggers.

<div align="center">

Fluiggers

</div>

[!NOTE] Esta é uma iniciativa independente, sem vínculo oficial com a TOTVS nem representação oficial da equipe Fluiggers.

<div align="center">

<strong>Desenvolvido com 💙 pela comunidade.</strong><br /> <sub>Fluig + Visual Studio Code + Git + GitHub</sub>

<br />

<a href="#top">⬆ Voltar ao topo</a>

</div>
