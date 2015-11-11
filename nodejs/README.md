## Node.js Rendler Framework

### Preparation

1. The implementation uses the [mesos-api](https://github.com/bcrusu/mesos-node) package, which has to be linked manually using the [npm-link](https://docs.npmjs.com/cli/link) command (npmjs.org package to come).
2. Pack the Rendler binaries to `rendler.tar.gz` and place the archive inside the [frameworks_home](http://mesos.apache.org/documentation/latest/configuration/) directory.

### Running

To start the Rendler framework, run the following command: 
```bash
node index.js -scheduler -master=MASTER_ADDRESS -output=RENDLER_OUTPUT_DIR [-starturl=CRAWL_START_URL] [-user=RUN_AS_USER]
```

