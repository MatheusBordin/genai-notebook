import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import dotenv from "dotenv";

const mode = process.argv[2] === "lab" ? "lab" : "notebook";
const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const jupyterBin = path.join(cwd, ".venv", "bin", "jupyter");
const nodeBin = path.join(cwd, "node_modules", ".bin");
const venvBin = path.join(cwd, ".venv", "bin");
const denoBin = path.join(cwd, ".deno", "bin");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const child = spawn(jupyterBin, [mode], {
  cwd,
  stdio: "inherit",
  env: {
    ...process.env,
    PATH: [denoBin, nodeBin, venvBin, process.env.PATH || ""].join(path.delimiter),
    JUPYTER_DATA_DIR: path.join(cwd, ".jupyter"),
    JUPYTER_CONFIG_DIR: path.join(cwd, ".jupyter"),
    IPYTHONDIR: path.join(cwd, ".ipython")
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
