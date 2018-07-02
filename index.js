const projectDir = process.argv[2] || process.cwd();
let scpTarget = process.argv[3];

const fs = require('fs');

if (!fs.existsSync(projectDir)) {
    console.error(`ENOENT: no such directory '${projectDir}'`);
    process.exit(1);
}

const path = require('path');
const credFile = path.join(projectDir, '.scp-creds');

if (!scpTarget) {
    if (!fs.existsSync(credFile)) {
        console.error(`ENOENT: no such file '${credFile}'`);
        process.exit(1);
    }
    scpTarget = fs.readFileSync(credFile, 'utf8');
}

const gitignore = path.join(projectDir, '.gitignore');

let ignoredGlobs = [];
if (fs.existsSync(gitignore)) {
    ignoredGlobs = fs.readFileSync(gitignore, 'utf8').split('\n');
}

const Client = require('scp2').Client;
const client = new Client();
client.parse(scpTarget);
client.on('connect', () => {
    process.stdout.write('\r\x1b[K');
    console.log(`Connected to: ${client.remote.host}`)
});
client.on('error', (err) => {
    console.log();
    console.log(err);
    process.exit(1);
});

let fileCount = 0;
const startTime = new Date();

const glob = require('glob-gitignore').glob;
const ProgressBar = require('progress');
const async = require('async');
glob('**', {
    cwd: projectDir,
    ignore: ignoredGlobs
}).then(files => {
    const bar = new ProgressBar('  uploading [:bar] :percent ETE: :etas', {
        incomplete: ' ',
        width: 30,
        total: files.length,
    });
    return new Promise((resolve, reject) => {
        process.stdout.write('Connecting to host...');
        async.eachSeries(files, (file, callback) => {
            const done = () => {
                bar.tick();
                callback();
            }
            const filePath = path.resolve(projectDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return done(err);
                if (!stats.isFile()) return done();
                fileCount++;
                const fileName = path.relative(projectDir, filePath);
                client.upload(filePath, path.join(client.remote.path, fileName), done);
            });
        }, (err) => {
            if (err) return reject(err);
            client.close();
            return resolve();
        });
    });
}).then(() => {
    const elapsed = ((new Date() - startTime) / 1000).toFixed(1);
    console.log(`Transfered ${fileCount} file${fileCount !== 1 ? 's' : ''} in ${elapsed} seconds.`);
})