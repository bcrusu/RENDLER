const MesosApi = require('mesos-api')(0);
const Protos = MesosApi.protos.mesos;

exports.sendTaskRunningStatus = function (driver, taskId) {
    driver.sendStatusUpdate(new Protos.TaskStatus({
        task_id: taskId,
        state: Protos.TaskState.TASK_RUNNING
    }));
};

exports.sendTaskFinishedStatus = function (driver, taskId) {
    driver.sendStatusUpdate(new Protos.TaskStatus({
        task_id: taskId,
        state: Protos.TaskState.TASK_FINISHED
    }));
};

exports.sendTaskErrorStatus = function (driver, taskId) {
    driver.sendStatusUpdate(new Protos.TaskStatus({
        task_id: taskId,
        state: Protos.TaskState.TASK_ERROR
    }));
};