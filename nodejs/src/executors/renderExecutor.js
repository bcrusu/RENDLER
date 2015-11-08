const util = require('util');
const path = require('path');
const child_process = require('child_process');
const EventEmitter = require('events');
const executorUtil = require('./executorUtil');

function RenderExecutor() {
    EventEmitter.call(this);

    var _outputDir;

    function onRegistered(driver, executorInfo, frameworkInfo, slaveInfo) {
        _outputDir = executorInfo.data.toUTF8();
        console.log("Registered executor on host " + slaveInfo.hostname + ". Output dir is '" + _outputDir + "'.");
    }

    function onLaunchTask(driver, taskInfo) {
        console.log("Launching render task '" + taskInfo.task_id.value + "'...");
        executorUtil.sendTaskRunningStatus(driver, taskInfo.task_id);

        var url = taskInfo.data.toUTF8();
        var fileName = path.join(_outputDir, taskInfo.task_id.value + ".png");
        var spawnOptions = {
            timeout: 1000 * 30
        };

        child_process.spawn("phantomjs", ["render.js", url, fileName], spawnOptions)
            .on('close', function () {
                sendRenderResultMessage(driver, url, fileName);
                executorUtil.sendTaskFinishedStatus(driver, taskInfo.task_id);
            })
            .on('error', function (err) {
                console.log("Error during render operation: " + err);
                executorUtil.sendTaskErrorStatus(driver, taskInfo.task_id);
            });
    }

    function onError(driver, message) {
        console.log("Error: " + message);
    }

    function sendRenderResultMessage(driver, url, fileName) {
        var message = {
            type: "RenderResult",
            body: {
                url: url,
                fileName: fileName
            }
        };

        driver.sendFrameworkMessage(JSON.stringify(message));
    }

    this.on("registered", onRegistered);
    this.on("launchTask", onLaunchTask);
    this.on("error", onError);
}

util.inherits(RenderExecutor, EventEmitter);

module.exports = RenderExecutor;