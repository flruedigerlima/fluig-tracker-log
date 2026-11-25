import * as vscode from "vscode";

const TRACKER_SECTION = "fluigTracker";
const LEGACY_SECTION = "fluiggers";

/** Lê preferencialmente as configurações próprias do Tracker e mantém compatibilidade com fluiggers.*. */
export function getFluigTrackerSetting<T>(
    key: string,
    defaultValue: T,
    resource?: vscode.Uri
): T {
    const tracker = vscode.workspace.getConfiguration(TRACKER_SECTION, resource);
    const legacy = vscode.workspace.getConfiguration(LEGACY_SECTION, resource);
    const inspected = tracker.inspect<T>(key);
    const hasTrackerValue = inspected && [
        inspected.globalValue,
        inspected.workspaceValue,
        inspected.workspaceFolderValue,
        inspected.globalLanguageValue,
        inspected.workspaceLanguageValue,
        inspected.workspaceFolderLanguageValue
    ].some(value => value !== undefined);

    return hasTrackerValue
        ? tracker.get<T>(key, defaultValue)
        : legacy.get<T>(key, defaultValue);
}

export function updateFluigTrackerSetting(
    key: string,
    value: unknown,
    target: vscode.ConfigurationTarget,
    resource?: vscode.Uri
): Thenable<void> {
    return vscode.workspace.getConfiguration(TRACKER_SECTION, resource).update(key, value, target);
}
