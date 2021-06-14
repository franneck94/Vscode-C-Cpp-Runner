import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import * as fileUtils from '../../../src/utils/fileUtils';
import {
  commandExists,
  getCompilerArchitecture,
  getOperatingSystem,
} from '../../../src/utils/systemUtils';
import { Compilers, OperatingSystems } from '../../../src/utils/types';

suite('Utils Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  suite('Test File Utils', () => {
    test('Test getBasename', () => {
      assert.strictEqual('test.txt', fileUtils.getBasename('c:/test.txt'));
      assert.strictEqual('test.txt', fileUtils.getBasename('test.txt'));
    });

    test('Test removeExtension', () => {
      assert.strictEqual('test', fileUtils.removeExtension('test.txt', 'txt'));
      assert.strictEqual('test', fileUtils.removeExtension('test.txt', '.txt'));
    });

    test('Test hasPathSeperators', () => {
      assert.strictEqual(true, fileUtils.hasPathSeperators('a/b'));
      assert.strictEqual(true, fileUtils.hasPathSeperators('a\\b'));
      assert.strictEqual(true, fileUtils.hasPathSeperators('a\\\\b'));
      assert.strictEqual(false, fileUtils.hasPathSeperators('ab'));
    });

    test('Test commandCheck', () => {
      let obj = {};
      if (getOperatingSystem() === OperatingSystems.windows) {
        obj = { a: 'c:/' };
        assert.strictEqual(true, fileUtils.commandCheck('a', obj));
      } else if (getOperatingSystem() === OperatingSystems.linux) {
        obj = { a: '/home' };
        assert.strictEqual(true, fileUtils.commandCheck('a', obj));
      } else {
        assert.strictEqual(true, true); // no-op for mac
      }
    });

    test('Test naturalSort', () => {
      const files = ['1_Test', '10_Test', '9_Test'];
      const sorted_files = ['1_Test', '9_Test', '10_Test'];
      assert.deepStrictEqual(sorted_files, fileUtils.naturalSort(files));
    });

    test('Test foldersInDir', () => {
      const dir = path.dirname(__dirname);
      const dirs = [__dirname];
      assert.deepStrictEqual(dirs, fileUtils.foldersInDir(dir));
    });

    test('Test filesInDir', () => {
      const dir = path.dirname(__dirname);
      const files = ['runTest.js', 'runTest.js.map'];
      assert.deepStrictEqual(files, fileUtils.filesInDir(dir));
    });

    test('Test readDir', () => {
      const dir = path.dirname(__dirname);
      const expectedEntrries = ['runTest.js', 'runTest.js.map', 'suite'];
      const readEntries = fileUtils.readDir(dir);
      if (readEntries !== undefined) {
        const entries = readEntries.map((entry) => entry.name);
        assert.deepStrictEqual(expectedEntrries, entries);
      }
    });

    test('Test getDirectoriesRecursive', () => {
      const dir = path.dirname(__dirname);
      const expectedDirs = [path.normalize(path.join(dir, 'suite'))];
      const recursiveDirs = fileUtils.getDirectoriesRecursive(dir);
      assert.deepStrictEqual(expectedDirs, recursiveDirs);
    });

    test('Test isCppSourceFile', () => {
      const cppFile1 = '.cc';
      const cppFile2 = '.cxx';
      const cppFile3 = '.cpp';
      const cppFile4 = '.c';
      assert.strictEqual(true, fileUtils.isCppSourceFile(cppFile1));
      assert.strictEqual(true, fileUtils.isCppSourceFile(cppFile2));
      assert.strictEqual(true, fileUtils.isCppSourceFile(cppFile3));
      assert.strictEqual(false, fileUtils.isCppSourceFile(cppFile4));
    });

    test('Test isHeaderFile', () => {
      const cppFile1 = '.hh';
      const cppFile2 = '.hxx';
      const cppFile3 = '.hpp';
      const cppFile4 = '.h';
      assert.strictEqual(true, fileUtils.isHeaderFile(cppFile1));
      assert.strictEqual(true, fileUtils.isHeaderFile(cppFile2));
      assert.strictEqual(true, fileUtils.isHeaderFile(cppFile3));
      assert.strictEqual(true, fileUtils.isHeaderFile(cppFile4));
    });

    test('Test isCSourceFile', () => {
      const cFile1 = '.c';
      const cFile2 = '.cc';
      assert.strictEqual(true, fileUtils.isCSourceFile(cFile1));
      assert.strictEqual(false, fileUtils.isCSourceFile(cFile2));
    });

    test('Test replaceBackslashes', () => {
      assert.strictEqual('c:/test', fileUtils.replaceBackslashes('c:\\test'));
      assert.strictEqual(
        'c:/test/test2',
        fileUtils.replaceBackslashes('c:\\test\\test2'),
      );
      assert.strictEqual(
        'c:/test/test2',
        fileUtils.replaceBackslashes('c:\\test/test2'),
      );
    });

    test('Test filterOnString', () => {
      const names = ['test', 'text', 'testt'];
      const filterName = 'test';
      const filteredNames = ['text', 'testt'];
      assert.notStrictEqual(
        filteredNames,
        fileUtils.filterOnString(names, filterName),
      );
    });
  });

  suite('systemUtils', () => {
    test('Test commandExists', async () => {
      const npm_ret = await commandExists('npm');
      assert.strictEqual(true, npm_ret.f);
      assert.strictEqual(true, npm_ret.p?.includes('npm'));

      const none_ret = await commandExists('npmmm');
      assert.strictEqual(false, none_ret.f);
      assert.strictEqual(undefined, none_ret.p);
    });

    test('Test getCompilerArchitecture', () => {
      const arch1 = getCompilerArchitecture(Compilers.clang);
      assert.strictEqual('x64', arch1.architecure);
      assert.strictEqual(false, arch1.isCygwin);
    });
  });

  vscode.window.showInformationMessage('Finished all tests.');
});
