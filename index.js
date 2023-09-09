const express = require("express");
const app = express();
const PORT = 4001;

const speech = require("@google-cloud/speech");
const speechClient = new speech.SpeechClient({
	keyFilename:
		"/home/smacica/Downloads/speech-to-text-oslava2023-086e9f900ee7.json",
});

const multer = require("multer");
const findMatch = require("./services/match");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const removeDiacritics = require("./services/removeDia");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/process-audio", upload.single("audio"), async (req, res) => {
	if (!req.file) {
		return res.status(400).send("No audio file uploaded");
	}

	const tempAudioFilePath = path.join(
		__dirname,
		"uploads",
		"temp_" + Date.now() + "-" + req.file.originalname
	);
	const mp3AudioFilePath = path.join(__dirname, "uploads", Date.now() + ".mp3");

	// Save the uploaded audio to a temporary location
	fs.writeFileSync(tempAudioFilePath, req.file.buffer);

	try {
		// Convert the audio to MP3 using the saved temporary file
		await new Promise((resolve, reject) => {
			ffmpeg(tempAudioFilePath)
				.toFormat("mp3")
				.on("end", resolve)
				.on("error", reject)
				.save(mp3AudioFilePath);
		});

		// Delete the temporary uploaded file
		fs.unlinkSync(tempAudioFilePath);

		const audioBytes = fs.readFileSync(mp3AudioFilePath).toString("base64");

		const request = {
			audio: {
				content: audioBytes,
			},
			config: {
				encoding: "MP3",
				sampleRateHertz: 16000,
				languageCode: "sk-SK",
			},
		};

		const [response] = await speechClient.recognize(request);
		const transcription = response.results
			.map((result) => result.alternatives[0].transcript)
			.join("\n");
		console.log(`transcription:${transcription}`);

		const cleanTranscription = removeDiacritics(transcription).toLowerCase();

		const match = findMatch(cleanTranscription);
		console.log(match);

		if (match) {
			res.status(200).json({ message: "Match found", match });
		} else {
			res.status(200).json({ message: "No match found please try again" });
		}
	} catch (error) {
		console.error("Error processing the audio:", error);
		res.status(500).send("Internal Server Error");
	}
});

app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});
