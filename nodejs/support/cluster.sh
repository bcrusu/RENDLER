#!/bin/bash

SCRIPTDIR=$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)

CLUSTER_WORK_DIR=${SCRIPTDIR}/work
RENDLER_OUTPUT_DIR=/tmp/rendlerout
APPDIR=${SCRIPTDIR}/../

copy_files() {
	if [ ! -d "$CLUSTER_WORK_DIR" ]; then
		echo "Creating cluster work dir: $CLUSTER_WORK_DIR ..."
		mkdir "$CLUSTER_WORK_DIR"
	fi

	if [ ! -d "$RENDLER_OUTPUT_DIR" ]; then
		echo "Creating rendler output dir: $RENDLER_OUTPUT_DIR ..."
		mkdir "$RENDLER_OUTPUT_DIR"
		chmod 777 $RENDLER_OUTPUT_DIR
	fi


	cd $APPDIR
	tar -czf ${CLUSTER_WORK_DIR}/rendler.tar.gz * --exclude='support*'
	cd -
}

start_cluster() {
	copy_files

	export LD_LIBRARY_PATH=/usr/local/lib:${LD_LIBRARY_PATH}

	mesos-master --cluster=mesosclr --ip=127.0.0.50 --port=5050 --allocation_interval=1secs --registry=in_memory --quorum=1 --quiet \
		--log_dir=${CLUSTER_WORK_DIR}/master/logs --work_dir=${CLUSTER_WORK_DIR}/master/data &

	sleep 0.5s

	mesos-slave --master=127.0.0.50:5050 --ip=127.0.0.51 --port=5051 --resources="cpus:2;mem:512" --attributes=name:slave1 --quiet \
		--frameworks_home=${CLUSTER_WORK_DIR} --log_dir=${CLUSTER_WORK_DIR}/slave1/logs --work_dir=${CLUSTER_WORK_DIR}/slave1/data &

	sleep 0.2s

	mesos-slave --master=127.0.0.50:5050 --ip=127.0.0.52 --port=5052 --resources="cpus:2;mem:512" --attributes=name:slave2 --quiet \
		--frameworks_home=${CLUSTER_WORK_DIR} --log_dir=${CLUSTER_WORK_DIR}/slave2/logs --work_dir=${CLUSTER_WORK_DIR}/slave2/data &

	sleep 0.2s

	mesos-slave --master=127.0.0.50:5050 --ip=127.0.0.53 --port=5053 --resources="cpus:2;mem:512" --attributes=name:slave3 --quiet \
		--frameworks_home=${CLUSTER_WORK_DIR} --log_dir=${CLUSTER_WORK_DIR}/slave3/logs --work_dir=${CLUSTER_WORK_DIR}/slave3/data &
}

stop_cluster() {
	killall -q mesos-slave
	killall -q mesos-master
}

clean() {
	echo "Removing cluster work dir at: $CLUSTER_WORK_DIR ..."
	rm -rf "$CLUSTER_WORK_DIR"

	echo "Removing temp Mesos dir at: /tmp/mesos ..."
	rm -rf /tmp/mesos

	echo "Removing Rendler output dir at: $RENDLER_OUTPUT_DIR ..."
	rm -rf $RENDLER_OUTPUT_DIR
}

if [ "$(id -u)" != "0" ]; then
   echo "Mesos requires to be executed as root."
   exit 1
fi

if [ -z "$SCRIPTDIR" ]; then
	echo "Could not detect current script dir..."
	exit 1
fi

case "$1" in
	start)
		echo "Starting..."
		start_cluster
		echo "Done."
		;;
	stop)
		echo "Stopping..."
		stop_cluster
		echo "Done."
		;;
	clean)
		echo "Cleaning cluster dir..."
		clean
		echo "Done."
		;;
	restart)
		echo "Stopping..."
		stop_cluster
	
		if [ "$2" = "-c" ]; then
			echo "Cleaning cluster dir..."
			clean
		fi

		echo "Starting..."
		start_cluster
		echo "Done."
		;;
	*)
		echo "Usage: cluster {start|stop|restart|clean}"
		exit 1
		;;
esac
