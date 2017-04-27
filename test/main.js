let fs      = require('fs'),
    path    = require('path'),
    Mocha   = require('mocha'),
    chalk   = require('chalk'),
    mocha   = new Mocha(),
    flavor  = process.argv[2],
    testType, testDir;

//determine the tests
switch (flavor) {
  case 'functional':
  case 'func':
  case 'f':
    testType = 'functional';
    testDir = path.resolve('test/functional');
    break;
  case 'unit':
  case 'uni':
  case 'u':
    testType = 'unit';
    testDir = path.resolve('test/unit');
    break;
  default:
    //TODO: have default behavior run unit then func tests
    console.log(chalk.bold.red('please select a flavor'));
    process.exit(1);
}

//locate the tests
fs.readdirSync(testDir)
  .filter(file => file.substr(-8) === '.spec.js')
  .forEach(file => {
    mocha.addFile(
      path.join(testDir, file)
    );
  });

//execute the tests
mocha.run(failures => {
  process.on('exit', () => {
    if (failures && testType === 'functional') {
      console.log(chalk.bold.red('do you have mewify started?'))
    }
    process.exit(failures);
  });
});
