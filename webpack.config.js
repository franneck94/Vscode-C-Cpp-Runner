//@ts-check

'use strict';

const path = require('path');

/**
 * @type {import('webpack').Configuration}
 */
const config = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
        libraryTarget: 'commonjs2',
    },
    node: {
        __dirname: false,
    },
    devtool: 'source-map',
    externals: {
        vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: ['.ts', '.js'],
        alias: {
            '@cmt': path.resolve(__dirname, 'src')
        },
        mainFields: ['main', 'module']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                // configure TypeScript loader:
                // * enable sources maps for end-to-end source maps
                loader: 'ts-loader',
                options: {
                    compilerOptions: {
                        'sourceMap': true,
                    }
                }
            }]
        },{
            test: /.node$/,
            loader: 'node-loader',
        }]
    },
    optimization: {
        minimize: false
    },
    stats: {
        warnings: false
    }
}

module.exports = config;
