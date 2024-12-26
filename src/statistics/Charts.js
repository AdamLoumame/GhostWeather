// weather options changing by clicking
let weatherOptions = document.querySelectorAll(".main-chart .weather-type-options span")
weatherOptions.forEach(choice => {
	choice.addEventListener("click", _ => {
		weatherOptions.forEach(choice => choice.classList.remove("active"))
		choice.classList.add("active")
		choice.parentElement.classList.replace(choice.parentElement.classList[1], choice.classList[0])
		DisplayCharts()
	})
})
// forecast types changing by clicking
let forecastOptions = document.querySelectorAll(".main-chart .forecast-options span")
forecastOptions.forEach(option => {
	option.addEventListener("click", _ => {
		forecastOptions.forEach(option => option.classList.remove("active"))
		option.classList.add("active")
		option.parentElement.classList.replace(option.parentElement.classList[1], option.classList[0])
		DisplayCharts()
	})
})

import {getData} from "src/api.js"
import {forecastWeatherConditions, uvColor} from "src/dicts.js"
import {getUserCords, convert12form, getMonth, datetoName, toF, getFillColor, filterImage, getTime, updateTimelineImages, bottomTooltip, Xcrosshair, hideLoader} from "src/utilities.js"

// default data
let defaultPlace = await getUserCords()
let [data, weekData, hourData] = await getData(defaultPlace)

let lastChart, lastUvChart, lastCloudsChart, lastHumChart

export async function DisplayCharts(place) {
	if (place) [data, weekData, hourData] = await getData(place)
	mode = document.querySelector(".mode").classList[1]
	weatherType = document.querySelector(".main-chart .weather-type-options").classList[1]
	forecastType = document.querySelector(".main-chart .forecast-options").classList[1]
	forecastData = forecastType === "days" ? weekData.data : hourData.data.filter(el => (Number(el.timestamp_local.slice(11, 13)) - (Number(hourData.data[0].timestamp_local.slice(11, 13)) % 3)) % 3 === 0)
	proMode = document.querySelector(".view-mode").classList.contains("active") && weatherType !== "precip"
	// updates
	displayMainChart()
	displayUvChart()
	setDayTimeline()
	atmOverview()
	hideLoader()
}
let mode = document.querySelector(".mode").classList[1]
let weatherType = document.querySelector(".main-chart .weather-type-options").classList[1]
let forecastType = document.querySelector(".main-chart .forecast-options").classList[1]
let forecastData = forecastType === "days" ? weekData.data : hourData.data.filter(el => (Number(el.timestamp_local.slice(11, 13)) - (Number(hourData.data[0].timestamp_local.slice(11, 13)) % 3)) % 3 === 0)
let proMode = document.querySelector(".view-mode").classList.contains("active") && weatherType !== "precip"

// needed utils
let tempUnit = document.querySelector(".temp-unit").classList[1]
export let updateTempUnit = async _ => (tempUnit = document.querySelector(".temp-unit").classList[1])
let date = (data, index) => `<span class="date">${forecastType === "days" ? (index === 0 ? "Today" : datetoName(data[index].datetime).slice(0, 3)) : convert12form(Number(data[index].timestamp_local.slice(11, 13)), true)}</span>`
let states = {hover: {filter: {type: "none"}}, active: {filter: {type: "none"}}}

export function displayMainChart() {
	// reset last chart + info labels + empty chart label + day indecator
	if (lastChart) lastChart.destroy()
	document.querySelector(".main-chart .container .info-labels").innerHTML = ""
	document.querySelector(".main-chart .container .empty-chart-label").style.display = "none"
	document.querySelectorAll(".main-chart .container .day").forEach(day => day.parentElement.removeChild(day))

	let valueName = weatherType === "temp" ? "temp" : weatherType === "wind" ? "wind_spd" : "pop"

	// getting the right scales and look of the curve
	let maximum = forecastData.reduce((acc, curr) => (curr[valueName] >= acc[valueName] ? curr : acc))[valueName]
	let minimum = forecastData.reduce((acc, curr) => (curr[valueName] <= acc[valueName] ? curr : acc))[valueName]
	let monotonicChart = maximum * minimum > 0 || maximum > 3 * Math.abs(minimum) || maximum * 3 < Math.abs(minimum)
	if (weatherType === "wind") [minimum, maximum] = [minimum * 3.6, maximum * 3.6]
	let tickAmount = 4
	let step = minimum > 0 ? maximum / tickAmount : maximum < 0 ? Math.abs(minimum) / tickAmount : Math.abs((maximum - minimum) / tickAmount)
	let min, max
	if (monotonicChart) {
		;[min, max] = Math.abs(minimum) > maximum ? [minimum - 2 * step, 0] : [0, maximum + 2 * step]
	} else {
		;[min, max] = [minimum - 2 * step, maximum + 2 * step]
	}

	let windImage = "/images/weather/simboles/arrow.png"
	let chartColor = getFillColor(weatherType, (maximum + minimum) / 2)
	let options = {
		series: [{data: forecastData.map((el, i) => (valueName === "wind_spd" ? el[valueName] * 3.6 : el[valueName]))}],
		chart: {
			type: "area",
			height: "100%",
			animations: {enabled: false},
			sparkline: {enabled: true}
		},
		markers: {hover: {size: proMode ? 8 : 0}, colors: [chartColor], strokeColors: mode === "dark" ? "#121212" : "#ffffff", strokeWidth: 4},
		tooltip: {
			custom: function ({series, dataPointIndex}) {
				return `<div class="main-chart-tooltip">
							${proMode ? `<img src=${weatherType === "temp" ? filterImage(forecastData[dataPointIndex].weather.code, forecastData[dataPointIndex].pod === "n" && forecastType === "hours" ? 0 : 1, forecastWeatherConditions) : windImage} style="transform:rotateZ(${weatherType === "wind" ? forecastData[dataPointIndex].wind_dir : ""}deg);">` : `<span class="date">${options.xaxis.categories[dataPointIndex]}</span>`}		
							<div class="infos">
								<span class="curve-color" style="background-color:${chartColor};"></span>
								<span>${weatherType} : </span>
								<span>${weatherType === "temp" && tempUnit === "F" ? toF(series[0][dataPointIndex]) : Math.round(series[0][dataPointIndex])} ${weatherType === "temp" ? "°" + tempUnit : weatherType === "wind" ? "Km/h" : "%"}</span>
							</div>		
						</div>`
			},
			followCursor: !proMode
		},
		xaxis: {
			crosshairs: Xcrosshair(mode, proMode),
			categories: forecastType === "days" ? forecastData.map(el => `${getMonth(el.datetime.slice(5, 7))} ${parseInt(el.datetime.slice(8, 10))}`) : forecastData.map(el => `${datetoName(el.timestamp_local.slice(0, 10)).slice(0, 3)} at ${convert12form(Number(el.timestamp_local.slice(11, 13)), true)}`)
		},
		yaxis: {min: min, max: max, tickAmount: tickAmount},
		fill: {
			type: "gradient",
			colors: [chartColor],
			gradient: {
				type: "vertical",
				opacityFrom: 0.5,
				opacityTo: 0
			}
		}
	}
	let emptyChart = options.series[0].data.every(value => value === 0)
	let chart = new ApexCharts(document.querySelector(".main-chart #chart"), options)
	chart.render()
	lastChart = chart // to deleat on creation of new one

	// placing infos ( chart essentials )
	if (proMode && !emptyChart) {
		options.xaxis.categories.forEach((el, index) => {
			if (index === 0 || index === options.xaxis.categories.length - 1) return // reject first and last el
			// dipaying labels and lines
			let label = document.createElement("div")
			label.innerHTML = forecastType === "days" ? datetoName(forecastData[index].datetime.slice(0, 11)).slice(0, 3) : el.split(" ").slice(-2).join(" ")
			document.querySelector(".main-chart .container .info-labels").appendChild(label)
		})
	} else {
		options.xaxis.categories.forEach((el, index) => {
			if (index === 0 || index === options.xaxis.categories.length - 1) return // reject first and last el
			let value = options.series[0].data[index]
			let top = value >= 0 ? max - step / 3 - value : min + step / 3 - value
			let topINpx = (top * chart.w.globals.svgHeight) / Math.abs(max - min) // converting to px
			if (monotonicChart && weatherType !== "precip" && value * (Math.abs(minimum) > maximum ? minimum : maximum) > 0) {
				// adding indecator line
				chart.addXaxisAnnotation({
					x: index + 1,
					borderColor: mode === "dark" ? "#f5f5f5" : "#1c1c1c",
					strokeDashArray: 0,
					strokeWidth: 2,
					offsetY: topINpx
				})
			}
			// adding Indecator image
			if (weatherType !== "precip") {
				let image = document.createElement("img")
				image.src = weatherType === "temp" ? filterImage(forecastData[index].weather.code, forecastData[index].pod === "n" && forecastType === "hours" ? 0 : 1, forecastWeatherConditions) : windImage
				image.style.top = (value < 0 ? chart.w.globals.svgHeight + topINpx + 5 : topINpx - 35) + "px"
				if (monotonicChart) image.style.top = (value >= 0 && max === 0 ? 5 : value <= 0 && min === 0 ? chart.w.globals.svgHeight - 40 : parseInt(image.style.top)) + "px"
				if (weatherType === "wind") image.style.transform = `rotateZ(${forecastData[index].wind_dir}deg)`
				document.querySelector(".main-chart .container .info-labels").appendChild(image)
			}
		})
	}

	// placing days idecators on hourschart to mention start and end of a day
	if (forecastType === "hours" && !emptyChart) {
		options.xaxis.categories.forEach((el, index) => {
			if (index === 0 || index === options.xaxis.categories.length - 1) return // reject first and last el
			if (forecastData[index - 1].timestamp_local.slice(8, 10) !== forecastData[index].timestamp_local.slice(8, 10)) {
				let day = document.createElement("div")
				day.classList.add("day")
				day.style.left = (index / 16 - (Number(el.split(" ")[2]) % 3) / 49) * 100 + "%"
				if (max === 0) day.style.textAlign = "right"
				day.innerHTML = `<h3>${datetoName(forecastData[index].timestamp_local.slice(0, 10))}</h3>`
				document.querySelector(".main-chart .container").prepend(day)
			}
		})
	}

	// Chart Empty Message
	if (emptyChart) {
		document.querySelector(".main-chart .container .empty-chart-label").innerHTML = `No ${weatherType} expected for the commming ${forecastType} !`
		Object.assign(document.querySelector(".main-chart .container .empty-chart-label").style, {display: "block", color: getFillColor(weatherType)})
	}
}

function displayUvChart() {
	// reset
	if (lastUvChart) lastUvChart.destroy()
	document.querySelector(".bar-chart .container .labels").innerHTML = ""
	document.querySelector(".empty-uv-chart-label").innerHTML = ""
	document.querySelectorAll(".stats-bottom .bar-chart .container .day").forEach(day => day.parentElement.removeChild(day))

	let options = {
		series: [{data: forecastData.map(el => ({y: el.uv, x: forecastType === "days" ? datetoName(el.datetime).slice(0, 3) : `${datetoName(el.timestamp_local.slice(0, 10)).slice(0, 3)} at ${convert12form(Number(el.timestamp_local.slice(11, 13)), true)}`, goals: [{value: el.uv, strokeColor: mode === "dark" ? "#f5f5f5" : "#1c1c1c", strokeHeight: 1}]}))}],
		chart: {
			type: "bar",
			height: proMode ? "85%" : "100%",
			animations: {enabled: false},
			sparkline: {enabled: true}
		},
		plotOptions: {
			bar: {
				colors: {
					ranges: uvColor.map((range, i) => {
						return {
							from: i === 0 ? 0 : uvColor[i - 1].threshold + 1,
							to: range.threshold,
							color: range.colors[0]
						}
					})
				},
				columnWidth: "98%"
			}
		},
		fill: {
			type: "gradient",
			gradient: {
				type: "vertical",
				shade: "light",
				shadeIntensity: 0,
				opacityFrom: mode === "dark" ? 0.6 : 1,
				opacityTo: mode === "dark" ? 0 : 0.2,
				stops: [0, 90, 100]
			}
		},
		tooltip: {custom: ({series, dataPointIndex}) => bottomTooltip(!proMode ? date(forecastData, dataPointIndex) : "", series[0][dataPointIndex], !proMode && 1), followCursor: !proMode},
		states: states,
		xaxis: {crosshairs: {show: false}, labels: {style: {colors: mode === "dark" ? "#b3b3b3" : "#5e5e5e"}}},
		yaxis: {min: 0, max: Math.ceil(forecastData.reduce((acc, curr) => (curr.uv >= acc.uv ? curr : acc)).uv) + 2, labels: {show: false}},
		grid: {borderColor: "#323234", strokeDashArray: 10, padding: {right: proMode && 16, left: proMode && 16}}
	}

	let UvChart = new ApexCharts(document.querySelector(".stats-bottom .bar-chart #uv-chart"), options)
	lastUvChart = UvChart
	UvChart.render()
	let emptyChart = options.series[0].data.every(value => value.y === 0)

	// add indecators
	if (proMode) {
		options.series[0].data.forEach((el, i) => {
			// adding x labels
			let label = document.createElement("span")
			label.innerHTML = forecastType === "days" ? el.x : convert12form(Number(forecastData[i].timestamp_local.slice(11, 13)), true)
			document.querySelector(".bar-chart .container .labels").append(label)
		})
	}
	if (forecastType === "hours" && !emptyChart) {
		options.series[0].data.forEach((el, i) => {
			if (i === 0 || i === options.series[0].data.length - 1) return // reject first and last el

			if (forecastData[i].timestamp_local.slice(8, 10) !== forecastData[i - 1].timestamp_local.slice(8, 10)) {
				let day = document.createElement("div")
				day.classList.add("day")
				if (proMode) Object.assign(day.style, {height: "68%", fontSize: "0.68rem"})
				day.style.left = proMode ? i * 5.7 + 1.5 + "%" : i * 6 - 1 + "%"
				day.innerHTML = `<h3>${datetoName(forecastData[i].timestamp_local.slice(0, 10))}</h3>`
				document.querySelector(".stats-bottom .bar-chart .container").prepend(day)
			}
		})
	}
	// empty chart handling
	if (emptyChart) document.querySelector(".empty-uv-chart-label").innerHTML = `No UV expected for the next ${forecastType}`
}

// Atmospheric Overview
function atmOverview() {
	// reset
	if (lastCloudsChart) lastCloudsChart.destroy()
	if (lastHumChart) lastHumChart.destroy()
	document.querySelector(".clouds-error").innerHTML = ""
	document.querySelector(".stats-bottom .atmospheric-overview .humidity .labels").innerHTML = ""

	let AtmData = forecastType === "days" ? weekData.data.slice(0, 7) : hourData.data.slice(0, 7)
	// clouds
	let cloudsOptions = {
		series: AtmData.map(el => el.clouds),
		chart: {
			type: "polarArea",
			height: "85%",
			animations: {enabled: false},
			sparkline: {enabled: true},
			width: "100%"
		},
		stroke: {width: 0},
		plotOptions: {polarArea: {rings: {strokeWidth: 0}, spokes: {strokeWidth: 0}}},
		tooltip: {custom: ({series, seriesIndex}) => bottomTooltip(date(AtmData, seriesIndex), series[seriesIndex] + " %", 1)},
		states: states,
		colors: AtmData.map(el => (mode === "dark" ? `rgba(245, 245, 245, ${el.rh * 0.01})` : `rgba(50,50,50,${el.rh * 0.01}`))
	}
	let cloudsChart = new ApexCharts(document.querySelector("#cloudsChart"), cloudsOptions)
	cloudsChart.render()
	lastCloudsChart = cloudsChart
	let emptyCloudsChart = cloudsOptions.series.every(value => value === 0)
	if (emptyCloudsChart) document.querySelector(".clouds-error").innerHTML = `No clouds expected for the comming ${forecastType}`

	// humidity
	let humOptions = {
		series: [{data: AtmData.map(el => el.rh)}],
		chart: {
			type: proMode ? "line" : "bar",
			height: "80%",
			animations: {enabled: false},
			sparkline: {enabled: true}
		},
		tooltip: {custom: ({series, dataPointIndex}) => bottomTooltip(!proMode ? date(AtmData, dataPointIndex) : "", series[0][dataPointIndex] + " %", !proMode && 1), followCursor: !proMode},
		plotOptions: {
			bar: {
				borderRadius: 9,
				borderRadiusApplication: "around",
				columnWidth: "85%"
			}
		},
		grid: {padding: {bottom: 15}},
		xaxis: {
			crosshairs: Xcrosshair(mode, proMode)
		},
		fill: {
			type: "gradient",
			gradient: {
				type: "vertical",
				shade: "light",
				shadeIntensity: 0,
				opacityFrom: mode === "dark" ? 0.6 : 1,
				opacityTo: mode === "dark" ? 0 : 0.2,
				stops: [0, 90, 100]
			}
		},
		states: states,
		markers: {colors: "#bbd7ec", strokeColors: mode === "dark" ? "#1c1c1c" : "#f5f5f5", strokeWidth: 4},
		colors: ["#bbd7ec"],
		stroke: {curve: "smooth"}
	}
	let humChart = new ApexCharts(document.querySelector("#humChart"), humOptions)
	lastHumChart = humChart
	humChart.render()

	if (proMode) {
		humOptions.series[0].data.forEach((_, i) => {
			if (i === 0 || i + 1 === humOptions.series[0].data.length) return
			let label = document.createElement("span")
			label.innerHTML = date(AtmData, i)
			document.querySelector(".stats-bottom .atmospheric-overview .humidity .labels").appendChild(label)
		})
	}
}

// day timeline
function setDayTimeline() {
	updateTimelineImages(mode)
	// reset
	document.querySelector(".day-timeline").classList.remove("error")
	document.querySelector(".day-timeline .timeline-error").style.display = "none"
	document.querySelector(".day-timeline .error-title").style.display = "none"

	let rise = data.current.is_day ? weekData.data[0].sunrise_ts : weekData.data[0].moonrise_ts
	let set = data.current.is_day ? weekData.data[0].sunset_ts : weekData.data[1].moonset_ts
	let currentTime = data.current.is_day ? data.location.localtime_epoch : data.location.localtime_epoch + (data.location.localtime_epoch < rise ? 86400 : 0)

	if (rise && currentTime && currentTime && currentTime >= rise && currentTime <= set) {
		let object
		if (data.current.is_day) {
			document.querySelector(".day-timeline").classList.replace("moon", "sun")
			document.querySelector(".day-timeline").classList.add("sun")
			object = document.querySelector(".day-timeline .box .graph .sun")
		} else {
			document.querySelector(".day-timeline").classList.replace("sun", "moon")
			document.querySelector(".day-timeline").classList.add("moon")
			object = document.querySelector(".day-timeline .box .graph .moon")
		}
		// setting labels
		document.querySelector(".day-timeline .box .info .rise .time").innerHTML = getTime(rise, weekData.timezone)
		document.querySelector(".day-timeline .box .info .set .time").innerHTML = getTime(set, weekData.timezone)

		// setting x
		let xcord = 15 + ((currentTime - rise) * 70) / (set - rise)
		object.style.left = xcord + "%"
		// setting y
		let verticalRadius = (parseFloat(window.getComputedStyle(document.querySelector(".day-timeline .box .graph .circle")).height) * 100) / (2 * parseFloat(window.getComputedStyle(document.querySelector(".day-timeline .box .graph")).height))
		object.style.bottom = Math.sqrt(Math.pow(verticalRadius, 2) - (Math.pow(verticalRadius, 2) * Math.pow(xcord - 50, 2)) / 1225) + "%"
		// hider configs
		let hider = document.querySelector(".day-timeline .box .graph .hider")
		hider.style.width = ((set - currentTime) * 70) / (set - rise) + "%"
		hider.children[0].style.width = (parseFloat(window.getComputedStyle(hider.parentElement).width) * 70) / parseFloat(window.getComputedStyle(hider).width) + "%"
	} else {
		document.querySelector(".day-timeline .timeline-error").style.display = "flex"
		document.querySelector(".day-timeline").classList.remove("sun", "moon")
		document.querySelector(".day-timeline").classList.add("error")
	}
}
DisplayCharts()
