import * as vscode from "vscode";
import { LogRepositoryService } from "../services/LogRepositoryService";

export class LogRepositoryExtension {
    public static activate(context: vscode.ExtensionContext): void {
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluig-tracker-vscode-extension.configureLogRepository",
            () => LogRepositoryService.configure(context)
        ));
    }
}
