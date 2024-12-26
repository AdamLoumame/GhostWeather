import {UpdateSugg} from "/src/search.js"
import {OnMain, OnStats} from "/src/utilities.js"
// all the changes that occures while changing mode
async function applyChanges() {
	// searchBar update
	UpdateSugg()

	// Main changes
	if (OnMain()) {
		let [{makeActive, resetBoxes, showRainGraph, UpdateBoxImage, updateImagePack}, {UpdateLower, updateMarkersImages}] = await Promise.all([import("/src/dashboard/midle.js"), import("/src/dashboard/lower.js")])
		// midle
		updateImagePack()
		// day / tomorrow changes
		UpdateBoxImage(document.querySelector(".main.today"))
		UpdateBoxImage(document.querySelector(".main.tomorrow"))
		// Forecast
		let lastActive = document.querySelector(".day.active")
		resetBoxes()
		makeActive(lastActive)
		// rain graph changes
		showRainGraph()

		// lower Updates
		UpdateLower()
		updateMarkersImages()
	}
	if (OnStats()) {
		let {DisplayCharts} = await import("/src/statistics/Charts.js")
		DisplayCharts()
	}
}

// applying mode from localStorage if there is
if (localStorage.getItem("mode")) {
	if (localStorage.getItem("mode") === "light") {
		light()
	} else {
		dark()
	}
} else {
	if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
		dark()
	} else {
		light()
	}
}
// add event to modes checkboxes
document.querySelectorAll(".mode i").forEach(mode => {
	mode.addEventListener("click", _ => {
		// change the theme
		if (mode.classList.contains("light")) {
			light()
		} else {
			dark()
		}
	})
})
// activate dark mode function
export function dark() {
	// active class to the clicked
	document.querySelectorAll(".mode i").forEach(mode => mode.classList.remove("active"))
	document.querySelector(".mode .dark").classList.add("active")

	// controle the toggle position ( using ::before )
	document.querySelector(".mode").classList.remove("light")
	document.querySelector(".mode").classList.add("dark")

	document.documentElement.style.setProperty("--main-text-color", "#f5f5f5")
	document.documentElement.style.setProperty("--sec-text-color", "#b3b3b3")
	document.documentElement.style.setProperty("--bg-color", "#090909")
	document.documentElement.style.setProperty("--sec-bg-color", "#121212")
	document.documentElement.style.setProperty("--icon-bg-color", "#1c1c1c")
	document.documentElement.style.setProperty("--border-color", "#333333")
	// settings wind change image
	if (document.querySelector(".tools .container .settings .wind")) document.querySelector(".tools .container .settings .wind .windChoice").src = "/images/weather/simboles/dark-mode-wind.png"
	// saving last mode in localStorage
	localStorage.setItem("mode", "dark")

	document.querySelector(".theme").classList.add("dark")
	document.querySelector(".theme").classList.replace("light", "dark")

	applyChanges()
}
// activate light mode function
export function light() {
	// active class to the clicked
	document.querySelectorAll(".mode i").forEach(mode => mode.classList.remove("active"))
	document.querySelector(".mode .light").classList.add("active")

	// controle the toggle position ( using ::before )
	document.querySelector(".mode").classList.remove("dark")
	document.querySelector(".mode").classList.add("light")

	document.documentElement.style.setProperty("--main-text-color", "#1c1c1c")
	document.documentElement.style.setProperty("--sec-text-color", "#5e5e5e")
	document.documentElement.style.setProperty("--bg-color", "#f7f7f7")
	document.documentElement.style.setProperty("--sec-bg-color", "#ffffff")
	document.documentElement.style.setProperty("--icon-bg-color", "#e9e9e9")
	document.documentElement.style.setProperty("--border-color", "#dcdcdc")
	// settings wind change image
	if (document.querySelector(".tools .container .settings .wind")) document.querySelector(".tools .container .settings .wind .windChoice").src = "/images/weather/simboles/white-mode-wind.png"
	// saving last mode in localStorage
	localStorage.setItem("mode", "light")

	document.querySelector(".theme").classList.replace("dark", "light")
	document.querySelector(".theme").classList.add("light")

	applyChanges()
}
