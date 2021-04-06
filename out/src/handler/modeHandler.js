"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modeHandler = void 0;
const vscode = require("vscode");
const utils_1 = require("../utils");
async function modeHandler(settingsProvider) {
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
    const pickedCombination = await vscode.window.showQuickPick(combinations, {
        placeHolder: 'Select a build mode',
    });
    const pickedMode = (pickedCombination === null || pickedCombination === void 0 ? void 0 : pickedCombination.includes(utils_1.Builds.debug)) ? utils_1.Builds.debug
        : utils_1.Builds.release;
    const pickedArchitecture = (pickedCombination === null || pickedCombination === void 0 ? void 0 : pickedCombination.includes(utils_1.Architectures.x86)) ? utils_1.Architectures.x86
        : utils_1.Architectures.x64;
    return { pickedMode, pickedArchitecture };
}
exports.modeHandler = modeHandler;
//# sourceMappingURL=modeHandler.js.map