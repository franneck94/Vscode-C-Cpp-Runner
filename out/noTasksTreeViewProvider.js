"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoTasksProvider = void 0;
const vscode = require("vscode");
const messages_1 = require("./messages");
class NoTasksProvider {
    getChildren(element) {
        const item = new vscode.TreeItem("");
        item.description = messages_1.messages.folderRequired;
        return [item];
    }
    getTreeItem(element) {
        return element;
    }
}
exports.NoTasksProvider = NoTasksProvider;
//# sourceMappingURL=noTasksTreeViewProvider.js.map