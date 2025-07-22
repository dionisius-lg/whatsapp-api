const redis = require('ioredis');
const config = require('./index');
const valueHelper = require('./../helpers/value');

const { cache: { host, port, password, db, duration, service } } = config;
const { isEmpty } = valueHelper;

const options = { host, port, db, enableOfflineQueue: true };
const channel =  `__keyevent@${db}__:expired`;

if (!isEmpty(password)) {
    options.password = password;
}

let subscriber = false;
let client = null;
let connected = false;

if (service.toString() === '1') {
    const subscribe = new redis(options);
    client = new redis(options);

    subscriber = subscribe(channel);

    subscriber.subscribe(channel, (err, count) => {
        if (err) {
            console.error(`[cache] Subscription error: ${err.message}`);

            return;
        }

        console.log(`[cache] Subscribed to ${count} channel(s)`);
    });

    client.on('ready', () => {
        console.log('[cache] is ready');
        client?.config('SET', 'notify-keyspace-events', 'Ex');
    });

    client.on('connect', () => {
        console.log('[cache] is connected');
        connected = true;
    });

    client.on('error', (err) => {
        console.error(`[cache] error: ${err?.message}`);
        connected = false;
    });

    client.on('reconnecting', () => {
        console.log('[cache] reconnecting...');
        connected = false;
    });
}

module.exports = {
    client,
    connected,
    duration
};
