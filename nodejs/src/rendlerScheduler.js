const util = require('util');
const path = require('path');
const MesosApi = require('mesos-api');
const Protos = MesosApi.protos.mesos;
const EventEmitter = require('events');
const ByteBuffer = require('bytebuffer');
const dotUtil = require('./dotUtil');

const MaxTasksToRun = 256; // limit for demonstration purpose
const RenderCpus = 1;
const RenderMem = 128;
const CrawlCpus = 0.5;
const CrawlMem = 64;

function RendlerScheduler(startUrl, outputDir, runAsUser) {
    EventEmitter.call(this);

    var _renderQueue = [startUrl];
    var _crawlQueue = [startUrl];
    var _crawled = [];
    var _launchedTasks = 0;
    var _finishedTasksCount = 0;

    var _renderResults = {};
    var _crawlResults = {};

    function onRegistered(driver, frameworkId, masterInfo) {
        console.log("Registered with Mesos master. FrameworkId=" + frameworkId.value);
    }

    function onResourceOffers(driver, offers) {
        for (var i = 0; i < offers.length; i++) {
            var offer = offers[i];
            var tasks = [];
            var resourcesCounter = new ResourcesCounter(offer);
            var done;
            do
            {
                done = true;

                var renderUrl = _renderQueue.pop();
                if (renderUrl && resourcesCounter.hasRenderTaskResources()) {
                    tasks.push(getRenderTaskInfo(offer, ++_launchedTasks, renderUrl));
                    resourcesCounter.subtractRenderResources();
                    done = false;
                }

                var crawlUrl = _crawlQueue.pop();
                if (crawlUrl && resourcesCounter.hasCrawlTaskResources()) {
                    tasks.push(getCrawlTaskInfo(offer, ++_launchedTasks, crawlUrl));
                    resourcesCounter.subtractCrawlResources();
                    _crawled.push(crawlUrl);
                    done = false;
                }
            } while (!done);

            if (tasks.length > 0) {
                driver.launchTasks([offer.id], tasks);
            }
            else
                driver.declineOffer(offer.id);
        }
    }

    function onStatusUpdate(driver, status) {
        if (!isTerminalTaskState(status.state)) {
            console.log("Status update: task " + status.task_id.value + " is in state " + status.state);
            return;
        }

        console.log("Status update: task " + status.task_id.value + " has terminated with state " + status.state);

        if (++_finishedTasksCount == MaxTasksToRun) {
            console.log("Reached the max number of tasks to run. Stopping...");

            var dotWritePath = path.join(outputDir, "result.dot");
            dotUtil.write(dotWritePath, _crawlResults, _renderResults);

            driver.stop();
        }
    }

    function onFrameworkMessage(driver, executorId, slaveId, data) {
        var message = JSON.parse(data);
        var url = message.body.url;

        switch (message.type) {
            case "CrawlResult":
                var links = message.body.links;
                console.log("Framework message 'CrawlResult': got " + links.length + " links from url " + url);

                links
                    .filter(function (link) {
                        return !_crawled.some(function (crawledLink) {
                            return crawledLink === link;
                        });
                    })
                    .forEach(function (link) {
                        _crawlQueue.push(link);
                        _renderQueue.push(link);
                    });

                // update edges: url -> links
                var edges = _crawlResults[url] || [];
                _crawlResults[url] = edges.concat(links);

                // empty edge list for links
                links.forEach(function (link) {
                    _crawlResults[link] = _crawlResults[link] || [];
                });
                break;
            case "RenderResult":
                var fileName = message.body.fileName;
                console.log("Framework message 'RenderResult': saved " + fileName + " for url " + url);

                _renderResults[url] = fileName;
                break;
            default:
                console.log("Unrecognized message type: " + message.type);
                break;
        }
    }

    function onError(driver, message) {
        console.log("Error: " + message);
    }

    function getRenderTaskInfo(offer, uniqueId, url) {
        return new Protos.TaskInfo({
            name: "Rendler.Render_" + uniqueId,
            task_id: new Protos.TaskID({value: uniqueId.toString()}),
            slave_id: offer.slave_id,
            resources: [
                new Protos.Resource({
                    name: "cpus",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({value: RenderCpus})
                }),
                new Protos.Resource({
                    name: "mem",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({value: RenderMem})
                })
            ],
            executor: new Protos.ExecutorInfo({
                executor_id: new Protos.ExecutorID({value: "RenderExecutor"}),
                command: new Protos.CommandInfo({
                    value: "node index.js -executor=render",
                    user: runAsUser,
                    uris: [
                        new Protos.CommandInfo.URI({
                            cache: false,
                            extract: true,
                            value: "./rendler.tar.gz",  // relative to "frameworks_home" mesos-slave command argument
                            executable: false
                        })
                    ]
                }),
                data: ByteBuffer.fromUTF8(outputDir)
            }),
            data: ByteBuffer.fromUTF8(url)
        });
    }

    function getCrawlTaskInfo(offer, uniqueId, url) {
        return new Protos.TaskInfo({
            name: "Rendler.Crawl_" + uniqueId,
            task_id: new Protos.TaskID({value: uniqueId.toString()}),
            slave_id: offer.slave_id,
            resources: [
                new Protos.Resource({
                    name: "cpus",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({value: CrawlCpus})
                }),
                new Protos.Resource({
                    name: "mem",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({value: CrawlMem})
                })
            ],
            executor: new Protos.ExecutorInfo({
                executor_id: new Protos.ExecutorID({value: "CrawlExecutor"}),
                command: new Protos.CommandInfo({
                    value: "node index.js -executor=crawl",
                    user: runAsUser,
                    uris: [
                        new Protos.CommandInfo.URI({
                            cache: false,
                            extract: true,
                            value: "./rendler.tar.gz",  // relative to "frameworks_home" mesos-slave command argument
                            executable: false
                        })
                    ]
                })
            }),
            data: ByteBuffer.fromUTF8(url)
        });
    }

    function ResourcesCounter(offer) {
        var _cpus = 0;
        var _mem = 0;

        var cpusResource = getResource("cpus");
        if (cpusResource)
            _cpus = cpusResource.scalar.value;

        var memResource = getResource("mem");
        if (memResource)
            _mem = memResource.scalar.value;

        function getResource(name) {
            return offer.resources.find(function (r) {
                return r.name === name;
            });
        }

        function subtract(cpus, mem) {
            _cpus = _cpus - cpus;
            _mem = _mem - mem;
        }

        function hasResources(cpus, mem) {
            return _cpus >= cpus && _mem >= mem;
        }

        var result = {};

        result.hasRenderTaskResources = function () {
            return hasResources(RenderCpus, RenderMem);
        };

        result.hasCrawlTaskResources = function () {
            return hasResources(CrawlCpus, CrawlMem);
        };

        result.subtractRenderResources = function () {
            subtract(RenderCpus, RenderMem);
        };

        result.subtractCrawlResources = function () {
            subtract(CrawlCpus, CrawlMem);
        };

        return result;
    }

    function isTerminalTaskState(taskState) {
        return taskState === Protos.TaskState.TASK_FINISHED ||
            taskState === Protos.TaskState.TASK_FAILED ||
            taskState === Protos.TaskState.TASK_KILLED ||
            taskState === Protos.TaskState.TASK_LOST ||
            taskState === Protos.TaskState.TASK_ERROR;
    }

    this.on("registered", onRegistered);
    this.on("resourceOffers", onResourceOffers);
    this.on("statusUpdate", onStatusUpdate);
    this.on("frameworkMessage", onFrameworkMessage);
    this.on("error", onError);
}

util.inherits(RendlerScheduler, EventEmitter);

module.exports = RendlerScheduler;