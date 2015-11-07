const util = require('util');
const http = require('http');
const https = require('https');
const urlLib = require('url');
const EventEmitter = require('events');
const executorUtil = require('./executorUtil');

function CrawlExecutor() {
    EventEmitter.call(this);

    function onRegistered(driver, executorInfo, frameworkInfo, slaveInfo) {
        console.log("Registered executor on host " + slaveInfo.hostname);
    }

    function onLaunchTask(driver, taskInfo) {
        console.log("Launching crawl task '" + taskInfo.task_id.value + "'...");
        executorUtil.sendTaskRunningStatus(driver, taskInfo.task_id);

        var url = taskInfo.data.toUTF8();

        var httpx = getHttpObject(url);
        if (!httpx) {
            console.log("Unrecognized url protocol: " + url);
            executorUtil.sendTaskFinishedStatus(driver, taskInfo.task_id);
            return;
        }

        httpx.get(url, function (response) {
            var links = [];
            response.setEncoding('utf8');

            response.on('data', function (chunk) {
                links = links.concat(parseLinks(chunk));
            });
            response.on('end', function () {
                sendCrawlResultMessage(driver, url, links);
                executorUtil.sendTaskFinishedStatus(driver, taskInfo.task_id);
            });
        }).on('error', function (error) {
            console.log("Error during crawl operation: " + error);
            executorUtil.sendTaskErrorStatus(driver, taskInfo.task_id);
        });
    }

    function onError(driver, message) {
        console.log("Error: " + message);
    }

    function sendCrawlResultMessage(driver, url, links) {
        var message = new {
            type: "CrawlResult",
            body: {
                url: url,
                links: links
            }
        };

        driver.sendFrameworkMessage(JSON.stringify(message));
    }

    function getHttpObject(url) {
        var parsed = urlLib.parse(url);
        switch (parsed.protocol) {
            case "https:":
                return https;
            case "http:":
                return http;
            default :
                return null;
        }
    }

    function parseLinks(content) {
        var regex = /<a[^>]+href=[\"']?([^\"\'>]+)[\"\']?[^>]*>.+?<\/a>/gi;
        var links = [];
        var array;
        while ((array = regex.exec(content)) !== null) {
            var link = array[1];
            links.push(link);
        }

        return links;
    }

    this.on("registered", onRegistered);
    this.on("launchTask", onLaunchTask);
    this.on("error", onError);
}

util.inherits(CrawlExecutor, EventEmitter);

module.exports = CrawlExecutor;