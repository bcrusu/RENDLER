const MesosApi = require('mesosApi')(0);
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

exports.isTerminalTaskState = function (taskState) {
    return taskState === Protos.TaskState.TASK_FINISHED ||
        taskState === Protos.TaskState.TASK_FAILED ||
        taskState === Protos.TaskState.TASK_KILLED ||
        taskState === Protos.TaskState.TASK_LOST ||
        taskState === Protos.TaskState.TASK_ERROR;
};