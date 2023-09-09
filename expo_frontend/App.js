import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	Button,
	Alert,
} from "react-native";
import { Audio } from "expo-av";
import successMelody from "./correct.mp3";

export default function AudioRecorder() {
	const [isRecording, setIsRecording] = useState(false);
	const [isLoading, setLoading] = useState(false);

	const [recording, setRecording] = useState(null);
	const [message, setMessage] = useState("message");
	const [view, setView] = useState("idle");
	const [matches, setMatches] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);

	async function askForPermissionAndInitialize() {
		try {
			const { granted } = await Audio.requestPermissionsAsync();
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: false,
			});

			if (!granted) {
				Alert.alert(
					"Permission Denied",
					"You must grant audio recording permission to use this feature."
				);
				return;
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: false,
			});

			Alert.alert("Success", "Audio initialized!");
		} catch (error) {
			console.error(
				"Error during permission request and initialization:",
				error
			);
			Alert.alert(
				"Initialization Error",
				"Error during initialization. Please try again."
			);
		}
	}

	async function startRecording() {
		try {
			let recordingInstance = new Audio.Recording();
			await recordingInstance.prepareToRecordAsync(
				Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
			);
			await recordingInstance.startAsync();

			setRecording(recordingInstance);
			setIsRecording(true);
		} catch (error) {
			console.error("Error starting audio recording:", error);
			Alert.alert(
				"Recording Error",
				"Error starting audio recording. Please try again."
			);
		}
	}

	async function stopRecording() {
		try {
			setIsRecording(false);
			setLoading(true);
			if (recording) {
				await recording.stopAndUnloadAsync();
				const uri = recording.getURI();

				// send the recorded audio to the server
				let formData = new FormData();
				formData.append("audio", {
					uri,
					type: "audio/wav", // or 'audio/mp3', depending on the format you're using
					name: "audioFile.wav", // or 'audioFile.mp3'
				});

				fetch("http://192.168.0.101:4001/process-audio", {
					method: "POST",
					body: formData,
					headers: {
						"Content-Type": "multipart/form-data",
					},
				})
					.then((response) => response.json())
					.then((data) => {
						setLoading(false);

						if (data.match) {
							if (data.match.length === 1) {
								setView("single");
								setMessage(`🖐️Hi ${data.match[0].name} !`);
							} else if (data.match.length === 0) {
								alert("Try again 😉");
							} else {
								setView("multiple");
								setMatches(data.match);
							}
						} else {
							setMessage(data.message);
						}
					})
					.catch((error) => {
						console.error("There was an error uploading the audio:", error);
						Alert.alert("Error", "Unable to upload the audio. Try again.");
					});
			}
		} catch (error) {
			console.error("Error stopping audio recording:", error);
		}
	}

	function selectItem(item) {
		setSelectedItem(item);
		setView("single");
		setMessage(`🖐️Cau ${item.name} !`);
	}
	useEffect(() => {
		async function playMelody() {
			if (view === "single") {
				try {
					const { sound } = await Audio.Sound.createAsync(successMelody);
					await sound.playAsync();
					// You might want to listen for when the sound finishes playing to unload it
					sound.setOnPlaybackStatusUpdate(async (status) => {
						if (status.didJustFinish) {
							await sound.unloadAsync();
						}
					});
				} catch (error) {
					console.error("Error playing melody:", error);
				}
			}
		}

		playMelody();
	}, [view]);

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			position: "relative",
		},
		infoText: {
			flex: 1,
			position: "absolute",
			top: 10,
			left: 0,
			right: 0,
			textAlign: "center",
			fontSize: 30,
			margin: 40,
		},
		animationContainer: {
			position: "absolute",
			top: 50,
			left: 0,
			right: 0,
			alignItems: "center",
		},
		buttonContainer: {
			position: "absolute",
			top: "50%",
			left: "50%",
			transform: [
				{ translateX: -150 }, // Adjust these values to move the button to the correct position
				{ translateY: -150 },
			],
			width: 300, // Set a specific width
			height: 300, // Set a specific height
			padding: 20,
			backgroundColor: "#f0f0f0",
			borderRadius: 150, // Set borderRadius to half of width and height to get a circle
			justifyContent: "center", // Center the text vertically
			alignItems: "center", // Center the text horizontally
			backgroundColor: "red",
		},
		initButton: {
			position: "absolute",
			bottom: 10,
			left: 0,
			right: 0,
		},
		singleView: {
			fontSize: 35,
			flex: 1,
			backgroundColor: "#7bfc03",
			justifyContent: "center",
			alignItems: "center",
		},
		multipleView: {
			flex: 1,
			backgroundColor: "#3da8ff",
			justifyContent: "center",
			alignItems: "center",
		},
		backButton: {
			position: "absolute",
			top: 20,
			left: 20,
		},
		item: {
			margin: 10,
			padding: 10,
			backgroundColor: "#fff",
		},
		singleViewText: {
			fontSize: 30,
			textAlign: "center",
			margin: 10,
		},
		infoButtText: {
			color: "white",
			fontSize: 25,
			textAlign: "center",
		},
	});

	if (view === "single") {
		return (
			<View style={styles.singleView}>
				<Text style={styles.singleViewText}>{message}</Text>
				<TouchableOpacity
					style={{
						backgroundColor: "blue",
						padding: 10,
						borderRadius: 5,
						alignItems: "center",
						justifyContent: "center",
					}}
					onPress={() => setView("idle")}
				>
					<Text style={{ color: "white", fontSize: 20 }}>Back ◀️</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (view === "multiple") {
		return (
			<View style={styles.multipleView}>
				<Text style={styles.infoText}>Who are u fron the following🙎:</Text>
				{matches.map((item, index) => (
					<TouchableOpacity
						key={index}
						style={styles.item}
						onPress={() => selectItem(item)}
					>
						<Text>{item.name}</Text>
					</TouchableOpacity>
				))}
				<Button title="Go Back" onPress={() => setView("idle")} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.infoText}>Hold the button and tell your name 👍</Text>
			<Text
				style={{
					flex: 1,
					position: "absolute",
					top: 150,
					left: 0,
					right: 0,
					textAlign: "center",
					fontSize: 20,
				}}
			>
				{isLoading ? "⚙️Loading..." : ""}
			</Text>

			<TouchableOpacity
				onPressIn={startRecording}
				onPressOut={stopRecording}
				style={styles.buttonContainer}
			>
				<Text style={styles.infoButtText}>
					{isRecording ? "Pocuvam..." : "Podrz a hovor"}
				</Text>
			</TouchableOpacity>
			<View style={styles.initButton}>
				<Button
					title="Ask for Permission and Initialize Audio"
					onPress={askForPermissionAndInitialize}
				/>
			</View>
		</View>
	);
}
