import * as vscode from 'vscode';

import { TreeItemCollapsibleState } from 'vscode';

export class Task extends vscode.TreeItem {
    constructor(
        public _label: string,
        public _args: string[],
        public _command: string,
        public _type: string,
    ) {
        super(_label, TreeItemCollapsibleState.Collapsed);
        this._label = _label;
        this._args = _args;
        this._command = _command;
        this._type = _type;
    }
}
