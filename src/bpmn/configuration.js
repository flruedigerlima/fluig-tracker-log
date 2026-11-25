'use strict';

/** Lê fluigTracker.* e recorre às preferências fluiggers.* já existentes quando necessário. */
function getFluigTrackerSetting(vscode, key, defaultValue, resource) {
  const tracker = vscode.workspace.getConfiguration('fluigTracker', resource);
  const legacy = vscode.workspace.getConfiguration('fluiggers', resource);
  if (typeof tracker.inspect === 'function') {
    const inspected = tracker.inspect(key);
    const hasTrackerValue = inspected && [
      inspected.globalValue, inspected.workspaceValue, inspected.workspaceFolderValue,
      inspected.globalLanguageValue, inspected.workspaceLanguageValue, inspected.workspaceFolderLanguageValue
    ].some((value) => value !== undefined);
    return hasTrackerValue ? tracker.get(key, defaultValue) : legacy.get(key, defaultValue);
  }
  const legacyValue = legacy.get(key);
  return legacyValue !== undefined ? legacyValue : tracker.get(key, defaultValue);
}

module.exports = { getFluigTrackerSetting };
