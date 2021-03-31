"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
class FileProvider {
    constructor(settings, workspacePath, templateFileName, outputFileName) {
        this.settings = settings;
        this.workspacePath = workspacePath;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
        this.fileWatcherOnDelete = undefined;
        this.settings = settings;
        this.workspacePath = workspacePath;
        const vscodeDirectory = path.join(this.workspacePath, ".vscode");
        this.outputPath = path.join(vscodeDirectory, outputFileName);
        const extDirectory = path.dirname(__dirname);
        const templateDirectory = path.join(extDirectory, "src", "templates");
        this.templatePath = path.join(templateDirectory, templateFileName);
        if (!utils_1.pathExists(this.templatePath)) {
            return;
        }
        this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(this.outputPath, true, true, false);
        if (!utils_1.pathExists(this.outputPath)) {
            this.createFileData();
        }
        this.fileWatcherOnDelete.onDidDelete(() => {
            this.createFileData();
        });
    }
    createFileData() {
        if (!utils_1.pathExists(this.outputPath)) {
            fs.mkdirSync(path.dirname(this.outputPath), { recursive: true });
        }
        this.writeFileData(this.templatePath, this.outputPath);
    }
    updateFileData() {
        this.writeFileData(this.outputPath, this.outputPath);
    }
    writeFileData(inputFilePath, outFilePath) {
        throw new Error("You have to implement the method doSomething!");
    }
}
exports.FileProvider = FileProvider;
//# sourceMappingURL=fileProvider.js.map