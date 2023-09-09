const list = require("../list.json");
function findMatch(transcription) {
	let result = [];
	transcription = transcription.split(" ");

	for (const person of list) {
		if (person.unique && includesName(transcription, person.unique)) {
			result.push({
				duplicate: false,
				name: person.name,
				place: person.place,
			});
			return result;
		}
		if (
			includesName(transcription, person.first_names) &&
			includesName(transcription, person.last_names)
		) {
			result.push({
				duplicate: true,
				name: person.name,
				place: person.place,
			});
		}
	}
	if (result) {
		return result;
	}

	return null;
}

function includesName(transcription, nameList) {
	let result = false;
	transcription.forEach((element) => {
		if (nameList.includes(element)) {
			return (result = true);
		}
	});
	return result;
}

module.exports = findMatch;
