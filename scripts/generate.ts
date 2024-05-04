import { mkdir, readFile, writeFile } from "fs/promises";

import { createProject } from "@ts-morph/bootstrap";
import { load } from "js-yaml";
import openapi from "openapi-typescript";

export async function build() {
  const spec = load(await readFile("dist/spec.yaml", "utf-8"));
  const output = await openapi("dist/spec.yaml", {
    formatter(node) {
      if (node.format === "date-time") {
        return "Date";
      }
      return;
    },
  });

  const specSource = `export default ${JSON.stringify(spec)} as const`;

  const project = await createProject({
    useInMemoryFileSystem: true,
    compilerOptions: { declaration: true },
  });

  project.createSourceFile("spec.ts", specSource);
  project.createProgram().emit();

  const vfs = project.fileSystem;

  await mkdir("dist", { recursive: true });
  await writeFile("dist/spec.js", await vfs.readFile("spec.js"));
  await writeFile("dist/spec.d.ts", await vfs.readFile("spec.d.ts"));
  await writeFile("dist/index.d.ts", output, "utf-8");
}

build().catch(console.error);