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
                console.write("Invalid run mode detected. Check the 'executor' argument!");
                return null;
            }

            executor = arg.substring("-executor=".length);
            runMode = "executor";
        }
        else if (arg.indexOf("-scheduler") === 0) {
            if (runMode !== undefined) {
                console.write("Invalid run mode detected. Check the 'scheduler' argument!");
                return null;
            }

            runMode = "scheduler";
        }
        else if (arg.indexOf("-master=") === 0) {
            if (mesosMaster !== undefined) {
                console.write("Mesos master option can be specified only once.");
                return null;
            }

            mesosMaster = arg.substring("-master=".length);
        }
        else if (arg.indexOf("-output=") === 0) {
            if (outputDir !== undefined) {
                console.write("Output directory option can be specified only once.");
                return null;
            }

            outputDir = arg.substring("-output=".length);
        }
        else if (arg.indexOf("-starturl=") === 0) {
            if (startUrl !== undefined) {
                console.write("Start URL option can be specified only once.");
                return null;
            }

            startUrl = arg.substring("-starturl=".length);
        }
        else if (arg.indexOf("-user=") === 0) {
            if (runAsUser !== undefined) {
                console.write("User option can be specified only once.");
                return null;
            }

            runAsUser = arg.substring("-user=".length);
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
                console.write("Invalid executor name.");
                return false;
            }
            break;
        case "scheduler" :
            if (!arguments.mesosMaster) {
                console.write("Invalid Mesos master address.");
                return false;
            }
            if (!arguments.outputDir) {
                console.write("Invalid output directory.");
                return false;
            }

            if (!directoryExists(arguments.outputDir)) {
                console.write("Could not find output directory.");
                return false;
            }
            break;
        default :
            console.write("Run mode was not specified.");
            return false;
    }
    return true;
}

function directoryExists(directory) {
    var fs = require("fs");
    try {
        stats = fs.statSync(directory);
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