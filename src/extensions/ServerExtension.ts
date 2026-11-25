import * as vscode from 'vscode';
import {DatasetItem, ServerItem, ServerItemProvider} from "../providers/ServerItemProvider";
import { ServerService } from '../services/ServerService';

export class ServerExtension {

    public static async activate(context: vscode.ExtensionContext): Promise<void> {
        if (!(await ServerService.checkServerConfigVersion())) {
            throw new Error("Erro na versão do arquivo de configuração.");
        }

        const serverItemProvider = new ServerItemProvider(context);
        vscode.window.registerTreeDataProvider("fluig-tracker-vscode-extension.servers", serverItemProvider);

        context.subscriptions.push(vscode.commands.registerCommand(
            "fluig-tracker-vscode-extension.addServer",
            () => serverItemProvider.add()
        ));
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluig-tracker-vscode-extension.changeServerConfigPath",
            () => serverItemProvider.changeConfigPath()
        ));
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluig-tracker-vscode-extension.refreshServer",
            () => serverItemProvider.refresh()
        ));
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluig-tracker-vscode-extension.editServer",
            (serverItem: ServerItem) => serverItemProvider.update(serverItem)
        ));
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluig-tracker-vscode-extension.deleteServer",
            (serverItem: ServerItem) => serverItemProvider.delete(serverItem)
        ));
        context.subscriptions.push(vscode.commands.registerCommand(
            "fluig-tracker-vscode-extension.datasetView",
            (datasetItem: DatasetItem) => serverItemProvider.datasetView(datasetItem)
        ));
    }
}
