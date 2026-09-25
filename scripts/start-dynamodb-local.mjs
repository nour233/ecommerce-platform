import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

// Reuse the official DynamoDB Local distribution bundled with Workbench.
const jar = process.env.DYNAMODB_LOCAL_JAR || join(
  process.env.LOCALAPPDATA || "", "Programs", "NoSQL Workbench",
  "resources", "resources", "dynamodb_local", "DynamoDBLocal.jar"
);
const candidates = [];
if (process.env.JAVA_HOME) candidates.push(join(process.env.JAVA_HOME, "bin", "java.exe"));
const found = spawnSync("where.exe", ["java"], { encoding: "utf8", windowsHide: true });
if (found.status === 0) candidates.push(...found.stdout.trim().split(/\r?\n/));
const jetbrains = join(process.env.ProgramFiles || "C:\\Program Files", "JetBrains");
if (existsSync(jetbrains)) {
  for (const entry of await readdir(jetbrains)) {
    candidates.push(join(jetbrains, entry, "jbr", "bin", "java.exe"));
  }
}
const java = candidates.find((candidate) => existsSync(candidate));
if (!java || !existsSync(jar)) {
  console.error("Java and DynamoDB Local are required. Install Workbench with DynamoDB Local and set JAVA_HOME to Java 17+.");
  process.exit(1);
}
const { dirname } = await import("node:path");
const dataPath = resolve(".local/dynamodb");
await mkdir(dataPath, { recursive: true });
console.log(`DynamoDB Local: http://127.0.0.1:8000\nPersistent data: ${dataPath}`);
const child = spawn(java, [
  `-Djava.library.path=${join(dirname(jar), "DynamoDBLocal_lib")}`,
  "-jar", jar, "-sharedDb", "-dbPath", dataPath, "-port", "8000"
], { stdio: "inherit", windowsHide: true });
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
process.on("SIGINT", () => child.kill());
process.on("SIGTERM", () => child.kill());
