/* eslint no-process-exit: 0*/
'use strict';

var keypress = require('keypress');

var eslint = require('./eslint');
var getOptions = require('./options');
var watcher = require('./watcher');
var argParser = require('./arg-parser');
var logger = require('./log')('esw-cli');
logger.debug('Loaded');

var eslintCli = eslint.cli;

var parsedOptions;
var eslArgs;
var exitCode;

function runLint(args, options){
  logger.debug(args);
  var child = eslintCli(args, options);

  child.on('exit', function(code){
    logger.debug('Setting exit code to: %s', code);
    exitCode = code;
  });
  return child;
}

function keyListener(args, options){
  var stdin = process.stdin;
  if(!stdin.setRawMode){
    logger.debug('Process might be wrapped exitig keybinding');
    return;
  }
  keypress(stdin);
  stdin.on('keypress', function(ch, key){
    logger.debug('%s was pressed', key.name);
    if(key.name === 'return'){
      logger.debug('Rerunning lint...');
      runLint(args, options);
    }
    if(key.ctrl && key.name === 'c') {
      process.exit();
    }
  });
  stdin.setRawMode(true);
  stdin.resume();
}

getOptions(function(options){
  var args = process.argv;
  logger.debug('Arguments passed: %o', args);
  parsedOptions = options.parse(args);
  logger.debug('Parsing args');
  eslArgs = argParser.parse(args, parsedOptions);

  if (!parsedOptions.help) {
    logger.debug('Running initial lint');
    runLint(eslArgs, parsedOptions);
    if (parsedOptions.watch) {
      logger.debug('-w seen');
      keyListener(eslArgs, parsedOptions);
      watcher(parsedOptions);
    }
  } else {
    logger.log(options.generateHelp());
  }
});

process.on('exit', function () {
  process.exit(exitCode);
});
