import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

    const extensionTestsPath = path.resolve(__dirname, './tests/index');

    const testWorkspace = path.resolve(
      extensionDevelopmentPath,
      'test/integrationTests/testAssets/testCpp',
    );

    // const launchArgs = ['--disable-extensions', testWorkspace];
    const launchArgs = [testWorkspace];

    await runTests({
      launchArgs,
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
