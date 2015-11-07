var Arguments = require("./arguments.js");
const MesosApi = require('mesosApi')(0);
const Protos = MesosApi.protos.mesos;
const RendlerScheduler = require('./rendlerScheduler.js');

function main() {
    var args = Arguments.parse(process.argv.slice(2));
    if (!args || !Arguments.validate(args))
        return;

    switch (args.runMode) {
        case "executor":
            runExecutor(args.executorName);
            break;
        case "scheduler" :
            runScheduler(args.mesosMaster, args.startUrl, args.outputDir, args.runAsUser);
            break;
    }
}

function runScheduler(mesosMaster, startUrl, outputDir, runAsUser) {
    var frameworkInfo = new Protos.FrameworkInfo({
        id: {
            value: "Rendler"
        },
        name: "Rendler (Node.js)",
        failover_timeout: 5,  //seconds
        checkpoint: false,
        user: runAsUser
    });

    if (!startUrl)
        startUrl = "https://mesosphere.com";

    var scheduler = new RendlerScheduler(startUrl, outputDir, runAsUser);
    var driver = MesosApi.createSchedulerDriver(scheduler, frameworkInfo, mesosMaster);

    console.log("Running scheduler driver...");
    driver.run()
        .then(function (status) {
           console.log("Scheduler driver finished with status: " + status);
        })
        .catch(function (error) {
            console.log("Unexpected error: " + error);
        });
}

function runExecutor(executorName) {
    //TODO:
    return -1;
}

module.exports.main = main;