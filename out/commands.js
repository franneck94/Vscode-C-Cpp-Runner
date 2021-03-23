"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandHandler = void 0;
const vscode = require("vscode");
function commandHandler(taskProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (taskProvider.tasks === undefined) {
                throw TypeError;
            }
            let taskNames = [];
            taskProvider.tasks.forEach(task => {
                taskNames.push(task.name);
            });
            const pickedTaskName = yield vscode.window.showQuickPick(taskNames);
            if (pickedTaskName) {
                taskProvider.tasks.forEach(task => {
                    if (pickedTaskName === task.name) {
                        vscode.tasks.executeTask(task).then();
                    }
                });
            }
        }
        catch (err) {
            vscode.window.showInformationMessage(err);
        }
    });
}
exports.commandHandler = commandHandler;
;
//# sourceMappingURL=commands.js.map