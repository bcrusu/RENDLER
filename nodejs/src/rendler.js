var args = require("./arguments.js");
var mesosApi = require('mesosApi')(0);

function main() {
    var arguments = args.parse(process.argv);
    if (!arguments || !args.validate(args))
        return -1;

    switch (arguments.runMode) {
        case "executor":
            return runExecutor(arguments.executorName);
        case "scheduler" :
            return runScheduler(arguments.mesosMaster, arguments.startUrl, arguments.outputDir, arguments.runAsUser);
        default:
            return -1;
    }
}

function runScheduler(mesosMaster, startUrl, outputDir, runAsUser) {
    //TODO:
    return -1;
}

function runExecutor(executorName) {
    //TODO:
    return -1;
}

module.exports.main = main;