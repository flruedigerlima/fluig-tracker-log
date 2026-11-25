import { ExtensionContext, ProgressLocation, window } from "vscode";
import { execFile } from "child_process";
import { createHash } from "crypto";
import {
    appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync,
    readdirSync, statSync, truncateSync, unlinkSync, writeFileSync
} from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Repositório de Log do Fluig Tracker.
 *
 * Guarda UMA preferência por usuário (ExtensionContext.globalState) e usa essa preferência para
 * registrar cada exportação bem-sucedida em `activity.md`, com commit e push.
 *
 * Destinos aceitos:
 *  - URL (HTTPS ou SSH) do GitHub: a extensão clona UMA vez numa pasta própria
 *    (globalStorage da extensão) e reutiliza essa cópia nas próximas exportações;
 *  - caminho de uma pasta local que já seja um repositório Git (ou que o usuário aceite inicializar).
 *
 * Ligação do botão (adapte o prefixo ao padrão dos comandos que já existem no projeto):
 *   extension.ts   -> commands.registerCommand("<prefixo>.configureLogRepository",
 *                         () => LogRepositoryService.configure(context))
 *   package.json   -> contributes.commands: { "command": "<prefixo>.configureLogRepository",
 *                         "title": "Repositório de Log" }
 *   (e o item/botão logo abaixo de "Exportar formulário", do mesmo jeito que ele foi declarado)
 */

export type LogSource = "url" | "path";

export interface LogRepositoryConfig {
    source: LogSource;
    /** O que o usuário informou: URL normalizada ou caminho absoluto. */
    value: string;
    /** Pasta de trabalho local onde o commit acontece (clone gerenciado ou a própria pasta informada). */
    localPath: string;
}

export interface ExportRecord {
    /** Nome do formulário/processo exportado. */
    process: string;
    /** Operação registrada. Padrão: "Exportação Fluig". */
    operation?: string;
    /** Responsável quando o Git não tem user.name (ex.: login do Fluig, se não for e-mail). */
    fallbackUser?: string;
}

export type ParsedTarget =
    | { kind: "url"; value: string }
    | { kind: "path"; value: string }
    | { kind: "invalid"; reason: string };

interface PublishResult {
    commitMessage: string;
    hasRemote: boolean;
    pushed: boolean;
    problem?: string;
}

interface FileSnapshot {
    path: string;
    existed: boolean;
    size: number;
}

const CONFIG_KEY = "fluigTracker.logRepository";
const LOG_FILE = "activity.md";
const LEGACY_LOG_FILE = "activity.log";
const ATTRIBUTES_FILE = ".gitattributes";
// Registro "append-only": a regra "union" mescla linhas novas de pessoas diferentes sem conflito.
// IMPORTANTE: cada registro ocupa UMA única linha. O merge do Git trabalha por linha e, com registros
// de várias linhas, funde/entrelaça duas gravações simultâneas sem avisar (reproduzido em teste).
const ATTRIBUTES_RULE = `${LOG_FILE} merge=union`;
const FALLBACK_AUTHOR_NAME = "Fluig Tracker";
const FALLBACK_AUTHOR_EMAIL = "fluig-tracker@localhost";
const UNKNOWN_USER = "Usuário não identificado";
const DEFAULT_OPERATION = "Exportação Fluig";
const LOCAL_TIMEOUT = 20_000;
const NETWORK_TIMEOUT = 60_000;
const CLONE_TIMEOUT = 180_000;

export class LogRepositoryService {

    /** Serializa os registros para que duas exportações seguidas não disputem o índice do Git. */
    private static queue: Promise<unknown> = Promise.resolve();
    private static hintShown = false;

    // ------------------------------------------------------------------ configuração

    public static getConfig(context: ExtensionContext): LogRepositoryConfig | undefined {
        const config = context.globalState.get<LogRepositoryConfig>(CONFIG_KEY);
        return config && config.localPath ? config : undefined;
    }

    /**
     * Botão "Repositório de Log": pede o destino, valida, prepara a pasta de trabalho e salva.
     */
    public static async configure(context: ExtensionContext): Promise<void> {
        const current = LogRepositoryService.getConfig(context);

        const input = await window.showInputBox({
            title: "Configurar Repositório de Log",
            prompt: (current ? `Destino atual: ${current.value}. ` : "")
                + "Cole a URL HTTPS/SSH de um repositório Git (por exemplo, https://github.com/usuario/repositorio.git) "
                + "ou o caminho de uma pasta que já seja um repositório Git. Cada exportação será registrada nele.",
            placeHolder: "https://github.com/usuario/fluig-activity-log.git",
            value: current?.value,
            ignoreFocusOut: true,
            validateInput: value => {
                const parsed = LogRepositoryService.parseTarget(value);
                return parsed.kind === "invalid" ? parsed.reason : undefined;
            }
        });

        if (input === undefined) {
            return;
        }

        const target = LogRepositoryService.parseTarget(input);
        if (target.kind === "invalid") {
            window.showErrorMessage(`Repositório de Log: ${target.reason}`);
            return;
        }

        try {
            const config = await window.withProgress(
                { location: ProgressLocation.Notification, title: "Fluig Tracker: configurando o Repositório de Log…" },
                () => target.kind === "url"
                    ? LogRepositoryService.prepareUrl(context, target.value)
                    : LogRepositoryService.preparePath(target.value)
            );

            if (!config) {
                return;
            }

            await context.globalState.update(CONFIG_KEY, config);

            if (config.source === "path" && (await LogRepositoryService.remotes(config.localPath)).length === 0) {
                window.showWarningMessage(
                    "Repositório de Log configurado, mas essa pasta não tem um remoto (origin). "
                    + "Os registros ficarão apenas locais até você adicionar um remoto."
                );
            } else {
                window.showInformationMessage(`Repositório de Log configurado: ${config.value}`);
            }
        } catch (error) {
            window.showErrorMessage(
                `Não foi possível configurar o Repositório de Log: ${LogRepositoryService.explain(error)}`
            );
        }
    }

    /**
     * Interpreta o que o usuário colou. Só valida o formato (rápido, sem rede).
     */
    public static parseTarget(input: string): ParsedTarget {
        const invalid = (reason: string): ParsedTarget => ({ kind: "invalid", reason });
        let value = (input ?? "").trim();

        // "Copiar como caminho" do Windows cola o valor entre aspas.
        if (/^(["']).*\1$/.test(value)) {
            value = value.slice(1, -1).trim();
        }

        if (!value) {
            return invalid("informe a URL do repositório ou o caminho de uma pasta.");
        }

        // github.com/usuario/repositorio (sem https://)
        if (/^(github\.com|gitlab\.com|bitbucket\.org)\//i.test(value)) {
            value = `https://${value}`;
        }

        // SSH no formato scp: git@github.com:usuario/repositorio.git
        if (/^\w[\w.-]*@[\w.-]+:[\w./~-]+$/.test(value)) {
            return { kind: "url", value };
        }

        if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
            let url: URL;
            try {
                url = new URL(value);
            } catch {
                return invalid("a URL informada não é válida.");
            }

            const protocol = url.protocol.toLowerCase();
            if (protocol !== "https:" && protocol !== "ssh:") {
                return invalid("use uma URL HTTPS ou SSH (https://github.com/usuario/repositorio.git).");
            }
            if (url.password || (protocol === "https:" && url.username)) {
                return invalid("não coloque usuário, senha ou token na URL. A autenticação usa o login do Git já configurado no seu computador.");
            }
            if (!url.hostname || url.hostname.startsWith("-") || url.username.startsWith("-")) {
                return invalid("a URL informada não é válida.");
            }
            if (url.pathname.split("/").filter(Boolean).length < 2) {
                return invalid("a URL precisa apontar para um repositório (https://github.com/usuario/repositorio.git).");
            }

            url.search = "";
            url.hash = "";
            return { kind: "url", value: url.toString().replace(/\/+$/, "") };
        }

        // Caminho local: unidade do Windows, UNC, caminho absoluto ou ~
        if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith("\\\\") || value.startsWith("/")
            || value === "~" || /^~[\\/]/.test(value)) {
            return { kind: "path", value };
        }

        return invalid("não reconheci o formato. Cole a URL do GitHub (https://github.com/usuario/repositorio.git) ou o caminho completo de uma pasta do seu computador.");
    }

    private static async prepareUrl(context: ExtensionContext, url: string): Promise<LogRepositoryConfig> {
        const localPath = LogRepositoryService.managedPath(context, url);

        if (!(existsSync(join(localPath, ".git")) && (await LogRepositoryService.isRepo(localPath)))) {
            await LogRepositoryService.cloneManaged(url, localPath);
        }

        return { source: "url", value: url, localPath };
    }

    private static async preparePath(value: string): Promise<LogRepositoryConfig | undefined> {
        const dir = resolve(LogRepositoryService.expandHome(value));

        if (!existsSync(dir) || !statSync(dir).isDirectory()) {
            throw new Error(`a pasta não existe: ${dir}`);
        }

        if (!(await LogRepositoryService.isRepo(dir))) {
            const answer = await window.showWarningMessage(
                `A pasta "${dir}" ainda não é um repositório Git. Deseja inicializá-la agora?`,
                { modal: true },
                "Inicializar"
            );
            if (answer !== "Inicializar") {
                return undefined;
            }
            await LogRepositoryService.git(["init"], dir);
        }

        return { source: "path", value: dir, localPath: dir };
    }

    // ------------------------------------------------------------------ registro da exportação

    /**
     * Registra uma exportação JÁ concluída com sucesso. Nunca lança erro e nunca bloqueia a exportação:
     * qualquer falha vira um aviso.
     */
    public static registerExport(context: ExtensionContext, record: ExportRecord): Promise<void> {
        const run = LogRepositoryService.queue.then(() => LogRepositoryService.process(context, record));
        LogRepositoryService.queue = run.catch(() => undefined);
        return run;
    }

    private static async process(context: ExtensionContext, record: ExportRecord): Promise<void> {
        const config = LogRepositoryService.getConfig(context);

        if (!config) {
            LogRepositoryService.showHint(context);
            return;
        }

        try {
            const dir = await LogRepositoryService.ensureWorkingCopy(config);
            const result = await LogRepositoryService.publish(dir, record);
            LogRepositoryService.notify(record, result);
        } catch (error) {
            window.showWarningMessage(
                `Exportação de ${record.process} concluída, mas o registro no repositório de log falhou: ${LogRepositoryService.explain(error)}`
            );
        }
    }

    private static async ensureWorkingCopy(config: LogRepositoryConfig): Promise<string> {
        if (config.source === "path") {
            if (!existsSync(config.localPath)) {
                throw new Error(`a pasta do repositório de log não existe mais (${config.localPath}). Reconfigure o Repositório de Log.`);
            }
            if (!(await LogRepositoryService.isRepo(config.localPath))) {
                throw new Error("a pasta configurada não é mais um repositório Git. Reconfigure o Repositório de Log.");
            }
            return config.localPath;
        }

        if (existsSync(join(config.localPath, ".git")) && (await LogRepositoryService.isRepo(config.localPath))) {
            return config.localPath;
        }

        // A cópia local sumiu (ex.: pasta apagada): clona de novo, uma única vez.
        await LogRepositoryService.cloneManaged(config.value, config.localPath);
        return config.localPath;
    }

    private static async publish(dir: string, record: ExportRecord): Promise<PublishResult> {
        await LogRepositoryService.assertNoPendingOperation(dir);
        await LogRepositoryService.assertLogFilesClean(dir);

        const branch = await LogRepositoryService.currentBranch(dir);
        if (!branch) {
            throw new Error("o repositório está em HEAD destacado (sem branch). Faça checkout de uma branch e tente novamente.");
        }

        const remotes = await LogRepositoryService.remotes(dir);
        const remote = remotes.includes("origin") ? "origin" : remotes[0];
        const hasRemote = Boolean(remote);

        // 1) Traz o que os outros registraram. Não é destrutivo e, sem rede, o registro segue localmente.
        let syncProblem: string | undefined;
        if (hasRemote && (await LogRepositoryService.hasCommits(dir))) {
            try {
                await LogRepositoryService.sync(dir, remote, branch);
            } catch (error) {
                syncProblem = LogRepositoryService.explain(error);
            }
        }

        // 2) Escreve o registro (guardando o estado anterior para desfazer só o que escrevemos).
        const logSnapshot = LogRepositoryService.snapshot(join(dir, LOG_FILE));
        const attributesSnapshot = LogRepositoryService.snapshot(join(dir, ATTRIBUTES_FILE));

        const now = new Date();
        const userName = await LogRepositoryService.resolveUser(dir, record.fallbackUser);
        LogRepositoryService.writeEntry(dir, LogRepositoryService.formatEntry({
            user: userName,
            date: LogRepositoryService.formatDate(now),
            time: LogRepositoryService.formatTime(now),
            process: record.process,
            operation: record.operation || DEFAULT_OPERATION
        }));

        const files = [LOG_FILE];
        const touched = [logSnapshot];
        if (LogRepositoryService.ensureMergeRule(dir)) {
            files.push(ATTRIBUTES_FILE);
            touched.push(attributesSnapshot);
        }

        // 3) Commit somente dos arquivos do registro (nunca "git add .").
        const commitMessage = `Fluig Activity: Export ${record.process} - ${LogRepositoryService.formatDate(now)}`;
        try {
            await LogRepositoryService.git(["add", "--", ...files], dir);

            const staged = (await LogRepositoryService.git(["diff", "--cached", "--name-only", "--", ...files], dir)).trim();
            if (!staged) {
                return { commitMessage, hasRemote, pushed: false, problem: "não havia nada novo para registrar" };
            }

            await LogRepositoryService.git(
                [...(await LogRepositoryService.identityArgs(dir)), "commit", "-q", "-m", commitMessage, "--", ...files],
                dir
            );
        } catch (error) {
            await LogRepositoryService.rollback(dir, files, touched);
            throw error;
        }

        // 4) Envia. Se o remoto avançou no meio do caminho, sincroniza e tenta mais uma vez.
        let pushed = false;
        let problem = syncProblem && `a sincronização falhou (${syncProblem})`;

        if (hasRemote) {
            try {
                await LogRepositoryService.push(dir, remote);
                pushed = true;
                problem = undefined;
            } catch (error) {
                let last: unknown = error;
                if (/rejected|non-fast-forward|fetch first|failed to push some refs/i.test(LogRepositoryService.rawError(error))) {
                    try {
                        await LogRepositoryService.sync(dir, remote, branch);
                        await LogRepositoryService.push(dir, remote);
                        pushed = true;
                        problem = undefined;
                    } catch (second) {
                        last = second;
                    }
                }
                if (!pushed) {
                    problem = LogRepositoryService.explain(last);
                }
            }
        }

        return { commitMessage, hasRemote, pushed, problem };
    }

    private static notify(record: ExportRecord, result: PublishResult): void {
        if (result.pushed) {
            window.showInformationMessage(`Fluig Activity atualizado: ${result.commitMessage}`);
        } else if (!result.hasRemote) {
            window.showWarningMessage(
                `Exportação de ${record.process} registrada apenas localmente: o repositório de log não tem um remoto configurado.`
            );
        } else {
            window.showWarningMessage(
                `Exportação de ${record.process} registrada localmente, mas o envio ao repositório remoto falhou: ${result.problem}. `
                + "O registro será enviado junto com a próxima exportação."
            );
        }
    }

    private static showHint(context: ExtensionContext): void {
        if (LogRepositoryService.hintShown) {
            return;
        }
        LogRepositoryService.hintShown = true;

        void window.showInformationMessage(
            "Quer registrar suas exportações em um repositório Git? Configure o Repositório de Log.",
            "Configurar"
        ).then(choice => {
            if (choice === "Configurar") {
                void LogRepositoryService.configure(context);
            }
        });
    }

    // ------------------------------------------------------------------ formato do registro

    /** Um registro = uma linha da tabela (ver a nota sobre "union" no topo do arquivo). */
    private static formatEntry(entry: { user: string; date: string; time: string; process: string; operation: string }): string {
        const cell = LogRepositoryService.cell;
        return `| ${cell(entry.user)} | ${entry.date} | ${entry.time} | ${cell(entry.process)} | ${cell(entry.operation)} |\n`;
    }

    private static header(hasLegacyLog: boolean): string {
        const lines = [
            "# Histórico de Exportações — Fluig Tracker",
            "",
            "> Registro automático gerado pela extensão Fluig Tracker. Cada exportação bem-sucedida acrescenta uma linha à tabela abaixo."
        ];
        if (hasLegacyLog) {
            lines.push(">", `> Registros anteriores a este formato: [${LEGACY_LOG_FILE}](${LEGACY_LOG_FILE}).`);
        }
        lines.push("", "| Responsável | Data | Horário | Processo | Operação |", "|---|---|---|---|---|", "");
        return lines.join("\n");
    }

    private static writeEntry(dir: string, entry: string): void {
        const file = join(dir, LOG_FILE);

        if (!existsSync(file)) {
            writeFileSync(file, LogRepositoryService.header(existsSync(join(dir, LEGACY_LOG_FILE))), "utf-8");
        } else if (!LogRepositoryService.endsWithNewline(file)) {
            appendFileSync(file, "\n", "utf-8");
        }

        appendFileSync(file, entry, "utf-8");
    }

    /** Garante a regra de mesclagem "union" para o log. Retorna true se alterou o .gitattributes. */
    private static ensureMergeRule(dir: string): boolean {
        const file = join(dir, ATTRIBUTES_FILE);
        const current = existsSync(file) ? readFileSync(file, "utf-8") : "";

        if (new RegExp(`^\\s*${LOG_FILE.replace(".", "\\.")}\\s+.*\\bmerge=`, "m").test(current)) {
            return false;
        }

        appendFileSync(file, `${current && !current.endsWith("\n") ? "\n" : ""}${ATTRIBUTES_RULE}\n`, "utf-8");
        return true;
    }

    private static cell(value: string): string {
        const text = value.replace(/\r?\n|\r/g, " ").replace(/\|/g, "\\|").trim().slice(0, 200);
        return text || "-";
    }

    private static pad(value: number): string {
        return String(value).padStart(2, "0");
    }

    private static formatDate(date: Date): string {
        return `${LogRepositoryService.pad(date.getDate())}/${LogRepositoryService.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    }

    private static formatTime(date: Date): string {
        return `${LogRepositoryService.pad(date.getHours())}:${LogRepositoryService.pad(date.getMinutes())}:${LogRepositoryService.pad(date.getSeconds())}`;
    }

    private static endsWithNewline(file: string): boolean {
        const size = statSync(file).size;
        if (size === 0) {
            return true;
        }

        const fd = openSync(file, "r");
        try {
            const buffer = Buffer.alloc(1);
            readSync(fd, buffer, 0, 1, size - 1);
            return buffer[0] === 0x0a;
        } finally {
            closeSync(fd);
        }
    }

    // ------------------------------------------------------------------ identidade

    private static async resolveUser(dir: string, fallback?: string): Promise<string> {
        const gitName = await LogRepositoryService.gitConfigValue(dir, "user.name");
        if (gitName) {
            return gitName;
        }
        if (fallback && !fallback.includes("@")) {
            return fallback.trim();
        }
        return UNKNOWN_USER;
    }

    /** Só entra em cena se o Git do usuário não tiver identidade: evita falha de commit. */
    private static async identityArgs(dir: string): Promise<string[]> {
        const args: string[] = [];
        if (!(await LogRepositoryService.gitConfigValue(dir, "user.name"))) {
            args.push("-c", `user.name=${FALLBACK_AUTHOR_NAME}`);
        }
        if (!(await LogRepositoryService.gitConfigValue(dir, "user.email"))) {
            args.push("-c", `user.email=${FALLBACK_AUTHOR_EMAIL}`);
        }
        return args;
    }

    // ------------------------------------------------------------------ Git

    private static async git(
        args: string[],
        cwd?: string,
        options: { timeout?: number; interactive?: boolean } = {}
    ): Promise<string> {
        const env: NodeJS.ProcessEnv = { ...process.env, LC_ALL: "C", LANGUAGE: "en" };
        if (!options.interactive) {
            // Segundo plano: nunca ficar preso esperando usuário/senha no terminal.
            env.GIT_TERMINAL_PROMPT = "0";
        }

        const { stdout } = await execFileAsync("git", args, {
            cwd,
            env,
            encoding: "utf8",
            timeout: options.timeout ?? LOCAL_TIMEOUT,
            windowsHide: true,
            maxBuffer: 10 * 1024 * 1024
        });
        return stdout;
    }

    private static async isRepo(dir: string): Promise<boolean> {
        try {
            return (await LogRepositoryService.git(["rev-parse", "--is-inside-work-tree"], dir)).trim() === "true";
        } catch {
            return false;
        }
    }

    private static async hasCommits(dir: string): Promise<boolean> {
        try {
            await LogRepositoryService.git(["rev-parse", "--verify", "-q", "HEAD"], dir);
            return true;
        } catch {
            return false;
        }
    }

    private static async currentBranch(dir: string): Promise<string> {
        try {
            return (await LogRepositoryService.git(["symbolic-ref", "--short", "-q", "HEAD"], dir)).trim();
        } catch {
            return "";
        }
    }

    private static async remotes(dir: string): Promise<string[]> {
        try {
            return (await LogRepositoryService.git(["remote"], dir)).split(/\r?\n/).map(r => r.trim()).filter(Boolean);
        } catch {
            return [];
        }
    }

    private static async gitConfigValue(dir: string, key: string): Promise<string> {
        try {
            return (await LogRepositoryService.git(["config", key], dir)).trim();
        } catch {
            return "";
        }
    }

    private static async isRebasing(dir: string): Promise<boolean> {
        try {
            const gitDir = resolve(dir, (await LogRepositoryService.git(["rev-parse", "--git-dir"], dir)).trim());
            return ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD"].some(name => existsSync(join(gitDir, name)));
        } catch {
            return false;
        }
    }

    private static async assertNoPendingOperation(dir: string): Promise<void> {
        if (await LogRepositoryService.isRebasing(dir)) {
            throw new Error("há uma operação do Git pendente (rebase/merge) nesse repositório. Conclua ou aborte e tente novamente.");
        }
    }

    /** Não incorpora nem descarta alterações que já estavam nos arquivos de log do usuário. */
    private static async assertLogFilesClean(dir: string): Promise<void> {
        const pending = await LogRepositoryService.git(
            ["status", "--porcelain=v1", "--untracked-files=all", "--", LOG_FILE, ATTRIBUTES_FILE],
            dir
        );
        if (pending.trim()) {
            throw new Error(
                `"${LOG_FILE}" ou "${ATTRIBUTES_FILE}" tem alterações locais pendentes. `
                + "Faça commit dessas alterações antes de registrar outra exportação."
            );
        }
    }

    /** git pull --rebase: sem autostash, sem reset, sem force. Se algo der errado, aborta o rebase. */
    private static async sync(dir: string, remote: string, branch: string): Promise<void> {
        let hasUpstream = true;
        try {
            await LogRepositoryService.git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], dir);
        } catch {
            hasUpstream = false;
        }

        const args = hasUpstream
            ? ["pull", "--rebase", "--quiet"]
            : ["pull", "--rebase", "--quiet", remote, branch];

        try {
            await LogRepositoryService.git(args, dir, { timeout: NETWORK_TIMEOUT });
        } catch (error) {
            if (await LogRepositoryService.isRebasing(dir)) {
                try {
                    await LogRepositoryService.git(["rebase", "--abort"], dir);
                } catch {
                    // melhor esforço: o aviso ao usuário já explica o problema original
                }
            }
            // A branch ainda não existe no remoto: não há o que sincronizar (o push cria).
            if (/couldn't find remote ref|no such ref was fetched/i.test(LogRepositoryService.rawError(error))) {
                return;
            }
            throw error;
        }
    }

    private static async push(dir: string, remote: string): Promise<void> {
        await LogRepositoryService.git(["push", "--quiet", remote, "HEAD"], dir, { timeout: NETWORK_TIMEOUT });
    }

    private static async cloneManaged(url: string, dir: string): Promise<void> {
        if (existsSync(dir) && readdirSync(dir).length > 0) {
            throw new Error(`a pasta de trabalho local já existe e não é um repositório Git válido: ${dir}. Remova essa pasta e configure novamente.`);
        }

        mkdirSync(dirname(dir), { recursive: true });

        // Primeiro verifica acesso e credenciais (pode abrir o login do Git); depois clona.
        await LogRepositoryService.git(["ls-remote", "--", url], undefined, { timeout: CLONE_TIMEOUT, interactive: true });
        await LogRepositoryService.git(["clone", "--", url, dir], undefined, { timeout: CLONE_TIMEOUT, interactive: true });
    }

    private static async rollback(dir: string, files: string[], touched: FileSnapshot[]): Promise<void> {
        try {
            await LogRepositoryService.git(["reset", "-q", "--", ...files], dir);
        } catch {
            try {
                await LogRepositoryService.git(["rm", "--cached", "-q", "--ignore-unmatch", "--", ...files], dir);
            } catch {
                // nada a desfazer no índice
            }
        }
        touched.forEach(snapshot => LogRepositoryService.restore(snapshot));
    }

    private static snapshot(path: string): FileSnapshot {
        const existed = existsSync(path);
        return { path, existed, size: existed ? statSync(path).size : 0 };
    }

    /** Desfaz somente os bytes que escrevemos (ou apaga o arquivo se fomos nós que o criamos). */
    private static restore(snapshot: FileSnapshot): void {
        try {
            if (!snapshot.existed) {
                if (existsSync(snapshot.path)) {
                    unlinkSync(snapshot.path);
                }
            } else {
                truncateSync(snapshot.path, snapshot.size);
            }
        } catch {
            // melhor esforço
        }
    }

    // ------------------------------------------------------------------ caminhos e erros

    private static expandHome(value: string): string {
        if (value === "~") {
            return homedir();
        }
        return /^~[\\/]/.test(value) ? join(homedir(), value.slice(2)) : value;
    }

    private static managedPath(context: ExtensionContext, url: string): string {
        const normalized = url.toLowerCase().replace(/\/+$/, "").replace(/\.git$/, "");
        const hash = createHash("sha1").update(normalized).digest("hex").slice(0, 8);
        const name = (normalized.split(/[/:]/).filter(Boolean).pop() || "repo").replace(/[^\w.-]/g, "_");
        return join(context.globalStorageUri.fsPath, "log-repositories", `${name}-${hash}`);
    }

    private static rawError(error: unknown): string {
        const e = error as { stderr?: unknown; message?: unknown } | undefined;
        return String(e?.stderr || e?.message || error || "");
    }

    /** Nunca deixa token ou senha vazar para mensagens. */
    private static sanitize(text: string): string {
        return text
            .replace(/(https?:\/\/)[^\s/@]+@/gi, "$1***@")
            .replace(/(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g, "***")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 300);
    }

    private static explain(error: unknown): string {
        const e = error as { code?: unknown; killed?: boolean } | undefined;
        const raw = LogRepositoryService.rawError(error);

        if (e?.code === "ENOENT") {
            return "o Git não foi encontrado. Instale o Git e reinicie o VS Code.";
        }
        if (e?.killed) {
            return "tempo esgotado ao acessar o repositório.";
        }
        if (/authentication failed|could not read (username|password)|terminal prompts disabled|permission denied \(publickey\)|invalid username or password|returned error: 403|access denied/i.test(raw)) {
            return "falha de autenticação. Entre na sua conta do GitHub (Git Credential Manager) ou configure sua chave SSH e tente novamente.";
        }
        if (/repository .*not found|returned error: 404|does not appear to be a git repository/i.test(raw)) {
            return "repositório não encontrado ou sem permissão de acesso.";
        }
        if (/could not resolve host|unable to access|connection (timed out|refused|reset)|network is unreachable|failed to connect/i.test(raw)) {
            return "sem conexão com o repositório remoto.";
        }
        return LogRepositoryService.sanitize(raw) || "erro desconhecido ao executar o Git.";
    }
}
