import * as child_process from "child_process";
import { readdirSync } from "fs";
import path from "path";
import { isDirectoryNotEmpty } from "../utils";
import { error } from "console";

const nexquikMain = "./dist/index.js";
const testOutputDirectory = path.join(
  "__tests__",
  "prisma-schema-tests",
  "defaultTestOutputDirectory"
);
const prismaSchemaDirectory = path.join(
  "__tests__",
  "prisma-schemas",
  "minimal-examples"
);
const prismaMain = "./node_modules/prisma/build/index.js";

test.each(readdirSync(prismaSchemaDirectory))(
  `Schema Test: %p`,
  (schemaPath: string) => {
    child_process.execSync(`rm -rf ${testOutputDirectory}`);
    child_process.execSync(
      `node ${nexquikMain} -schema ${path.join(
        prismaSchemaDirectory,
        schemaPath
      )} generate --group TestGroup -init -output ${testOutputDirectory}`
    );

    console.log(`Schema Test: ${schemaPath}`);
    expect(isDirectoryNotEmpty(testOutputDirectory)).toBeTruthy();
    try {
      // Run npm install
      child_process.execSync("npm install --quiet", {
        cwd: testOutputDirectory,
      });
      // Run prisma generate
      child_process.execSync(`node ${prismaMain} generate`, {
        stdio: "inherit",
        cwd: testOutputDirectory,
      });
      // Run build
      child_process.execSync("npm run build", {
        stdio: "inherit",
        cwd: testOutputDirectory,
      });
      // Run type check
      child_process.execSync("npm run typecheck", {
        stdio: "inherit",
        cwd: testOutputDirectory,
      });
    } catch (error) {
      console.error("TypeScript compilation error:", error.message);
      throw error;
    } finally {
      child_process.execSync(`rm -rf ${testOutputDirectory}`);
    }
  }
);
