import * as vscode from "vscode";
import { LaunchSpec, ShellDef, getAvailableShells, shellDefs, wslListDistros } from "./shells";

const REFRESH_COMMAND_ID = "openTerminalHere.refresh";
const HAS_SHELLS_CONTEXT = "openTerminalHere.hasShells";

export function getCwd(uri?: vscode.Uri): string | undefined {
  if (!uri) {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  return uri.fsPath;
}

function buildOptions(def: ShellDef, spec: LaunchSpec, cwd?: string): vscode.TerminalOptions {
  const options: vscode.TerminalOptions = {
    name: `${def.label} Here`,
    shellPath: spec.shellPath,
    iconPath: new vscode.ThemeIcon(def.icon)
  };

  if (def.color) {
    options.color = new vscode.ThemeColor(def.color);
  }

  if (spec.env) {
    options.env = spec.env;
  }

  const args = [...(spec.args ?? [])];
  if (spec.cwdAsArg) {
    if (cwd) {
      args.push("--cd", cwd);
    }
  } else {
    options.cwd = cwd;
  }

  if (args.length > 0) {
    options.shellArgs = args;
  }

  return options;
}

async function openWslTerminal(def: ShellDef, spec: LaunchSpec, cwd?: string): Promise<void> {
  const distros = await wslListDistros(spec.shellPath);
  if (distros.length === 0) {
    vscode.window.showErrorMessage("No WSL distributions are installed.");
    return;
  }

  let distro = distros[0];
  if (distros.length > 1) {
    const picked = await vscode.window.showQuickPick(distros, {
      placeHolder: "Select a WSL distribution"
    });
    if (!picked) {
      return;
    }
    distro = picked;
  }

  const args = ["-d", distro];
  if (cwd) {
    args.push("--cd", cwd);
  }

  const options: vscode.TerminalOptions = {
    name: `${distro} (WSL) Here`,
    shellPath: spec.shellPath,
    shellArgs: args,
    iconPath: new vscode.ThemeIcon(def.icon)
  };
  if (def.color) {
    options.color = new vscode.ThemeColor(def.color);
  }

  vscode.window.createTerminal(options).show();
}

function openTerminal(def: ShellDef, uri?: vscode.Uri): void {
  if (!def.platforms.includes(process.platform)) {
    vscode.window.showErrorMessage(`${def.label} is not available on this platform.`);
    return;
  }

  const spec = def.resolve();
  if (!spec) {
    vscode.window.showErrorMessage(`${def.label} could not be found on this machine.`);
    return;
  }

  if (def.id === "wsl") {
    void openWslTerminal(def, spec, getCwd(uri));
    return;
  }

  vscode.window.createTerminal(buildOptions(def, spec, getCwd(uri))).show();
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

  // WSL is only offered when wsl.exe exists and at least one distribution is installed.
  const wsl = shellDefs.find((def) => def.id === "wsl");
  if (!wsl) {
    return;
  }

  const wslPath = wsl.resolve()?.shellPath;
  const wslAvailable = wslPath ? (await wslListDistros(wslPath)).length > 0 : false;
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