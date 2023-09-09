function removeDiacritics(str) {
	const accents = "ÁČĎÉÍĹĽŇÓŔŠŤÚÝŽáčďéíĺľňóŕšťúýž";
	const without = "ACDEILNORSSTUYZacdeillnorstuyz";
	const map = {};

	for (let i = 0; i < accents.length; i++) {
		map[accents[i]] = without[i];
	}

	return str
		.split("")
		.map((letter) => map[letter] || letter)
		.join("");
}

module.exports = removeDiacritics;
