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
function commandHandler(tasks) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let taskNames = [];
            tasks.forEach(task => {
                taskNames.push(task._name);
            });
            const cmd = yield vscode.window.showQuickPick(taskNames, { placeHolder: 'Type or select command to run' });
            if (cmd) {
                vscode.window.showInformationMessage(tasks[cmd]._name);
                // vscode.tasks.executeTask(tasks[cmd]).then();
            }
        }
        catch (err) {
            // do nothings;
        }
    });
}
exports.commandHandler = commandHandler;
;
//# sourceMappingURL=commands.js.map