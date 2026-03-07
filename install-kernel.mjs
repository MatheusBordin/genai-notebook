import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const denoBin = path.join(cwd, ".deno", "bin", "deno");
const venvBin = path.join(cwd, ".venv", "bin");
const homeDir = path.join(cwd, ".deno-home");
const kernelCandidates = [
  path.join(homeDir, "Library", "Jupyter", "kernels", "deno"),
  path.join(homeDir, ".local", "share", "jupyter", "kernels", "deno")
];
const env = {
  ...process.env,
  PATH: [
    path.join(cwd, ".deno", "bin"),
    venvBin,
    process.env.PATH || ""
  ].join(path.delimiter),
  HOME: homeDir,
  JUPYTER_DATA_DIR: path.join(cwd, ".jupyter"),
  JUPYTER_CONFIG_DIR: path.join(cwd, ".jupyter"),
  IPYTHONDIR: path.join(cwd, ".ipython")
};

if (!existsSync(denoBin)) {
  console.error("Deno nao encontrado em ./.deno/bin/deno");
  console.error("Instale o runtime primeiro e depois execute `npm run install:kernel`.");
  process.exit(1);
}

const result = spawnSync(denoBin, ["jupyter", "--install"], {
  cwd,
  env,
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const kernelDir = kernelCandidates.find((candidate) => existsSync(candidate));

if (!kernelDir) {
  console.error("Kernel do Deno instalado, mas o diretorio do kernelspec nao foi encontrado.");
  process.exit(1);
}

const installResult = spawnSync(path.join(venvBin, "jupyter"), [
  "kernelspec",
  "install",
  "--prefix",
  path.join(cwd, ".venv"),
  "--replace",
  kernelDir
], {
  cwd,
  env,
  stdio: "inherit"
});

if (installResult.status !== 0) {
  process.exit(installResult.status ?? 1);
}
