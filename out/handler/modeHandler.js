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
exports.modeHandler = void 0;
const vscode = require("vscode");
const utils_1 = require("../utils");
function modeHandler(settingsProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        let combinations = [
            `${utils_1.Builds.debug} - ${utils_1.Architectures.x86}`,
            `${utils_1.Builds.debug} - ${utils_1.Architectures.x64}`,
            `${utils_1.Builds.release} - ${utils_1.Architectures.x86}`,
            `${utils_1.Builds.release} - ${utils_1.Architectures.x64}`,
        ];
        if (settingsProvider) {
            if (settingsProvider.architecure === utils_1.Architectures.x86) {
                combinations = combinations.filter((comb) => !comb.includes(utils_1.Architectures.x64));
            }
            else {
                combinations = combinations.filter((comb) => !comb.includes(utils_1.Architectures.x86));
            }
        }
        const pickedCombination = yield vscode.window.showQuickPick(combinations, {
            placeHolder: "Select a build mode",
        });
        const pickedMode = (pickedCombination === null || pickedCombination === void 0 ? void 0 : pickedCombination.includes(utils_1.Builds.debug)) ? utils_1.Builds.debug
            : utils_1.Builds.release;
        const pickedArchitecture = (pickedCombination === null || pickedCombination === void 0 ? void 0 : pickedCombination.includes(utils_1.Architectures.x86)) ? utils_1.Architectures.x86
            : utils_1.Architectures.x64;
        return { pickedMode, pickedArchitecture };
    });
}
exports.modeHandler = modeHandler;
//# sourceMappingURL=modeHandler.js.map