const util = require('util');
const path = require('path');
const child_process = require('child_process');
const MesosApi = require('mesosApi')(0);
const Protos = MesosApi.protos.mesos;
const EventEmitter = require('events');
const executorUtil = require('./executorUtil');

function RendlerScheduler(startUrl, outputDir, runAsUser) {
    EventEmitter.call(this);

    var _outputDir;

    function onRegistered(driver, executorInfo, frameworkInfo, slaveInfo) {
        _outputDir = executorInfo.data.toUTF8();
        console.log("Registered executor on host " + slaveInfo.hostname + ". Output dir is '" + _outputDir + "'.";
    }

    function onLaunchTask(driver, taskInfo) {
        console.log("Launching render task '" + taskInfo.task_id.value + "'...");

        try {
            executorUtil.sendTaskRunningStatus(driver, taskInfo.task_id);

            var url = taskInfo.data.toUTF8();
            var imageFileName = runRendering(taskInfo.task_id, url);

            sendRenderResultMessage(driver, url, imageFileName);
            executorUtil.sendTaskFinishedStatus(driver, taskInfo.task_id);

        }
        catch (exception) {
            console.log("Exception during render operation: " + exception);
            executorUtil.sendTaskErrorStatus(driver, taskInfo.task_id);
        }
    }

    function onError(driver, message) {
        console.log("Error: " + message);
    }

    function runRendering(taskId, url)
    {
        var imagePath = path.join(_outputDir, taskId.value + ".png");
        var options = {
            timeout: 1000 * 60
        };

        child_process.spawnSync("phantomjs", "render.js \"{url}\" \"{imagePath}\"", options);

        return imagePath;
    }

    function sendRenderResultMessage(driver, url, fileName) {
        var message = new {
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

util.inherits(RendlerScheduler, EventEmitter);

module.exports = RendlerScheduler;