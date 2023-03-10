import { Channel } from './channel.js';

async function getMedia(ws) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, {
            audioBitsPerSecond: 256 * 1024,
            mimeType: 'audio/webm; codecs=opus'
        });


        mediaRecorder.addEventListener('start', (ev) => {
            console.log("started", ev)
        })

        mediaRecorder.addEventListener('dataavailable', async (ev) => {
            if (ev.data.size > 0 && ws.readyState === ws.OPEN) {
                const chunk = ev.data;
                ws.send(chunk)
            }
        })

        mediaRecorder.start(20);
        ws.addEventListener('close', (ev) => {
            console.log('Stopping media recorder');
            mediaRecorder.stop();
        });
    } catch (err) {
        console.error('failed to get microphone:', err);
    }
}

async function connect() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${wsProtocol}://${window.location.host}/`);

    const audioElement = document.createElement("audio");
    const mediaSource = new MediaSource();
    audioElement.src = URL.createObjectURL(mediaSource);
    const messageChannel = new Channel();

    mediaSource.addEventListener('sourceopen', async () => {
        console.log('source open')
        const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');

        sourceBuffer.addEventListener('updateend', async () => {
            console.log('update end')
            const chunk = await messageChannel.next();
            sourceBuffer.appendBuffer(await chunk.arrayBuffer())
        })

        const chunk = await messageChannel.next();
        sourceBuffer.appendBuffer(await chunk.arrayBuffer());
        audioElement.play();
    });


    ws.addEventListener('open', () => {
        console.log('connected');
        getMedia(ws);
    });

    ws.addEventListener('message', (ev) => {
        console.log('message', ev.data);
        messageChannel.append(ev.data);
    });

    ws.addEventListener('close', (ev) => {
        console.log('conneection closed', ev.code);
    });

    ws.addEventListener('error', (ev) => {
        console.log('error', ev.code);
    })

}

document.getElementById('connect-button').addEventListener('click', connect);