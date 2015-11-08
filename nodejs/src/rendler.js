var Arguments = require("./arguments");
const MesosApi = require("mesos-api")(0);
const Protos = MesosApi.protos.mesos;
const RendlerScheduler = require("./rendlerScheduler");
const CrawlExecutor = require("./executors/crawlExecutor");
const RenderExecutor = require("./executors/renderExecutor");

function main() {
    var args = Arguments.parse(process.argv.slice(2));
    if (!args || !Arguments.validate(args))
        process.exit(-1);

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
            process.exit(0);
        })
        .catch(function (error) {
            console.log("Unexpected driver error: " + error);
            process.exit(-2);
        });
}

function runExecutor(executorName) {
    var executor;
    switch (executorName) {
        case "render":
            executor = new RenderExecutor();
            break;
        case "crawl":
            executor = new CrawlExecutor();
            break;
        default:
        {
            console.log("Unrecognized executor: " + executorName);
            process.exit(-1);
        }
    }

    var driver = MesosApi.createExecutorDriver(executor);

    console.log("Running executor driver...");
    driver.run()
        .then(function (status) {
            console.log("Executor driver finished with status: " + status);
            process.exit(0);
        })
        .catch(function (error) {
            console.log("Unexpected driver error: " + error);
            process.exit(-3);
        });
}

module.exports.main = main;