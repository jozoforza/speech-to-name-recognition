const speech = require("@google-cloud/speech");
2;
const recorder = require("node-record-lpcm16");

const client = new speech.SpeechClient({
	keyFilename:
		"/home/smacica/Downloads/speech-to-text-oslava2023-086e9f900ee7.json",
});

const encoding = "LINEAR16";
const sampleRateHertz = 16000;
const languageCode = "sk-Sk";

const request = {
	config: {
		encoding: encoding,
		sampleRateHertz: sampleRateHertz,
		languageCode: languageCode,
	},
	interimResults: false,
};

const recognizeStream = client
	.streamingRecognize(request)
	.on("error", console.error)
	.on("data", (data) => {
		// console.log(`Transcription: ${data.results[0].alternatives[0].transcript}`);
		console.log(data.results[0].alternatives);
	});

console.log("Listening, press Ctrl+C to stop.");
recorder
	.record({
		sampleRateHertz: sampleRateHertz,
		threshold: 0,
		verbose: false,
		recordProgram: "rec",
		silence: "10.0",
	})
	.stream()
	.on("error", console.error)
	.pipe(recognizeStream);
module.exports = { recognizeStream };
