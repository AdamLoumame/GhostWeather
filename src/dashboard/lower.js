import {getSimpleDataByCords, getSimpleDataByName} from "./src/api.js"
import {mainWeatherConditions, biggestCities} from "./src/dicts.js"
import {bigUpdate} from "./src/search.js"
import {getUserCords, filterImage, toggleCitiesLoader, toggleCitiesError} from "./src/utilities.js"

// default
let defaultPlace = await getUserCords()
let data = await getSimpleDataByName(defaultPlace) // default place data
// default cities
let chosedCities = []
displayRandCities()

// Updating
export async function UpdateLower(value = "") {
	mode = document.querySelector(".mode").classList[1]
	UpdateCitiesImage()
	if (lastLayer !== ReaLayer) {
		applyLayer()
	}
	displayMapWeather()
	if (value) {
		data = await getSimpleDataByName(value)
		map.getView().animate({
			center: ol.proj.fromLonLat([data.location.lon, data.location.lat]),
			zoom: 12,
			duration: 1500
		})
	}
}
////////////////         MAP          ///////////////
// markers group
let markers = []
let map = new ol.Map({
	view: new ol.View({
		center: ol.proj.fromLonLat([data.location.lon, data.location.lat]),
		zoom: 10,
		minZoom: 3,
		maxZoom: 18
	}),
	target: "map"
})
// get user location and travel to it on click on the loc button
document.querySelector(".zoom-location").addEventListener("click", async _ => {
	map.getView().animate({
		center: ol.proj.fromLonLat(
			defaultPlace
				.split(" ")
				.map(cord => Number(cord))
				.reverse()
		),
		zoom: 14,
		duration: 1500
	})
})
let darkLayer = new ol.layer.Tile({
	source: new ol.source.XYZ({
		url: "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png"
	}),
	visible: false,
	title: "darkLayer"
})
let lightLayer = new ol.layer.Tile({
	source: new ol.source.XYZ({
		url: "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png"
	}),
	visible: false,
	title: "lightLayer"
})
let ReaLayer = new ol.layer.Tile({
	source: new ol.source.XYZ({
		url: "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
	}),
	visible: false,
	title: "lightLayer",
	crossOrigin: "anonymous"
})
let lastLayer
let mode = document.querySelector(".mode").classList[1]
applyLayer()
map.addLayer(ReaLayer)
map.addLayer(darkLayer)
map.addLayer(lightLayer)
// displaying weather condition and update while mvt occurs and clicking changes
map.on("moveend", async _ => {
	displayMapWeather()
})
async function displayMapWeather() {
	let places = (await getBoundedCities(map.getView().calculateExtent())).elements
	// remove unneeded markers and update places so alr there wont be replaced
	markers.forEach(marker => {
		let usedMarker
		places.forEach(place => {
			let [markerLat, markerLon] = marker.getSource().getFeatures()[0].get("class")[0]
			if (markerLat === place.lat && markerLon === place.lon) (usedMarker = true), places.splice(places.indexOf(place), 1)
		})
		if (!usedMarker) map.removeLayer(marker), marker.getSource().removeFeature(marker.getSource().getFeatures()[0]), markers.splice(markers.indexOf(marker), 1)
	})
	places.forEach(async place => {
		// place marker according to the place data
		let palceData = await getSimpleDataByCords(place.lat, place.lon)
		let marker = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [
					new ol.Feature({
						geometry: new ol.geom.Point(ol.proj.fromLonLat([place.lon, place.lat]))
					})
				]
			}),
			style: Styling(palceData.current.condition.code, palceData.current.is_day)
		})
		marker
			.getSource()
			.getFeatures()[0]
			.set("class", [[place.lat, place.lon], palceData.current.condition.code, palceData.current.is_day])
		map.addLayer(marker)
		markers.push(marker)
	})
}
function Styling(code, is_day) {
	return new ol.style.Style({
		image: new ol.style.Icon({
			src: [800, 1000].includes(code) && !is_day ? "/images/weather/simboles/moon.png" : [800, 1000].includes(code) && is_day ? "/images/weather/simboles/small-sun.png" : filterImage(code, is_day, mainWeatherConditions),
			scale: 0.3
		})
	})
}
export function updateMarkersImages() {
	markers.forEach(marker => {
		marker
			.getSource()
			.getFeatures()[0]
			.setStyle(Styling(marker.getSource().getFeatures()[0].get("class")[1], marker.getSource().getFeatures()[0].get("class")[2]))
	})
}
// getting the cities displayed to the user
async function getBoundedCities(cords) {
	let [minX, minY, maxX, maxY] = cords
	let [Nlng, Nlat] = ol.proj.toLonLat([maxX, maxY])
	let [Slng, Slat] = ol.proj.toLonLat([minX, minY])

	let data, result
	if (map.getView().getZoom() <= 4) {
		try {
			result = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];node["place"="country"](${Slat},${Slng},${Nlat},${Nlng});out body 10;`)
			data = await result.json()
		} catch {}
	} else {
		try {
			result = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];node["place"="city"](${Slat},${Slng},${Nlat},${Nlng});out body 10;`)
			data = await result.json()
		} catch {}
	}
	return data
}
// add tile layer based on mode
function applyLayer() {
	if (mode === "dark") {
		darkLayer.setVisible(true)
		lightLayer.setVisible(false)
		lastLayer = darkLayer
	} else {
		lightLayer.setVisible(true)
		darkLayer.setVisible(false)
		lastLayer = lightLayer
	}
}
// wide View
document.querySelector(".wide-view").onclick = _ => map.getView().animate({zoom: 0, center: [0, 0], duration: 1000})
// layer switcher
let layerSwitcher = document.querySelector(".layerSwitcher")
layerSwitcher.addEventListener("click", _ => {
	if (lastLayer === lightLayer || lastLayer === darkLayer) {
		lightLayer.setVisible(false)
		darkLayer.setVisible(false)
		ReaLayer.setVisible(true)
		lastLayer = ReaLayer
	} else {
		ReaLayer.setVisible(false)
		applyLayer()
	}
})
////////////////         large CITIES additionals infos         ///////////////
function displayCity(cityData, i) {
	let weatherType = document.querySelector(".tools .container .settings .wind").classList[1] ? "wind" : "normal"
	let box = document.querySelector(".cities").children[i]
	box.querySelector(".weatherImage").style.transform = "" // init from a rotation
	box.classList.remove(box.classList[1])
	box.querySelector(".country").innerHTML = cityData.location.country
	box.querySelector(".city-name").innerHTML = cityData.location.name
	box.querySelector(".condition").innerHTML = cityData.current.condition.text
	box.querySelector(".weatherImage").src = weatherType === "wind" ? windImage : filterImage(cityData.current.condition.code, cityData.current.is_day, mainWeatherConditions)
	box.querySelector(".temp .value").innerHTML = weatherType === "wind" ? Math.ceil(cityData.current.wind_kph) : Math.round(cityData.current.temp_c)
	box.querySelector(".temp .unit").innerHTML = weatherType === "wind" ? "Km/h" : "°C"
	if (weatherType === "wind") box.querySelector(".weatherImage").style.transform = `rotateZ(${cityData.current.wind_degree}deg)`
	box.classList.add(`${cityData.location.name.split(" ").join("-")}-${cityData.location.country.split(" ").join("-")}`)
	box.dataset.weather = [cityData.current.temp_c, cityData.current.condition.code, cityData.current.is_day]
	box.dataset.wind = [cityData.current.wind_degree, cityData.current.wind_kph]
}
let windImage = "/images/weather/simboles/arrow.png"
export async function displayRandCities() {
	chosedCities = []
	toggleCitiesLoader(true)
	toggleCitiesError(false)
	for (let i = 0; i < 3; i++) {
		let city = biggestCities[Math.floor(Math.random() * biggestCities.length)]
		while (chosedCities.includes(city)) {
			city = biggestCities[Math.floor(Math.random() * biggestCities.length)]
		}
		chosedCities.push(city)
		let cityData = await getSimpleDataByName(city)
		if (cityData) {
			displayCity(cityData, i)
		} else {
			toggleCitiesError(true)
		}
	}
	toggleCitiesLoader(false)
}
// change image while changing weather type ( wind / normal )
export async function updateCitiesWeather() {
	let weatherType = document.querySelector(".tools .container .settings .wind").classList[1] ? "wind" : "normal"
	for (let city of Array.from(document.querySelector(".cities").children).slice(0, 3)) {
		city.querySelector(".weatherImage").src = weatherType === "wind" ? windImage : filterImage(Number(city.dataset.weather.split(",")[1]), Number(city.dataset.weather.split(",")[2]), mainWeatherConditions)
		city.querySelector(".weatherImage").style.transform = weatherType === "wind" ? `rotateZ(${Number(city.dataset.wind.split(",")[0])}deg)` : ""
		city.querySelector(`.temp .value`).innerHTML = weatherType === "wind" ? Math.ceil(Number(city.dataset.wind.split(",")[1])) : Math.round(Number(city.dataset.weather.split(",")[0]))
		city.querySelector(`.temp .unit`).innerHTML = weatherType === "wind" ? "Km/h" : "°C"
	}
}
// update cities according to the mode
function UpdateCitiesImage() {
	if (!document.querySelector(".tools .container .settings .wind").classList[1]) {
		Array.from(document.querySelector(".cities").children)
			.slice(0, 3)
			.forEach(city => {
				if (city.dataset.weather) city.querySelector(`.weatherImage`).src = filterImage(Number(city.dataset.weather.split(",")[1]), Number(city.dataset.weather.split(",")[2]), mainWeatherConditions)
			})
	}
}
// search according to box content (on click)
let citiesBoxes = document.querySelectorAll(".cities .box")
citiesBoxes.forEach(box => {
	box.addEventListener("mousedown", async _ => {
		bigUpdate(box.classList[1])
		displayRandCities()
	})
})

// sliding on drag
let slider = document.querySelector(".cities")
let drag = false
let startY, scrollTop
slider.addEventListener("mousedown", e => {
	drag = true
	e.preventDefault()
	startY = e.offsetY - slider.offsetTop
	scrollTop = slider.scrollTop
})
window.addEventListener("mouseup", e => {
	drag = false
})
slider.addEventListener("mouseleave", e => {
	drag = false
})
slider.addEventListener("mousemove", e => {
	if (!drag) return
	e.preventDefault()
	let walk = e.offsetY - slider.offsetTop - startY
	slider.scrollTop = scrollTop - walk
})
