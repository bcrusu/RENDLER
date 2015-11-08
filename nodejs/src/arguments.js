function parse(argsArray) {
    var runMode = undefined;
    var mesosMaster = undefined;
    var executor = undefined;
    var outputDir = undefined;
    var startUrl = undefined;
    var runAsUser = undefined;

    argsArray.forEach(function (arg) {
        if (arg.indexOf("-executor=") === 0) {
            if (runMode !== undefined) {
                console.log("Invalid run mode detected. Check the 'executor' argument!");
                return null;
            }

            executor = arg.substring("-executor=".length);
            runMode = "executor";
        }
        else if (arg.indexOf("-scheduler") === 0) {
            if (runMode !== undefined) {
                console.log("Invalid run mode detected. Check the 'scheduler' argument!");
                return null;
            }

            runMode = "scheduler";
        }
        else if (arg.indexOf("-master=") === 0) {
            if (mesosMaster !== undefined) {
                console.log("Mesos master option can be specified only once.");
                return null;
            }

            mesosMaster = arg.substring("-master=".length);
        }
        else if (arg.indexOf("-output=") === 0) {
            if (outputDir !== undefined) {
                console.log("Output directory option can be specified only once.");
                return null;
            }

            outputDir = arg.substring("-output=".length);
        }
        else if (arg.indexOf("-starturl=") === 0) {
            if (startUrl !== undefined) {
                console.log("Start URL option can be specified only once.");
                return null;
            }

            startUrl = arg.substring("-starturl=".length);
        }
        else if (arg.indexOf("-user=") === 0) {
            if (runAsUser !== undefined) {
                console.log("User option can be specified only once.");
                return null;
            }

            runAsUser = arg.substring("-user=".length);
        }
        else {
            console.log("Unknown argument detected: " + arg);
        }
    });

    return {
        'runMode': runMode,
        'mesosMaster': mesosMaster,
        'executorName': executor,
        'outputDir': outputDir,
        'startUrl': startUrl,
        'runAsUser': runAsUser
    }
}

function validate(arguments) {
    switch (arguments.runMode) {
        case "executor":
            if (!arguments.executorName) {
                console.log("Invalid executor name.");
                return false;
            }
            break;
        case "scheduler" :
            if (!arguments.mesosMaster) {
                console.log("Invalid Mesos master address.");
                return false;
            }
            if (!arguments.outputDir) {
                console.log("Invalid output directory.");
                return false;
            }

            if (!directoryExists(arguments.outputDir)) {
                console.log("Could not find output directory.");
                return false;
            }
            break;
        default :
            console.log("Run mode was not specified.");
            return false;
    }
    return true;
}

function directoryExists(directory) {
    var fs = require("fs");
    try {
        var stats = fs.statSync(directory);
        if (!stats.isDirectory()) {
            return false;
        }
    }
    catch (e) {
        return false;
    }

    return true;
}

module.exports.parse = parse;
module.exports.validate = validate;