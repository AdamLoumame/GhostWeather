import {continents} from "/src/dicts.js"
import {OnMain} from "/src/utilities.js"

let searchBar = document.querySelector(".search-bar")
let searchButton = document.querySelector(".search-button")

// search listeners
searchButton.addEventListener("click", e => {
	if (searchBar.value) bigUpdate(searchBar.value), resetSugg()
})
document.addEventListener("keyup", e => {
	if (searchBar.value && e.code === "Enter") {
		if (document.querySelector(".suggestions li.active")) {
			bigUpdate(document.querySelector(".suggestions li.active").dataset.place)
		} else if (document.querySelector(".suggestions li")) {
			bigUpdate(document.querySelector(".suggestions li").dataset.place)
		} else {
			bigUpdate(searchBar.value)
		}
		resetSugg()
	}
})

function undisplaySugg() {
	document.querySelector(".separator").style.opacity = "0"
	document.querySelector(".suggestions").style.display = "none"
}
// search Bar SUGGESTION AND AUTOCOMPLETE
searchBar.addEventListener("input", async _ => {
	if (searchBar.value.length > 3) {
		let cities = await fetch(`https://api.weatherapi.com/v1/search.json?key=0bb3890e2cdc4fbabd5164832240711&q=${searchBar.value}&cnt=5`)
		let citiesArr = await cities.json()

		// display cities into suggestions box
		let suggBox = document.querySelector(".suggestions")
		suggBox.innerHTML = ""
		let succDisplay = false // catching not valid places
		for (let place of citiesArr) {
			let imagePack = document.querySelector(".mode").classList[1] // dark or light
			let continentRequest = await fetch(`https://restcountries.com/v3.1/name/${place.country.split(" ")[0]}?fields=continents`)
			if (continentRequest.ok) {
				let continent = (await continentRequest.json())[0].continents[0]
				let continentSRC = continents[imagePack][continent]
				// el creation
				let sugg = document.createElement("li")
				sugg.dataset.place = place.url
				sugg.dataset.continent = continent
				sugg.innerHTML = `<img class="continent" src="${continentSRC}">
                                  <div class="info">
                                      <span class="cityName">${place.name}</span>
                                      <span class="countryName">${place.country}</span>
                                  </div>
                              `
				let check = true
				Array.from(suggBox.children).forEach(sugg => sugg.dataset.place === place.url && (check = false))
				if (check && suggBox.children.length <= 5) suggBox.appendChild(sugg)
				// displaying data placing on clicking
				sugg.addEventListener("click", e => {
					bigUpdate(place.url)
					resetSugg()
				})
				succDisplay = true
			}
		}

		// display sugg box if there is suggestions
		if (!succDisplay) {
			undisplaySugg()
		} else {
			document.querySelector(".separator").style.opacity = "1"
			document.querySelector(".suggestions").style.display = "flex"
		}

		// updaating current on the search bar
		current = -1
	} else {
		undisplaySugg()
	}
})
// update depending on the mode
export function UpdateSugg() {
	let suggBox = document.querySelector(".suggestions")
	Array.from(suggBox.children).forEach(sugg => {
		let imagePack = document.querySelector(".mode").classList[1] // dark or light
		let continentSRC = continents[imagePack][sugg.dataset.continent]
		sugg.querySelector(".continent").src = continentSRC
	})
}
// arrows navigation over the sugge
let current = -1
document.addEventListener("keydown", e => {
	if (e.code === "ArrowDown" && current < document.querySelector(".suggestions").childElementCount - 1) {
		current++
		makeSugActive(current)
	}
	if (e.code === "ArrowUp" && current > 0) {
		current--
		makeSugActive(current)
	}
})
function makeSugActive(i) {
	document.querySelectorAll(".suggestions li").forEach(c => c.classList.remove("active"))
	document.querySelector(".suggestions").children[i].classList.add("active")
}
// undisplay Search Bar on clicking other part
window.addEventListener("click", e => {
	if (!document.querySelector(".search").contains(e.target) && !document.querySelector(".mode").contains(e.target)) {
		undisplaySugg()
	}
})
// the BIG UPADATE function that regroupes all changes
export async function bigUpdate(value) {
	if (OnMain()) {
		let [{UpdateMidle}, {UpdateLower}, {updateUnit}] = await Promise.all([import("/src/dashboard/midle.js"), import("/src/dashboard/lower.js"), import("/src/settings.js")])
		await UpdateMidle(value)
		await UpdateLower(value)
		updateUnit()
	} else {
		let {DisplayCharts} = await import("/src/statistics/Charts.js")
		await DisplayCharts(value)
	}
}
function resetSugg() {
	searchBar.value = ""
	document.querySelector(".suggestions").innerHTML = ""
	current = -1
	undisplaySugg()
}
