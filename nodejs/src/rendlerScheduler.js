const util = require('util');
const MesosApi = require('mesosApi')(0);
const Protos = MesosApi.protos.mesos;
const EventEmitter = require('events');

const MaxTasksToRun = 256; // limit for demonstration purpose
const RenderCpus = 1;
const RenderMem = 128;
const CrawlCpus = 0.5;
const CrawlMem = 64;

function RendlerScheduler(startUrl, outputDir, runAsUser) {
    EventEmitter.call(this);

    var _renderQueue = [ startUrl ];
    var _crawlQueue = [ startUrl ];
    var _crawled = [];
    var _launchedTasks = 0;

    function onRegistered(driver, frameworkId, masterInfo) {
        console.log("Registered with Mesos master. FrameworkId=" + frameworkId.value);
    }

    function onResourceOffers(driver, offers) {
        for (var i = 0; i < offers.length; i++)
        {
            var offer = offers[i];
            var tasks = [];
            var resourcesCounter = new ResourcesCounter(offer);
            var done;
            do
            {
                done = true;

                var renderUrl = _renderQueue.pop();
                if (renderUrl && resourcesCounter.hasRenderTaskResources())
                {
                    tasks.push(getRenderTaskInfo(offer, ++_launchedTasks, renderUrl));
                    resourcesCounter.subtractRenderResources();
                    done = false;
                }

                var crawlUrl = _crawlQueue.pop();
                if (crawlUrl && resourcesCounter.hasCrawlTaskResources())
                {
                    tasks.push(getCrawlTaskInfo(offer, ++_launchedTasks, crawlUrl));
                    resourcesCounter.subtractCrawlResources();
                    _crawled.push(crawlUrl);
                    done = false;
                }
            } while (!done);

            if (tasks.length > 0) {
                driver.launchTasks ([offer.id], tasks);
            }
            else
                driver.declineOffer(offer.id);
        }
    }

    function onStatusUpdate(driver, status) {
        //TODO:
    }

    function onFrameworkMessage(driver, executorId, slaveId, data) {
        //TODO:
    }

    function onError(driver, message) {
        console.log("Error: " + message);
    }

    function getRenderTaskInfo(offer, uniqueId, url)
    {
        return new Protos.TaskInfo({
            name: "Rendler.Render_" + uniqueId,
            task_id: new Protos.TaskID({ value: uniqueId.toString() }),
            slave_id: offer.slave_id,
            resources: [
                new Protos.Resource({
                    name: "cpus",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({ value: RenderCpus })
                 }),
                new Protos.Resource({
                    name: "mem",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({ value: RenderMem })
                })
            ],
            executor: new Protos.ExecutorInfo({
                executor_id: new Protos.ExecutorID({ value: "RenderExecutor" }),
                command: new Protos.CommandInfo({
                    value: "mono rendler.exe -executor=render",  //TODO
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
                data: "" //TODO: Encoding.UTF8.GetBytes (_outputDir)
            }),
            data: "" //TODO: Encoding.UTF8.GetBytes (url)
        });
    }

    function getCrawlTaskInfo(offer, uniqueId, url)
    {
        return new Protos.TaskInfo({
            name: "Rendler.Crawl_" + uniqueId,
            task_id: new Protos.TaskID({ value: uniqueId.toString() }),
            slave_id: offer.slave_id,
            resources: [
                new Protos.Resource({
                    name: "cpus",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({ value: CrawlCpus })
                }),
                new Protos.Resource({
                    name: "mem",
                    type: Protos.Value.Type.SCALAR,
                    scalar: new Protos.Value.Scalar({ value: CrawlMem })
                })
            ],
            executor: new Protos.ExecutorInfo({
                executor_id: new Protos.ExecutorID({ value: "CrawlExecutor" }),
                command: new Protos.CommandInfo({
                    value: "mono rendler.exe -executor=crawl",  //TODO
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
            }),
            data: "" //TODO: Encoding.UTF8.GetBytes (url)
        });
    }

    function ResourcesCounter(offer)
    {
        var _cpus = 0;
        var _mem = 0;

        var cpusResource = getResource("cpus");
        if (cpusResource)
            _cpus = cpusResource.scalar.value;

        var memResource = getResource("mem");
        if (memResource)
            _mem = memResource.scalar.value;

        function getResource(name){
            return offer.resources.find(function (r){
                return r.name === name;
            });
        }

        function subtract(cpus, mem)
        {
            _cpus = _cpus - cpus;
            _mem = _mem - mem;
        }

        function hasResources(cpus, mem)
        {
            return _cpus >= cpus && _mem >= mem;
        }

        var result = {};

        result.hasRenderTaskResources = function() {
            return hasResources(RenderCpus, RenderMem);
        };

        result.hasCrawlTaskResources = function() {
            return hasResources(CrawlCpus, CrawlMem);
        };

        result.subtractRenderResources = function() {
            subtract(RenderCpus, RenderMem);
        };

        result.subtractCrawlResources = function () {
            subtract(CrawlCpus, CrawlMem);
        };

        return result;
    }

    this.on("registered", onRegistered);
    this.on("resourceOffers", onResourceOffers);
    this.on("statusUpdate", onStatusUpdate);
    this.on("frameworkMessage", onFrameworkMessage);
    this.on("error", onError);
}

util.inherits(RendlerScheduler, EventEmitter);

module.exports = RendlerScheduler;