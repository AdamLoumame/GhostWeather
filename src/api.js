import {hideError, hideLoader, showError, showLoader} from "./utilities.js"
export async function getData(place) {
	try {
		showLoader()
		// get first data to fetch second one based on the first results ( place ) to match precisely the second data fetch ( same place )
		const mainResult = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=0bb3890e2cdc4fbabd5164832240711&q=${place}&days=7&aqi=yes`)
		if (mainResult.ok) {
			let mainData = await mainResult.json()
			const forecastResult = await fetch(`https://api.weatherbit.io/v2.0/forecast/daily?lat=${mainData.location.lat}&lon=${mainData.location.lon}&key=b08d8395d0a446869f498216f8c965d6`)
			const hoursForecastResult = await fetch(`https://api.weatherbit.io/v2.0/forecast/hourly?lat=${mainData.location.lat}&lon=${mainData.location.lon}&key=b08d8395d0a446869f498216f8c965d6`)
			if (forecastResult.ok && hoursForecastResult.ok) {
				hideError()
				let forecastData = await forecastResult.json()
				let hourForecastData = await hoursForecastResult.json()
				document.querySelector("header .location .loc-name").innerHTML = `${mainData.location.name}, <span>${mainData.location.country}</span>`
				return [mainData, forecastData, hourForecastData]
			} else if  (forecastResult.status !==400 && hoursForecastResult.status !== 400){
				catchStatus(forecastResult)
			}else{
				catching()
			}
		} else if (mainResult.status !== 400){
			catchStatus(mainResult)
		}else{
			catching()
		}
	} catch {
		catching()
	}
}
// catching bad result function
function catchStatus(badResult) {
	// display the error to the DOM
	let i = 0
	badResult.status.toString().split("").forEach(letter => {
			document.querySelector(".error-404 .fours").children[i].innerHTML = letter
			i++
	})
	document.querySelector(".error-404 .container .message").innerHTML = "<span>Oops</span><span>...</span> <span>sorry</span> <span>page</span> <span>not</span> <span>found</span>"

	hideLoader()
	showError(mainResult.status)
}
let catching = ()=>{ hideLoader(), showError("Wrong Name") }
// simple data fetching
export async function getSimpleDataByName(name) {
	const result = await fetch(`https://api.weatherapi.com/v1/current.json?key=0bb3890e2cdc4fbabd5164832240711&q=${name}`).catch(er => null)
	if (result.ok) return await result.json()
}
export async function getSimpleDataByCords(lat, lon) {
	const result = await fetch(`https://api.weatherapi.com/v1/current.json?key=0bb3890e2cdc4fbabd5164832240711&q=${lat},${lon}&aqi=yes`).catch(er => null)
	if (result.ok) return await result.json()
}
