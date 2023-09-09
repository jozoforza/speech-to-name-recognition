const { SpeechClient } = require("@google-cloud/speech");

const initializeSpeech = () => {
	const client = new SpeechClient({
		keyFilename: "/path/toGKey.json",
	});

	const request = {
		config: {
			encoding: "LINEAR16",
			sampleRateHertz: 16000,
			languageCode: "sk-Sk",
		},
		interimResults: false,
	};

	return client
		.streamingRecognize(request)
		.on("error", console.error)
		.on("data", (data) => {
			console.log(data.results[0].alternatives);
		});
};

module.exports = initializeSpeech;
