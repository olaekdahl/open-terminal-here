import * as vscode from "vscode";

function getCwd(uri?: vscode.Uri): string | undefined {
  if (!uri) {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  return uri.fsPath;
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("openTerminalHere.powershell", (uri?: vscode.Uri) => {
      vscode.window.createTerminal({
        name: "PowerShell Here",
        cwd: getCwd(uri),
        shellPath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
      }).show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openTerminalHere.cmd", (uri?: vscode.Uri) => {
      vscode.window.createTerminal({
        name: "CMD Here",
        cwd: getCwd(uri),
        shellPath: "C:\\Windows\\System32\\cmd.exe"
      }).show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openTerminalHere.wsl", (uri?: vscode.Uri) => {
      const cwd = getCwd(uri);

      vscode.window.createTerminal({
        name: "WSL Here",
        shellPath: "C:\\Windows\\System32\\wsl.exe",
        shellArgs: cwd ? ["--cd", cwd] : []
      }).show();
    })
  );
}

export function deactivate() {}