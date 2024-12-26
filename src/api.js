import {hideError, hideLoader, showError, showLoader} from "src/utilities.js"
export async function getData(place) {
	try {
		showLoader()
		// get first data to fetch second one based on the first results ( place ) to match precisely the second data fetch ( same place )
		const mainResult = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=0bb3890e2cdc4fbabd5164832240711&q=${place}&days=7&aqi=yes`)
		if (mainResult.ok) {
			let mainData = await mainResult.json()
			const forecastResult = await fetch(`https://api.weatherbit.io/v2.0/forecast/daily?lat=${mainData.location.lat}&lon=${mainData.location.lon}&key=98c83fff4dc548a9aacfc99b6883dbca`)
			const hoursForecastResult = await fetch(`https://api.weatherbit.io/v2.0/forecast/hourly?lat=${mainData.location.lat}&lon=${mainData.location.lon}&key=98c83fff4dc548a9aacfc99b6883dbca`)
			if (forecastResult.ok && hoursForecastResult.ok) {
				hideError()
				let forecastData = await forecastResult.json()
				let hourForecastData = await hoursForecastResult.json()
				document.querySelector("header .location .loc-name").innerHTML = `${mainData.location.name}, <span>${mainData.location.country}</span>`
				return [mainData, forecastData, hourForecastData]
			} else {
				catchStatus(forecastResult)
			}
		} else {
			catchStatus(mainResult)
		}
	} catch {
		hideLoader()
		showError("Wrong Name")
	}
}
// catching bad result function
function catchStatus(badResult) {
	hideLoader()
	showError(mainResult.status)
	// display the error to the DOM
	let i = 0
	badResult.status
		.toString()
		.split("")
		.forEach(letter => {
			document.querySelector(".error-404 .fours").children[i].innerHTML = letter
			i++
		})
}

// simple data fetching
export async function getSimpleDataByName(name) {
	const result = await fetch(`https://api.weatherapi.com/v1/current.json?key=0bb3890e2cdc4fbabd5164832240711&q=${name}`).catch(er => null)
	if (result.ok) return await result.json()
}
export async function getSimpleDataByCords(lat, lon) {
	const result = await fetch(`https://api.weatherapi.com/v1/current.json?key=0bb3890e2cdc4fbabd5164832240711&q=${lat},${lon}&aqi=yes`).catch(er => null)
	if (result.ok) return await result.json()
}
