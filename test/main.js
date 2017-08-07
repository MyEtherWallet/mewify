let fs      = require('fs'),
    path    = require('path'),
    Mocha   = require('mocha'),
    chalk   = require('chalk'),
    mocha   = new Mocha(),
    flavor  = process.argv[2];

let unitTestsPath = path.resolve(__dirname + '/unit'),
    functionalTestsPath = path.resolve(__dirname + '/functional'),
    errorCount = 0;

//determine which tests to run
switch (flavor) {
  case 'functional':
  case 'f':
    addTestsToMocha(functionalTestsPath);
    break;
  case 'unit':
  case 'u':
    addTestsToMocha(unitTestsPath);
    break;
  case 'all':
  case 'a':
    addTestsToMocha(unitTestsPath);
    addTestsToMocha(functionalTestsPath);
    break;
  default:
    console.log(chalk.bold.red('please tell me which type of tests to run. for example:'));
    console.log('   npm test functional');
    console.log('   npm test unit');
    console.log('   npm test all');
    process.exit(1);
}

function addTestsToMocha(folderPath) {
  fs.readdirSync(folderPath)
    .filter(file => file.substr(-8) === '.spec.js')
    .forEach(file => {
      mocha.addFile(
        path.join(folderPath, file)
      );
    });
}

//run the tests, exit on completion
mocha.run()
  .on('fail', () => errorCount++)
  .on('end', () => process.exit(errorCount));
