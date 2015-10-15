## C# Rendler Framework

### Preparation

1. The implementation uses the [mesos-clr](https://github.com/bcrusu/mesos-clr) library which needs to be build and placed to the `ext` directory before building the Rendler project.
2. Pack the Rendler binaries to `rendler.tar.gz` and place the archive to the [frameworks_home](http://mesos.apache.org/documentation/latest/configuration/) directory.

### Running

To start the Rendler framework, run the command: 
```bash
mono rendler.exe -scheduler -master=MASTER_ADDRESS -output=RENDLER_OUTPUT_DIR [-user=RUN_AS_USER]
```


