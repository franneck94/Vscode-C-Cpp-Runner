"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProvider = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
class FileProvider {
    constructor(settings, workspaceFolder, templateFileName, outputFileName) {
        this.settings = settings;
        this.workspaceFolder = workspaceFolder;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
        this.settings = settings;
        this.workspaceFolder = workspaceFolder;
        this._vscodeDirectory = path.join(this.workspaceFolder, '.vscode');
        this._outputPath = path.join(this._vscodeDirectory, outputFileName);
        const deletePattern = `${this._vscodeDirectory}/**`;
        const extDirectory = path.dirname(path.dirname(__dirname));
        const templateDirectory = path.join(extDirectory, 'src', '_templates');
        this._templatePath = path.join(templateDirectory, templateFileName);
        this._fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(deletePattern, true, true, false);
        let doUpdate = false;
        if (!utils_1.pathExists(this._outputPath)) {
            doUpdate = true;
        }
        else {
            const configJson = utils_1.readJsonFile(this._outputPath);
            if (configJson) {
                const triplet = configJson.configurations[0].name;
                if (!triplet.includes(this.settings.operatingSystem)) {
                    doUpdate = true;
                }
            }
        }
        if (doUpdate) {
            this.settings.checkCompilers();
            this.createFileData();
        }
        this._fileWatcherOnDelete.onDidDelete(() => {
            this.createFileData();
        });
    }
    createFileData() {
        if (utils_1.pathExists(this._outputPath)) {
            return;
        }
        if (!utils_1.pathExists(this._vscodeDirectory)) {
            utils_1.mkdirRecursive(this._vscodeDirectory);
        }
        this.writeFileData(this._templatePath, this._outputPath);
    }
    updateFileData() {
        this.writeFileData(this._outputPath, this._outputPath);
    }
    writeFileData(inputFilePath, outFilePath) {
        throw new Error('You have to implement the method doSomething!');
    }
}
exports.FileProvider = FileProvider;
//# sourceMappingURL=fileProvider.js.map