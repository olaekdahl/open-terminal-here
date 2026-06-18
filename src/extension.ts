import * as vscode from "vscode";
import { ShellDef, getAvailableShells, shellDefs, wslHasDistro } from "./shells";

const REFRESH_COMMAND_ID = "openTerminalHere.refresh";
const HAS_SHELLS_CONTEXT = "openTerminalHere.hasShells";

export function getCwd(uri?: vscode.Uri): string | undefined {
  if (!uri) {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  return uri.fsPath;
}

function buildOptions(def: ShellDef, shellPath: string, cwd?: string): vscode.TerminalOptions {
  const options: vscode.TerminalOptions = {
    name: `${def.label} Here`,
    shellPath
  };

  if (def.usesCwdOption) {
    options.cwd = cwd;
  } else {
    options.shellArgs = cwd ? ["--cd", cwd] : [];
  }

  return options;
}

function openTerminal(def: ShellDef, uri?: vscode.Uri): void {
  if (!def.platforms.includes(process.platform)) {
    vscode.window.showErrorMessage(`${def.label} is not available on this platform.`);
    return;
  }

  const shellPath = def.detect();
  if (!shellPath) {
    vscode.window.showErrorMessage(`${def.label} could not be found on this machine.`);
    return;
  }

  vscode.window.createTerminal(buildOptions(def, shellPath, getCwd(uri))).show();
}

function setContext(key: string, value: boolean): Thenable<unknown> {
  return vscode.commands.executeCommand("setContext", key, value);
}

async function refreshShellContexts(): Promise<void> {
  const availableIds = new Set(getAvailableShells().map((shell) => shell.def.id));
  let hasShells = false;

  // Every shell except WSL is resolved synchronously.
  for (const def of shellDefs) {
    if (def.id === "wsl") {
      continue;
    }

    const isAvailable = availableIds.has(def.id);
    hasShells = hasShells || isAvailable;
    await setContext(def.contextKey, isAvailable);
  }

  await setContext(HAS_SHELLS_CONTEXT, hasShells);

  // WSL is only offered when wsl.exe exists and a distribution is installed.
  const wsl = shellDefs.find((def) => def.id === "wsl");
  if (!wsl) {
    return;
  }

  const wslPath = wsl.detect();
  const wslAvailable = wslPath ? await wslHasDistro(wslPath) : false;
  await setContext(wsl.contextKey, wslAvailable);

  if (wslAvailable && !hasShells) {
    await setContext(HAS_SHELLS_CONTEXT, true);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  for (const def of shellDefs) {
    context.subscriptions.push(
      vscode.commands.registerCommand(def.commandId, (uri?: vscode.Uri) =>
        openTerminal(def, uri)
      )
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand(REFRESH_COMMAND_ID, () => refreshShellContexts())
  );

  void refreshShellContexts();
}

export function deactivate(): void {}