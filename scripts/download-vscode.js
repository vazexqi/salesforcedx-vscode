#!/usr/bin/env node

const ncp = require('ncp');
const path = require('path');
const fs = require('fs');
const downloadAndUnzipVSCode = require('vscode-test').downloadAndUnzipVSCode;
const logger = require('./logger-util');

// Copy vscode to these directories
const extensionDirectories = [
  'salesforcedx-vscode-apex',
  'salesforcedx-vscode-apex-debugger',
  'salesforcedx-vscode-apex-replay-debugger',
  'salesforcedx-vscode-core',
  'salesforcedx-vscode-lightning',
  'salesforcedx-vscode-lwc',
  'salesforcedx-vscode-visualforce'
];

const vscodeVersion = process.env.CODE_VERSION || 'stable';

// Executable path looks something like:
// ~/salesforcedx-vscode/packages/salesforcedx-vscode-lwc/.vscode-test/vscode-1.41.1/Visual Studio Code.app/Contents/MacOS/Electron
downloadAndUnzipVSCode(vscodeVersion)
  .then(executablePath => {
    logger.debug('Executable Path: ' + executablePath);

    let vscodeIndex = executablePath.indexOf('.vscode-test') + 13;

    // 'vscode-1.41.1'
    let vscodeDirname = executablePath.substring(
      vscodeIndex,
      executablePath.indexOf(path.sep, vscodeIndex)
    );

    // '~/salesforcedx-vscode/.vscode-test/vscode-1.41.1/'
    let vscodeFullPath = executablePath.substring(
      0,
      vscodeIndex + vscodeDirname.length + 1
    );

    // '~/salesforcedx-vscode/'
    let vscodeBasePath = path.dirname(path.dirname(vscodeFullPath));

    logger.debug('Directory Name: ' + vscodeDirname);
    logger.debug('Base Path: ' + vscodeBasePath);
    logger.debug('Full Path: ' + vscodeFullPath);

    // If this script is run from an individual package, don't copy it around unnecessarily
    // Example:
    // ~/salesforcedx-vscode/packages/salesforcedx-vscode-lwc> npm run test:vscode-integration
    if (vscodeBasePath.indexOf(path.sep + 'packages' + path.sep) !== -1) {
      // Do nothing, vscode is already downloaded and extracted in this package
    } else {
      // For each extension, copy over the vscode binary
      for (let i = 0; i < extensionDirectories.length; i++) {
        try {
          const copyDestination = path.join(
            vscodeBasePath,
            'packages',
            extensionDirectories[i],
            '.vscode-test',
            vscodeDirname
          );
          logger.debug(`Creating Directories:  ${copyDestination}`);
          if (!fs.existsSync(copyDestination)) {
            fs.mkdirSync(copyDestination, { recursive: true });
          }
          logger.debug(`Copying to: ${copyDestination}`);
          ncp(vscodeFullPath, copyDestination, function(err) {
            if (err) {
              return console.error(err);
            }
          });
        } catch (error) {
          logger.error(error);
        }
      }
    }
  })
  .catch(err => {
    logger.err('Failed to download vscode');
    logger.debug(err);
    process.exit(1);
  });
