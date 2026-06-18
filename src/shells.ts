import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";

const system32 = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32");

export interface ShellDef {
  id: string;
  label: string;
  commandId: string;
  contextKey: string;
  platforms: NodeJS.Platform[];
  /** When true the working directory is passed via the `cwd` option; WSL uses `--cd` instead. */
  usesCwdOption: boolean;
  /** Synchronous detection. Returns the resolved absolute shell path, or undefined. */
  detect(): string | undefined;
}

export interface AvailableShell {
  def: ShellDef;
  shellPath: string;
}

function isFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolves an executable on the PATH and returns its absolute path, or undefined.
 * The name is tried as-is first; on Windows each PATHEXT extension is also tried.
 */
export function which(executable: string): string | undefined {
  const envPath = process.env.PATH;
  if (!envPath) {
    return undefined;
  }

  const dirs = envPath.split(path.delimiter).filter((dir) => dir.length > 0);
  const exts =
    process.platform === "win32"
      ? ["", ...(process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")]
      : [""];

  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.join(dir, executable + ext);
      if (isFile(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

/** Returns the first path that exists as a file, or undefined. */
export function firstExisting(paths: string[]): string | undefined {
  return paths.find(isFile);
}

/** Reads /etc/shells (macOS/Linux) and returns the existing shell paths it lists. */
export function readEtcShells(): string[] {
  try {
    return fs
      .readFileSync("/etc/shells", "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .filter(isFile);
  } catch {
    return [];
  }
}

function etcShell(name: string): string | undefined {
  return readEtcShells().find((shell) => path.basename(shell) === name);
}

function programFilesDirs(): string[] {
  return [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.ProgramW6432
  ].filter((dir): dir is string => typeof dir === "string" && dir.length > 0);
}

export const shellDefs: ShellDef[] = [
  {
    id: "powershell",
    label: "PowerShell",
    commandId: "openTerminalHere.powershell",
    contextKey: "openTerminalHere.powershellAvailable",
    platforms: ["win32"],
    usesCwdOption: true,
    detect: () =>
      firstExisting([path.join(system32, "WindowsPowerShell", "v1.0", "powershell.exe")])
  },
  {
    id: "pwsh",
    label: "PowerShell 7",
    commandId: "openTerminalHere.pwsh",
    contextKey: "openTerminalHere.pwshAvailable",
    platforms: ["win32", "darwin", "linux"],
    usesCwdOption: true,
    detect: () =>
      which(process.platform === "win32" ? "pwsh.exe" : "pwsh") ??
      firstExisting(programFilesDirs().map((dir) => path.join(dir, "PowerShell", "7", "pwsh.exe")))
  },
  {
    id: "cmd",
    label: "Command Prompt",
    commandId: "openTerminalHere.cmd",
    contextKey: "openTerminalHere.cmdAvailable",
    platforms: ["win32"],
    usesCwdOption: true,
    detect: () => firstExisting([path.join(system32, "cmd.exe")])
  },
  {
    id: "gitbash",
    label: "Git Bash",
    commandId: "openTerminalHere.gitbash",
    contextKey: "openTerminalHere.gitbashAvailable",
    platforms: ["win32"],
    usesCwdOption: true,
    detect: () =>
      firstExisting(programFilesDirs().map((dir) => path.join(dir, "Git", "bin", "bash.exe")))
  },
  {
    id: "wsl",
    label: "WSL",
    commandId: "openTerminalHere.wsl",
    contextKey: "openTerminalHere.wslAvailable",
    platforms: ["win32"],
    usesCwdOption: false,
    detect: () => firstExisting([path.join(system32, "wsl.exe")])
  },
  {
    id: "zsh",
    label: "Zsh",
    commandId: "openTerminalHere.zsh",
    contextKey: "openTerminalHere.zshAvailable",
    platforms: ["darwin", "linux"],
    usesCwdOption: true,
    detect: () => which("zsh") ?? firstExisting(["/bin/zsh", "/usr/bin/zsh"]) ?? etcShell("zsh")
  },
  {
    id: "bash",
    label: "Bash",
    commandId: "openTerminalHere.bash",
    contextKey: "openTerminalHere.bashAvailable",
    platforms: ["darwin", "linux"],
    usesCwdOption: true,
    detect: () => which("bash") ?? firstExisting(["/bin/bash", "/usr/bin/bash"]) ?? etcShell("bash")
  },
  {
    id: "fish",
    label: "Fish",
    commandId: "openTerminalHere.fish",
    contextKey: "openTerminalHere.fishAvailable",
    platforms: ["darwin", "linux"],
    usesCwdOption: true,
    detect: () =>
      which("fish") ??
      firstExisting(["/usr/local/bin/fish", "/usr/bin/fish", "/opt/homebrew/bin/fish"]) ??
      etcShell("fish")
  },
  {
    id: "sh",
    label: "sh",
    commandId: "openTerminalHere.sh",
    contextKey: "openTerminalHere.shAvailable",
    platforms: ["darwin", "linux"],
    usesCwdOption: true,
    detect: () => firstExisting(["/bin/sh", "/usr/bin/sh"]) ?? etcShell("sh")
  }
];

/** Returns the shells available on the given platform (synchronous detection only). */
export function getAvailableShells(
  platform: NodeJS.Platform = process.platform
): AvailableShell[] {
  const available: AvailableShell[] = [];

  for (const def of shellDefs) {
    if (!def.platforms.includes(platform)) {
      continue;
    }

    const shellPath = def.detect();
    if (shellPath) {
      available.push({ def, shellPath });
    }
  }

  return available;
}

/**
 * Resolves whether WSL has at least one installed distribution.
 * `wsl.exe --list --quiet` emits UTF-16LE; empty output means no distro is installed.
 */
export function wslHasDistro(wslPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(
      wslPath,
      ["--list", "--quiet"],
      { timeout: 3000, windowsHide: true, encoding: "buffer" },
      (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }

        const text = Buffer.from(stdout).toString("utf16le").replace(/\0/g, "").trim();
        resolve(text.length > 0);
      }
    );
  });
}
