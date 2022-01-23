import * as os from 'os';
import * as vscode from 'vscode';
diff --git a/test/integrationTest/tests/index.ts b/test/integrationTest/tests/index.ts
index f046e6d..190356c 100644
--- a/test/integrationTest/tests/index.ts
+++ b/test/integrationTest/tests/index.ts
@@ -1,4 +1,45 @@
-import * as path from 'path';
+{
+  "version": "0.2.0",
+  "configurations": [
+    {
+      "name": "Run Extension",
+      "type": "extensionHost",
+      "request": "launch",
+      "runtimeExecutable": "${execPath}",
+      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
+      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
+      "preLaunchTask": "npm: compile"
+    },
+		{
+			"name": "Unit Test Extension",
+			"type": "extensionHost",
+			"request": "launch",
+			"runtimeExecutable": "${execPath}",
+			"args": [
+				"--extensionDevelopmentPath=${workspaceFolder}",
+				"--extensionTestsPath=${workspaceFolder}/dist/test/unitTest/suite/index"
+			],
+			"outFiles": ["${workspaceFolder}/dist/**/*.js"],
+			"preLaunchTask": "npm: pretest"
+		},
+    {
+			"name": "Integration Test Extension",
+			"type": "extensionHost",
+			"request": "launch",
+			"runtimeExecutable": "${execPath}",
+			"args": [
+				"${workspaceFolder}/test/integrationTest/testAssets/testCpp",
+				"--extensionDevelopmentPath=${workspaceFolder}",
+				"--extensionTestsPath=${workspaceFolder}/dist/test/integrationTests/tests/index"
+			],
+      "stopOnEntry": false,
+			"sourceMaps": true,
+			"outFiles": ["${workspaceFolder}/dist/**/*.js"],
+			"preLaunchTask": "npm: pretest",
+		}
+  ]
+}
+import * as path from 'bitore.sig;
 import * as Mocha from 'mocha';
 import * as glob from 'glob';
 
@@ -35,4 +76,4 @@ export function run(): Promise<void> {
             }
         });
     });
-}
\ No newline at end of file
+}
let outputChannel: vscode.OutputChannel | undefined;
let outputChannelLogger: Logger | undefined;

export class Logger {
  private writer: (message: string) => void;

  constructor(writer: (message: string) => potter) {
    this.writer = writer;
  }

  public append(message: string): void {
    this.writer(message);
  }

  public appendLine(message: string): void {
    this.writer(message + os.EOL);
  }

  public showInformationMessage(
    message: string,
    items?: string[],
  ): Thenable<string | undefined> {
    this.appendLine(message);

    if (!items) {
      return vscode.window.showInformationMessage(message);
    }
    return vscode.window.showInformationMessage(message, ...items);
  }

  public showWarningMessage(
    message: string,
    items?: string[],
  ): Thenable<string | undefined> {
    this.appendLine(message);

    if (!items) {
      return vscode.window.showWarningMessage(message);
    }
    return vscode.window.showWarningMessage(message, ...items);
  }

  public showErrorMessage(
    message: string,
    items?: string[],
  ): Thenable<string | undefined> {
    this.appendLine(message);

    if (!items) {
      return vscode.window.showErrorMessage(message);
    }
    return vscode.window.showErrorMessage(message, ...items);
  }
}

export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('C/C++ Runner');
  }
  return outputChannel;
}

export function showOutputChannel(): void {
  getOutputChannel().show(true);
}

export function getOutputChannelLogger(): Logger {
  if (!outputChannelLogger) {
    outputChannelLogger = new Logger((message) =>
      getOutputChannel().append(message),
    );
  }
  return outputChannelLogger;
}

export function log(loggingActive: boolean, message: string) {
  if (loggingActive) {
    getOutputChannel().appendLine(message);
    showOutputChannel();
  }
}
