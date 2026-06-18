import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const system32 = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32");

interface TerminalCommand {
  id: string;
  name: string;
  shellPath: string;
  usesCwdOption: boolean;
}

const terminalCommands: TerminalCommand[] = [
  {
    id: "openTerminalHere.powershell",
    name: "PowerShell Here",
    shellPath: path.join(system32, "WindowsPowerShell", "v1.0", "powershell.exe"),
    usesCwdOption: true
  },
  {
    id: "openTerminalHere.cmd",
    name: "CMD Here",
    shellPath: path.join(system32, "cmd.exe"),
    usesCwdOption: true
  },
  {
    id: "openTerminalHere.wsl",
    name: "WSL Here",
    shellPath: path.join(system32, "wsl.exe"),
    usesCwdOption: false
  }
];

export function getCwd(uri?: vscode.Uri): string | undefined {
  if (!uri) {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  return uri.fsPath;
}

function openTerminal(command: TerminalCommand, uri?: vscode.Uri): void {
  if (process.platform !== "win32") {
    vscode.window.showErrorMessage("Open Terminal Here is only supported on Windows.");
    return;
  }

  if (!fs.existsSync(command.shellPath)) {
    vscode.window.showErrorMessage(
      `Open Terminal Here: '${command.shellPath}' was not found.`
    );
    return;
  }

  const cwd = getCwd(uri);
  const options: vscode.TerminalOptions = {
    name: command.name,
    shellPath: command.shellPath
  };

  if (command.usesCwdOption) {
    options.cwd = cwd;
  } else {
    options.shellArgs = cwd ? ["--cd", cwd] : [];
  }

  vscode.window.createTerminal(options).show();
}

export function activate(context: vscode.ExtensionContext) {
  for (const command of terminalCommands) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command.id, (uri?: vscode.Uri) =>
        openTerminal(command, uri)
      )
    );
  }
}

export function deactivate() {}