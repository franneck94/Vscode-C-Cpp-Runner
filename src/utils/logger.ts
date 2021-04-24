import * as os from 'os';
import * as vscode from 'vscode';

const EXTENSION_NAME = 'C/C++ Runner';

let outputChannel: vscode.OutputChannel | undefined;
let outputChannelLogger: Logger | undefined;

export class Logger {
  private writer: (message: string) => void;

  constructor(writer: (message: string) => void) {
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
    outputChannel = vscode.window.createOutputChannel(EXTENSION_NAME);
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
