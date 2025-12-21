const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'AIScoperPortal',
    description: 'The AI Scoping Portal web server (Daniel)',
    script: path.join(__dirname, 'src', 'app.js'),
    env: [
        {
            name: "PORT",
            value: 3000
        },
        {
            name: "NODE_ENV",
            value: "production"
        }
    ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
    console.log('Service installed successfully!');
    console.log('Starting service...');
    svc.start();
});

svc.on('alreadyinstalled', function () {
    console.log('This service is already installed.');
    console.log('Attempting to start it...');
    svc.start();
});

svc.on('start', function () {
    console.log('Service started!');
    console.log('App is running on port 3000.');
});

// Install the script as a service.
console.log('Installing Windows Service...');
svc.install();
