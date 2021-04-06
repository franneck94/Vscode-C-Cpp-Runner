"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modeHandler = void 0;
const vscode = require("vscode");
const types_1 = require("../types");
async function modeHandler(settingsProvider) {
    let combinations = [
        `${types_1.Builds.debug} - ${types_1.Architectures.x86}`,
        `${types_1.Builds.debug} - ${types_1.Architectures.x64}`,
        `${types_1.Builds.release} - ${types_1.Architectures.x86}`,
        `${types_1.Builds.release} - ${types_1.Architectures.x64}`,
    ];
    if (settingsProvider) {
        if (settingsProvider.architecure === types_1.Architectures.x86) {
            combinations = combinations.filter((comb) => !comb.includes(types_1.Architectures.x64));
        }
        else {
            combinations = combinations.filter((comb) => !comb.includes(types_1.Architectures.x86));
        }
    }
    const pickedCombination = await vscode.window.showQuickPick(combinations, {
        placeHolder: 'Select a build mode',
    });
    const pickedMode = (pickedCombination === null || pickedCombination === void 0 ? void 0 : pickedCombination.includes(types_1.Builds.debug)) ? types_1.Builds.debug
        : types_1.Builds.release;
    const pickedArchitecture = (pickedCombination === null || pickedCombination === void 0 ? void 0 : pickedCombination.includes(types_1.Architectures.x86)) ? types_1.Architectures.x86
        : types_1.Architectures.x64;
    return { pickedMode, pickedArchitecture };
}
exports.modeHandler = modeHandler;
//# sourceMappingURL=modeHandler.js.map