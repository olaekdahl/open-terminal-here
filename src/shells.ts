import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const system32 = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32");
const isWindows = process.platform === "win32";

export interface LaunchSpec {
  shellPath: string;
  args?: string[];
  env?: Record<string, string>;
  /** When true, the working directory is appended as ["--cd", cwd] (WSL); otherwise it is set via the cwd option. */
  cwdAsArg?: boolean;
}

export interface ShellDef {
  id: string;
  label: string;
  commandId: string;
  contextKey: string;
  platforms: NodeJS.Platform[];
  /** Codicon id used for the terminal tab icon. */
  icon: string;
  /** Optional ThemeColor id for the terminal tab color. */
  color?: string;
  /** Detects availability and returns how to launch the shell, or undefined when unavailable. */
  resolve(): LaunchSpec | undefined;
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
  const exts = isWindows
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

/** Locates the Visual Studio Developer Command Prompt batch file, if installed. */
function vsDevCmdPath(): string | undefined {
  const roots = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(
    (root): root is string => typeof root === "string" && root.length > 0
  );
  const years = ["2022", "2019"];
  const editions = ["Enterprise", "Professional", "Community", "BuildTools", "Preview"];

  for (const root of roots) {
    for (const year of years) {
      for (const edition of editions) {
        const bat = path.join(
          root,
          "Microsoft Visual Studio",
          year,
          edition,
          "Common7",
          "Tools",
          "VsDevCmd.bat"
        );
        if (isFile(bat)) {
          return bat;
        }
      }
    }
  }

  return undefined;
}

/** Locates an Anaconda/Miniconda base directory containing Scripts\activate.bat (Windows). */
function condaBase(): string | undefined {
  const home = os.homedir();
  const programData = process.env.ProgramData ?? "C:\\ProgramData";
  const candidates = [
    path.join(home, "anaconda3"),
    path.join(home, "miniconda3"),
    path.join(home, "AppData", "Local", "Continuum", "anaconda3"),
    path.join(programData, "Anaconda3"),
    path.join(programData, "Miniconda3"),
    "C:\\Anaconda3",
    "C:\\Miniconda3"
  ];

  return candidates.find((base) => isFile(path.join(base, "Scripts", "activate.bat")));
}

export const shellDefs: ShellDef[] = [
  {
    id: "powershell",
    label: "PowerShell",
    commandId: "openTerminalHere.powershell",
    contextKey: "openTerminalHere.powershellAvailable",
    platforms: ["win32"],
    icon: "terminal-powershell",
    color: "terminal.ansiBlue",
    resolve: () => {
      const shellPath = firstExisting([
        path.join(system32, "WindowsPowerShell", "v1.0", "powershell.exe")
      ]);
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "pwsh",
    label: "PowerShell 7",
    commandId: "openTerminalHere.pwsh",
    contextKey: "openTerminalHere.pwshAvailable",
    platforms: ["win32", "darwin", "linux"],
    icon: "terminal-powershell",
    color: "terminal.ansiBlue",
    resolve: () => {
      const shellPath =
        which(isWindows ? "pwsh.exe" : "pwsh") ??
        firstExisting(programFilesDirs().map((dir) => path.join(dir, "PowerShell", "7", "pwsh.exe")));
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "pwsh-preview",
    label: "PowerShell Preview",
    commandId: "openTerminalHere.pwshPreview",
    contextKey: "openTerminalHere.pwshPreviewAvailable",
    platforms: ["win32", "darwin", "linux"],
    icon: "terminal-powershell",
    color: "terminal.ansiBrightBlue",
    resolve: () => {
      const shellPath =
        which(isWindows ? "pwsh-preview.exe" : "pwsh-preview") ??
        firstExisting(
          programFilesDirs().map((dir) => path.join(dir, "PowerShell", "7-preview", "pwsh.exe"))
        );
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "cmd",
    label: "Command Prompt",
    commandId: "openTerminalHere.cmd",
    contextKey: "openTerminalHere.cmdAvailable",
    platforms: ["win32"],
    icon: "terminal-cmd",
    color: "terminal.ansiYellow",
    resolve: () => {
      const shellPath = firstExisting([path.join(system32, "cmd.exe")]);
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "devcmd",
    label: "Developer Command Prompt",
    commandId: "openTerminalHere.devcmd",
    contextKey: "openTerminalHere.devcmdAvailable",
    platforms: ["win32"],
    icon: "terminal-cmd",
    color: "terminal.ansiMagenta",
    resolve: () => {
      const cmd = firstExisting([path.join(system32, "cmd.exe")]);
      const bat = vsDevCmdPath();
      return cmd && bat ? { shellPath: cmd, args: ["/k", bat] } : undefined;
    }
  },
  {
    id: "gitbash",
    label: "Git Bash",
    commandId: "openTerminalHere.gitbash",
    contextKey: "openTerminalHere.gitbashAvailable",
    platforms: ["win32"],
    icon: "terminal-bash",
    color: "terminal.ansiGreen",
    resolve: () => {
      const shellPath = firstExisting(
        programFilesDirs().map((dir) => path.join(dir, "Git", "bin", "bash.exe"))
      );
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "cygwin",
    label: "Cygwin",
    commandId: "openTerminalHere.cygwin",
    contextKey: "openTerminalHere.cygwinAvailable",
    platforms: ["win32"],
    icon: "terminal-bash",
    color: "terminal.ansiBrightGreen",
    resolve: () => {
      const shellPath = firstExisting(["C:\\cygwin64\\bin\\bash.exe", "C:\\cygwin\\bin\\bash.exe"]);
      return shellPath
        ? { shellPath, args: ["--login", "-i"], env: { CHERE_INVOKING: "1" } }
        : undefined;
    }
  },
  {
    id: "msys2",
    label: "MSYS2",
    commandId: "openTerminalHere.msys2",
    contextKey: "openTerminalHere.msys2Available",
    platforms: ["win32"],
    icon: "terminal-bash",
    color: "terminal.ansiCyan",
    resolve: () => {
      const shellPath = firstExisting([
        "C:\\msys64\\usr\\bin\\bash.exe",
        "C:\\msys32\\usr\\bin\\bash.exe"
      ]);
      return shellPath
        ? { shellPath, args: ["--login", "-i"], env: { CHERE_INVOKING: "1", MSYSTEM: "MINGW64" } }
        : undefined;
    }
  },
  {
    id: "wsl",
    label: "WSL",
    commandId: "openTerminalHere.wsl",
    contextKey: "openTerminalHere.wslAvailable",
    platforms: ["win32"],
    icon: "terminal-linux",
    color: "terminal.ansiYellow",
    resolve: () => {
      const shellPath = firstExisting([path.join(system32, "wsl.exe")]);
      return shellPath ? { shellPath, cwdAsArg: true } : undefined;
    }
  },
  {
    id: "conda",
    label: "Anaconda Prompt",
    commandId: "openTerminalHere.conda",
    contextKey: "openTerminalHere.condaAvailable",
    platforms: ["win32"],
    icon: "terminal",
    color: "terminal.ansiGreen",
    resolve: () => {
      const cmd = firstExisting([path.join(system32, "cmd.exe")]);
      const base = condaBase();
      return cmd && base
        ? { shellPath: cmd, args: ["/K", path.join(base, "Scripts", "activate.bat"), base] }
        : undefined;
    }
  },
  {
    id: "nu",
    label: "Nushell",
    commandId: "openTerminalHere.nu",
    contextKey: "openTerminalHere.nuAvailable",
    platforms: ["win32", "darwin", "linux"],
    icon: "terminal",
    color: "terminal.ansiMagenta",
    resolve: () => {
      const exe = isWindows ? "nu.exe" : "nu";
      const shellPath =
        which(exe) ??
        firstExisting([
          path.join(os.homedir(), ".cargo", "bin", exe),
          ...(isWindows
            ? programFilesDirs().map((dir) => path.join(dir, "nu", "bin", "nu.exe"))
            : ["/usr/bin/nu", "/usr/local/bin/nu", "/opt/homebrew/bin/nu"])
        ]);
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "zsh",
    label: "Zsh",
    commandId: "openTerminalHere.zsh",
    contextKey: "openTerminalHere.zshAvailable",
    platforms: ["darwin", "linux"],
    icon: "terminal",
    color: "terminal.ansiGreen",
    resolve: () => {
      const shellPath = which("zsh") ?? firstExisting(["/bin/zsh", "/usr/bin/zsh"]) ?? etcShell("zsh");
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "bash",
    label: "Bash",
    commandId: "openTerminalHere.bash",
    contextKey: "openTerminalHere.bashAvailable",
    platforms: ["darwin", "linux"],
    icon: "terminal-bash",
    color: "terminal.ansiGreen",
    resolve: () => {
      const shellPath =
        which("bash") ?? firstExisting(["/bin/bash", "/usr/bin/bash"]) ?? etcShell("bash");
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "fish",
    label: "Fish",
    commandId: "openTerminalHere.fish",
    contextKey: "openTerminalHere.fishAvailable",
    platforms: ["darwin", "linux"],
    icon: "terminal",
    color: "terminal.ansiCyan",
    resolve: () => {
      const shellPath =
        which("fish") ??
        firstExisting(["/usr/local/bin/fish", "/usr/bin/fish", "/opt/homebrew/bin/fish"]) ??
        etcShell("fish");
      return shellPath ? { shellPath } : undefined;
    }
  },
  {
    id: "sh",
    label: "sh",
    commandId: "openTerminalHere.sh",
    contextKey: "openTerminalHere.shAvailable",
    platforms: ["darwin", "linux"],
    icon: "terminal",
    color: "terminal.ansiWhite",
    resolve: () => {
      const shellPath = firstExisting(["/bin/sh", "/usr/bin/sh"]) ?? etcShell("sh");
      return shellPath ? { shellPath } : undefined;
    }
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

    const spec = def.resolve();
    if (spec) {
      available.push({ def, shellPath: spec.shellPath });
    }
  }

  return available;
}

/**
 * Lists installed WSL distributions. `wsl.exe --list --quiet` emits UTF-16LE,
 * one distribution name per line; an empty result means none are installed.
 */
export function wslListDistros(wslPath: string): Promise<string[]> {
  return new Promise((resolve) => {
    execFile(
      wslPath,
      ["--list", "--quiet"],
      { timeout: 4000, windowsHide: true, encoding: "buffer" },
      (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }

        const distros = Buffer.from(stdout)
          .toString("utf16le")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        resolve(distros);
      }
    );
  });
}
