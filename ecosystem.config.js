module.exports = {
  apps : [{
    script : "./server.js",
    name: "vpatlas-node-postgis-api",
    exec_mode: "cluster", // "cluster" or "fork"
    instances: 3, //-1,  // number of CPUs -1
    watch: true,  // auto restart app on change
    ignore_watch: ["node_modules"],
    watch_delay: 3000,
/*
    wait_ready: true, // wait for app to send process.send('ready')
    listen_timeout: 10000, //timeout to wait for the ready signal, otherwise... do what?
*/
    // Removing the default env means a no-arg call ('pm2 start')
    // will try to detect server context from os hostname
/*
    env: {
       NODE_ENV: "prod",
       watch: ["./server.js", "/etc/etsencrypt/live"]
    },
*/
    env_dev: {
       NODE_ENV: "dev-local",
       watch: ["./server.js","_helpers","users","vcgiMapData","vtInfo","vpMapped","vpPools","vpReview","vpSurvey","vpUtil","vpVisit"],
    },
    env_dev_local: {
       NODE_ENV: "dev-local",
       watch: ["./server.js","_helpers","users","vcgiMapData","vtInfo","vpMapped","vpPools","vpReview","vpSurvey","vpUtil","vpVisit"],
    },
    env_dev_remote: {
       NODE_ENV: "dev-remote",
       watch: ["./server.js", "/etc/etsencrypt/live"]
    },
    env_prod: {
       NODE_ENV: "prod",
       watch: ["./server.js", "/etc/etsencrypt/live"]
    },
    env_production: {
       NODE_ENV: "prod",
       watch: ["./server.js", "/etc/etsencrypt/live"]
    }
  }]
}
