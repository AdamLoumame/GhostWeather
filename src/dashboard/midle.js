// switch between Air / today / tomorrow /Forecast
let options = document.querySelectorAll(".option")
options.forEach(option => {
	option.addEventListener("click", _ => {
		options.forEach(op => op.classList.remove("active"))
		option.classList.add("active")
		document.querySelector(".options").classList.remove("forecast", "air")
		document.querySelector(".options").classList.add(option.children[0].innerHTML.split(" ")[0].toLowerCase())

		if (option.children[0].innerHTML.split(" ")[0].toLowerCase() === "air") {
			document.querySelector(".main-air").style.display = "flex"
			document.querySelector(".dates").style.display = "none"
			document.querySelectorAll(".main").forEach(main => main.classList.remove("active"))
		} else {
			document.querySelector(".main-air").style.display = "none"
			document.querySelector(".dates").style.display = "flex"
			let lastActive = document.querySelector(".date.active").classList[1]
			document.querySelector(`.main.${lastActive}`).classList.add("active")
		}
	})
})
// activating main while clicking on its date ( today / tomorrow / forecast )
document.querySelectorAll(".date").forEach(date => {
	date.addEventListener("click", _ => {
		document.querySelectorAll(".date").forEach(date => date.classList.remove("active"))
		date.classList.add("active")

		document.querySelectorAll(".main").forEach(main => main.classList.remove("active"))
		let main = document.querySelector(`.main.${date.classList[1]}`)
		main.classList.add("active")
	})
})

// imports
import {getUserCords, datetoName, getBoxData, airColor, getTime, convert12form, filterImage, getMonth, hideLoader} from "../utilities.js"
import {mainWeatherConditions, aqiRanges, maxAirValues, forecastWeatherConditions, uvColor} from "../dicts.js"
import {updateUnit} from "../settings.js"
import {getData} from "../api.js" // main fetching function

// default
let defaultPlace = await getUserCords()
let [data, weekData, hoursData] = await getData(defaultPlace) // default data that will be showed first to the user

// getting the right image based on the mode (dark / light)
let imagePack = document.querySelector(".mode").classList[1] // dark or light
export function updateImagePack() {
	imagePack = document.querySelector(".mode").classList[1]
}
// Updating
export async function UpdateMidle(value = "") {
	if (value) [data, weekData, hoursData] = await getData(value) // new data !
	weatherType = document.querySelector(".tools .container .settings .wind").classList[1] ? "wind" : "normal"
	forecastType = document.querySelector(".forecast-type").classList[1]
	let lastActiveIndex = Array.from(document.querySelector(".midle .left-part .main.week").children).indexOf(document.querySelector(".day.active"))
	displayForecast() // displaying fetched data and creating new boxes
	addBoxInteractions() // making new boxes interactive
	makeActive(document.querySelectorAll(".day")[lastActiveIndex]) // activate the first box
	// air changes
	airData = data.current.air_quality // update data
	updateAir() // update the air values
	// today changes
	showDay(document.querySelector(".main.today"), data.current)
	// tommorow changes
	showDay(document.querySelector(".main.tomorrow"), data.forecast.forecastday[1].day, data.forecast.forecastday[1].hour[13])
	// graph of chances of rain
	showRainGraph()
	// changing to a new name city on the DOM
	document.querySelector("header .left-part .location .loc-name").innerHTML = `${data.location.name}, <span>${data.location.country}</span>`
	hideLoader()
}
let weatherType = document.querySelector(".tools .container .settings .wind").classList[1] ? "wind" : "normal" // normal or wind
let windImage = "images/weather/simboles/arrow.png"
////////////////         Today + Tommorow          ///////////////
function showDay(box, data, data2 = data) {
	let isDay = data.is_day != undefined ? data.is_day : 1
	box.innerHTML = `
					<div class="day-bg">
						<img src="images/weather/simboles/sun.png" class="sun">
						<div class="wave"></div>
						<div class="wave1"></div>
						<div class="wave2"></div>
					</div>
					<div class="night-bg">
						<img src="images/weather/simboles/moon-2.png" alt="" class="moon">
					</div>
					<div class="left">
						<div class="main-value">${Math.round(data.temp_c ? data.temp_c : data.avgtemp_c)} °C</div>
						<div class="infos">
							<div class="box humidity">
								<img src="images/weather/simboles/wind-2.png" alt="" class="icon">
								<span class="value">${Math.round(data.humidity ? data.humidity : data.avghumidity)} %</span>
								<span class="text">Humidity</span>
							</div>
							<div class="box vis">
								<img src="${data.is_day === undefined ? "images/weather/simboles/vis2.png" : "images/weather/simboles/vis.png"}" alt="" class="icon">
								<span class="value">${Math.round(data.vis_km ? data.vis_km : data.avgvis_km)} Km/h</span>
								<span class="text">Visibility</span>
							</div>
							<div class="box uv">
								<img src="images/weather/simboles/uv.png" alt="" class="icon">
								<span class="value">${Math.round(data.uv)}</span>
								<span class="text">Ultraviolet</span>
							</div>
							<div class="box wind">
								<img src="images/weather/simboles/wind.png" alt="" class="icon">
								<span class="value">${Math.round(data.wind_kph ? data.wind_kph : data.maxwind_kph)} Km/h</span>
								<span class="text">Wind Speed</span>
							</div>
						</div>
					</div>
					<div class="more">
						<div class="Date">${data.wind_kph ? "Current" : `${data2.time.slice(8, 10)} ${getMonth(data2.time.slice(5, 7))} ${data2.time.slice(0, 4)}`}</div>
						<div class="details">
							<div class="sec">
								<div class="gust_Kph">gust_Kph : <span class="value">${Math.round(data2.gust_kph)} Km/h</span></div>
								<div class="gust_mph">gust_mph : <span class="value">${Math.round(data2.gust_mph)} mph</span></div>
								<div class="pressure_mb">pressure_mb : <span class="value">${Math.round(data2.pressure_mb)} MB</span></div>
								<div class="pressure_in">pressure_in : <span class="value">${Math.round(data2.pressure_in)} in</span></div>
								<div class="dewpoint">dewpoint : <span class="value temp">${Math.round(data2.dewpoint_c)} °C</span></div>
							</div>
							<div class="sec">
								<div class="heatindex">heatindex : <span class="value temp">${Math.round(data2.heatindex_c)} °C</span></div>
								<div class="feelslike">feelslike : <span class="value temp">${Math.round(data2.feelslike_c)} °C</span></div>
								<div class="windchill">windchill : <span class="value temp">${Math.round(data2.windchill_c)} °C</span></div>
								<div class="precip_in">precip_in : <span class="value">${Math.round(data2.precip_in)} in</span></div>
								<div class="precip_mm">precip_mm : <span class="value">${Math.round(data2.precip_mm)} mm</span></div>
							</div>
						</div>
					</div>
					<div class="right">
						<div class="image">
							<img src="${weatherType === "wind" ? windImage : filterImage(data.condition.code, isDay, mainWeatherConditions)}" alt="" class="weatherImage" data-condition="${data.condition.code}" data-isday="${isDay}"> 
							<span class="description">${weatherType === "wind" ? (data.wind_kph ? Math.ceil(data.wind_kph) + " Km/h" : Math.ceil(weekData.data[1].wind_spd * 3.6) + " Km/h") : data.condition.text}</span>
						</div>
					</div> `
	box.querySelector(".right .image .weatherImage").style.transform = weatherType === "wind" ? `rotateZ(${data.wind_degree ? data.wind_degree : weekData.data[1].wind_dir}deg)` : ""
	// day / night changes on today box
	if (data.is_day !== undefined) {
		box.classList.replace("n", "d")
		box.classList.add("d")
		box.style.backgroundColor = data.is_day ? "#FFD966" : ""
		box.children[0].style.display = data.is_day ? "block" : "none"
		box.children[1].style.display = data.is_day ? "none" : "block"
	}
	if (data.is_day == 0) {
		box.classList.replace("d", "n")
		box.classList.add("n")
	}

	// creating and placing stars randomly
	for (let i = 0; i < 3; i++) {
		let star = document.createElement("img")
		star.src = "images/weather/simboles/star.png"
		star.classList.add("star")
		document.querySelector(".night-bg").appendChild(star)
	}
	document.querySelectorAll(".star").forEach(star => {
		Object.assign(star.style, {width: `${Math.round(Math.random() * 2)}rem`, top: `${Math.random() * 80}%`, left: `${Math.random() * 80}%`, rotate: `${Math.random() * 45}deg`})
	})
}
// update day image according to the mode
export function UpdateBoxImage(box) {
	let boxImage = box.querySelector(".right .image .weatherImage")
	boxImage.src = filterImage(Number(boxImage.dataset.condition), Number(boxImage.dataset.isday), mainWeatherConditions)
}
// default today / tommorow
showDay(document.querySelector(".main.today"), data.current)
showDay(document.querySelector(".main.tomorrow"), data.forecast.forecastday[1].day, data.forecast.forecastday[1].hour[13])
////////////////          forecast ( days / hours )          ///////////////
let forecastType = document.querySelector(".forecast-type").classList[1]
function gettingForecastData() {
	let forecastData
	if (forecastType === "days") {
		return (forecastData = weekData.data.slice(1, 8))
	} else {
		return hoursData.data.slice(0, 7)
	}
}
function displayForecast() {
	document.querySelector(".midle .left-part .main.week").innerHTML = "" // clean the week box to add new data boxes

	// getting right loop over forecast data ( days or hours )
	let forecastData = gettingForecastData()

	// placing the first boxes according to the data first is the current day
	forecastData.forEach(elementData => {
		// getting right label
		let label, shortLabel, is_day
		if (forecastType === "hours") {
			let time = Number(elementData.timestamp_local.slice(11, 13))
			label = convert12form(time)
			shortLabel = label
			is_day = elementData.pod === "d" ? 1 : 0
		} else {
			label = datetoName(elementData.datetime.slice(0, 10))
			shortLabel = label.slice(0, 3)
			is_day = 1
		}

		const boxDay = document.createElement("div")
		boxDay.innerHTML = `
        <span class="abr">${shortLabel}</span>
        <img src="${weatherType === "wind" ? windImage : filterImage(elementData.weather.code, is_day, forecastWeatherConditions)}" alt="" class="weather-img" />
        <div class="temp"><span class="value">${weatherType === "wind" ? Math.ceil(elementData.wind_spd * 3.6) : Math.round(elementData.temp)}</span><span class="unit">${weatherType === "wind" ? " Km/h" : " °C"}</span></div>
        `
		if (weatherType === "wind") boxDay.querySelector(".weather-img").style.transform = `translate(-50%, -40%) rotate(${elementData.wind_dir}deg)`
		boxDay.classList.add("day", label, shortLabel)
		document.querySelector(".midle .left-part .main.week").appendChild(boxDay)
	})
}
displayForecast() // display the default data

// add events to the days so can be activate or unactivate (as a function so new created days can also be manupilated)
function addBoxInteractions() {
	let boxes = document.querySelectorAll(".midle .left-part .main.week .day")
	boxes.forEach(box => {
		box.addEventListener("click", _ => {
			resetBoxes()
			makeActive(box)
			updateUnit()
		})
	})
}
addBoxInteractions() // making default boxes interactive

// making active function
function makeActive(box) {
	box.classList.add("active")
	// getting right forecast data type to get this box's data from
	let rightInfo1, rightInfo2, rightInfo1Name, rightInfo2Name, is_day
	let forecastData = gettingForecastData()

	let data = getBoxData(box, forecastData)

	// getting if we display sun(rise/set) or could high low
	if (forecastType === "days") {
		rightInfo1Name = "Sunrise"
		rightInfo1 = getTime(data.sunrise_ts, weekData.timezone)
		rightInfo2Name = "Sunset"
		rightInfo2 = getTime(data.sunset_ts, weekData.timezone)
		is_day = 1
	} else {
		rightInfo1Name = "Clouds High"
		rightInfo1 = data.clouds_hi + "%"
		rightInfo2Name = "Clouds Low"
		rightInfo2 = data.clouds_low + "%"
		is_day = data.pod === "d" ? 1 : 0
	}

	box.innerHTML = `
        <div class="top">
            <h3 class="name">${box.classList[1]}</h3>
            <span class="month">${getMonth(data.datetime.slice(5, 7))} ${data.datetime.slice(8, 10)}</span>
        </div>
        <div class="bottom">
            <div class="left">
                <div class="temp"><span class="value">${Math.round(data.temp)}°</span><span class="unit">C</span></div>
                <div class="info">
                    <p>Real Feel<span class="number"> : ${Math.round(data.app_max_temp ? (data.app_max_temp + data.min_temp) / 2 : data.app_temp)}°C</span></p>
                    <p>Wind<span class="number"> : ${Math.ceil(data.wind_spd * 3.6)} Km/h</span></p>
                    <p>Pressure<span class="number"> : ${Math.round(data.slp)}MB</span></p>
                    <p>Humidity<span class="number"> : ${Math.round(data.rh)}%</span></p></div>
                </div>
            <div class="right">
                <img src="${weatherType === "wind" ? windImage : filterImage(data.weather.code, is_day, forecastWeatherConditions)}" alt="" class="weather-img"/>
                <div class="info">
                    <p>${rightInfo1Name}<span class="number"> : ${rightInfo1}</span></p>
                    <p>${rightInfo2Name}<span class="number"> : ${rightInfo2}</span></p>
                </div>
            </div>
        </div>
    `
	if (weatherType === "wind") {
		box.querySelector(".weather-img").style.transform = `translate(-50%, -40%) rotateZ(${data.wind_dir}deg)`
	}
}
makeActive(document.querySelectorAll(".day")[0]) // default active

// reset Boxes function ( so the active will be unactive )
function resetBoxes() {
	let boxes = document.querySelectorAll(".midle .left-part .main.week .day")
	boxes.forEach(box => {
		box.classList.remove("active")
		// getting right box data
		let forecastData
		let is_day = 1
		if (forecastType === "days") {
			forecastData = weekData.data.slice(1, 8)
		} else {
			forecastData = hoursData.data.slice(0, 7)
		}
		let finalData = getBoxData(box, forecastData)
		if (finalData.pod === "n" && forecastType === "hours") is_day = 0

		box.innerHTML = `
            <span class="abr">${box.classList[2] ? box.classList[2] : box.classList[1]}</span>
            <img src="${weatherType === "wind" ? windImage : filterImage(finalData.weather.code, is_day, forecastWeatherConditions)}" alt="" class="weather-img" />
            <div class="temp"><span class="value">${weatherType === "wind" ? Math.ceil(finalData.wind_spd * 3.6) : Math.round(finalData.temp)}</span><span class="unit">${weatherType === "wind" ? " Km/h" : " °C"}</span></div>
        `
		if (weatherType === "wind") box.querySelector(".weather-img").style.transform = `translate(-50%, -40%) rotate(${finalData.wind_dir}deg)`
	})
}

export {makeActive, resetBoxes} // exporting updating week functions so to maintain dynamic changes

////////////////          AIR          ///////////////
let chartsArr = []
let airData = data.current.air_quality
function displayAir() {
	// weather info
	let chartInfo = document.querySelectorAll(".main-air .infos .col .box .info")
	chartInfo.forEach(canvas => {
		let type = canvas.classList[1]
		let data = airData[type.toLowerCase()] // the data to display on DOM

		// add the number value
		canvas.parentElement.parentElement.children[0].innerHTML = Math.round(data)
		let percentage = (data / maxAirValues[type]) * 100
		// show data in form of a chart ( for the infos )
		let semiDoughnut = new Chart(canvas, {
			type: "doughnut",
			data: {
				datasets: [
					{
						data: [percentage, 100 - percentage],
						backgroundColor: [airColor((data / maxAirValues[type]) * 100)[0], airColor((data / maxAirValues[type]) * 100)[1]],
						borderWidth: 0
					}
				]
			},
			options: {
				layout: {
					padding: {bottom: 5}
				},
				rotation: -90,
				circumference: 180,
				cutout: "80%",
				animation: false,
				tooltip: {enabled: false},
				plugins: {
					legend: {display: false}
				}
			}
		})
		chartsArr.push(semiDoughnut)
	})
	// weather aqi index
	let aqi_range = aqiRanges.find(aqi => airData["gb-defra-index"] >= aqi.threshold)
	document.querySelector(".aqi-image").src = aqi_range.info[0]
	document.querySelector(".main-air .aqi .aqi-index .infos .number").innerHTML = airData["gb-defra-index"]
	document.querySelector(".main-air .aqi .aqi-index .infos .description").innerHTML = aqi_range.info[1]
	// uv forecast
	let uvData = gettingForecastData()
	uvForecast(uvData)
}
displayAir() // default display of air

// update function after search
function updateAir() {
	// air info
	chartsArr.forEach(chart => {
		let type = chart.canvas.classList[1]
		let data = airData[type.toLowerCase()]
		chart.canvas.parentElement.parentElement.children[0].innerHTML = Math.round(data)

		let percentage = (data / maxAirValues[type]) * 100
		chart.config._config.data.datasets[0].data = [percentage, 100 - percentage]
		chart.config._config.data.datasets[0].backgroundColor = [airColor((data / maxAirValues[type]) * 100)[0], airColor((data / maxAirValues[type]) * 100)[1]]
		chart.update()
	})
	// weather aqi index
	let aqi_range = aqiRanges.find(aqi => airData["gb-defra-index"] >= aqi.threshold)
	document.querySelector(".aqi-image").src = aqi_range.info[0]
	document.querySelector(".main-air .aqi .aqi-index .infos .number").innerHTML = airData["gb-defra-index"]
	document.querySelector(".main-air .aqi .aqi-index .infos .description").innerHTML = aqi_range.info[1]
	// uv forecast
	let uvData = gettingForecastData()
	uvForecast(uvData)
}
function uvForecast(uvData) {
	let i = 0
	uvData.forEach(elementData => {
		if (i < 3) {
			let uvValue = Math.round(elementData.uv)
			let progress = document.querySelectorAll(".main-air .UV-forecast .box")[i].children[0].children[0]
			progress.style.width = `${(uvValue / 13) * 100}%`
			let uvRange = uvColor.find(range => uvValue <= range.threshold)
			progress.style.backgroundColor = uvRange.colors[0]
			progress.parentElement.style.backgroundColor = uvRange.colors[1]
			progress.parentElement.parentElement.children[1].children[0].innerHTML = uvValue
			if (forecastType === "days") {
				progress.parentElement.parentElement.children[1].children[1].innerHTML = ` ${getMonth(elementData.datetime.slice(5, 7))} ${elementData.datetime.slice(8, 10)}`
			} else {
				progress.parentElement.parentElement.children[1].children[1].innerHTML = ` ${convert12form(Number(elementData.timestamp_local.slice(11, 13)))}`
			}
			i++
		}
	})
}
////////////////          Chances of Rain          ///////////////
export function showRainGraph() {
	document.querySelector(".midle .right-part .Chance-of-rain .Xaxis").innerHTML = ""
	// getting right data
	let forecastData = gettingForecastData()

	forecastData.forEach(elementData => {
		let chanceOfRain = (elementData.pop / 86) * 100
		let axe = document.createElement("div")
		axe.classList.add("axe")

		let date, is_day
		if (forecastType === "hours") {
			let time = Number(elementData.timestamp_local.slice(11, 13))
			date = convert12form(time)
			is_day = elementData.pod === "d" ? 1 : 0
		} else {
			date = datetoName(elementData.datetime.slice(0, 11)).slice(0, 3)
			is_day = 1
		}

		if (chanceOfRain > 0) {
			// chance of precip
			axe.innerHTML = `<div class="progress"></div><span>${date}</span>`
			axe.children[0].style.height = `${chanceOfRain}%`
		} else {
			// no precip ( showing that its rainy but other weather condition )
			axe.innerHTML = `<img src="${filterImage(elementData.weather.code, is_day, forecastWeatherConditions)}"><span>${date}</span>`
		}
		document.querySelector(".midle .right-part .Chance-of-rain .Xaxis").appendChild(axe)
	})
}
showRainGraph()
hideLoader()
