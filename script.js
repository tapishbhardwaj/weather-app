const apiKey = "3eb8f14a2f574568a04163704262503";
const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const errorMessage = document.getElementById("errorMessage");
const weatherResult = document.getElementById("weatherResult");
const suggestions = document.getElementById("suggestions");
let selectedCity = null;
let cities = [];
let currentIndex = -1;

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  themeToggle.textContent = body.classList.contains("dark")
    ? "Light mode"
    : "Dark mode";
});

searchBtn.addEventListener("click", getWeather);
locationBtn.addEventListener("click", getCurrentLocation);
document
  .getElementById("locationInput")
  .addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (currentIndex < cities.length - 1) {
        currentIndex++;
      }

      updateActiveSuggestion();

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (currentIndex > 0) {
        currentIndex--;
      }

      updateActiveSuggestion();

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (cities.length > 0) {
        const city = currentIndex >= 0 ? cities[currentIndex] : cities[0];
        selectedCity = city;
        locationInput.value = `${city.name}, ${city.admin1}, ${city.country}`;

        suggestions.innerHTML = "";
        suggestions.style.display = "none";

        getWeather(city.latitude, city.longitude);
      } else {
        getWeather();
      }
    }
  });
const locationInput = document.getElementById("locationInput");

locationInput.addEventListener("input", function () {
  selectedCity = null;
  const city = this.value.trim();

  if (city.length < 2) {
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
    return;
  }

  searchCity(city);
});

document.addEventListener("click", function (event) {
  if (
    !locationInput.contains(event.target) &&
    !suggestions.contains(event.target)
  ) {
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
  }
});

async function getWeather(lat = null, lon = null) {
  suggestions.innerHTML = "";
  suggestions.style.display = "none";

  const location = locationInput.value.trim();

  let query;

  if (lat !== null && lon !== null) {
    query = `${lat},${lon}`;
  } else {
    query = location;
  }
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=7&aqi=yes&alerts=no`;
  searchBtn.textContent = "Loading...";
  searchBtn.disabled = true;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.location) {
      console.log(data.current.air_quality);
      updateWeather(data);
      updateForecast(data.forecast.forecastday);
    } else {
      showError(data.error?.message || "Unable to fetch weather data.");
    }
  } catch (error) {
    showError("Error fetching weather data.");
    console.error(error);
  } finally {
    searchBtn.textContent = "Search";
    searchBtn.disabled = false;
  }
}

function updateWeather(data) {
  errorMessage.hidden = true;
  errorMessage.innerText = "";
  if (selectedCity) {
    document.getElementById("city").innerText =
      `${selectedCity.name}, ${selectedCity.country}`;
  } else {
    document.getElementById("city").innerText =
      `${data.location.name}, ${data.location.country}`;
  }

  document.getElementById("condition").innerText = data.current.condition.text;
  document.getElementById("localTime").innerText =
    `Local time: ${data.location.localtime}`;
  document.getElementById("temp").innerText =
    `${data.current.temp_c.toFixed(1)}°C`;
  document.getElementById("feelsLike").innerText =
    `${data.current.feelslike_c.toFixed(1)}°C`;
  document.getElementById("humidity").innerText = `${data.current.humidity}%`;
  document.getElementById("wind").innerText =
    `${data.current.wind_kph.toFixed(1)} kph`;
  document.getElementById("sunrise").innerText =
    data.forecast.forecastday[0].astro.sunrise;

  document.getElementById("sunset").innerText =
    data.forecast.forecastday[0].astro.sunset;
  document.getElementById("aqi").innerText = getAQI(
    data.current.air_quality["us-epa-index"],
  );

  document.getElementById("weatherIcon").src =
    `https:${data.current.condition.icon}`;
  document.getElementById("weatherIcon").alt = data.current.condition.text;
  weatherResult.hidden = false;

  document.getElementById("lastUpdated").innerText =
    `Last Updated: ${data.current.last_updated}`;
  changeBackground(data.current.condition.text);
}

function showError(message) {
  weatherResult.hidden = true;
  errorMessage.innerText = message;
  errorMessage.hidden = false;
}

function getAQI(index) {
  switch (index) {
    case 1:
      return "🟢 Good";

    case 2:
      return "🟡 Moderate";

    case 3:
      return "🟠 Unhealthy for Sensitive";

    case 4:
      return "🔴 Unhealthy";

    case 5:
      return "🟣 Very Unhealthy";

    case 6:
      return "⚫ Hazardous";

    default:
      return "--";
  }
}

function updateForecast(days) {
  const forecastContainer = document.getElementById("forecastContainer");

  forecastContainer.innerHTML = "";

  days.forEach((day) => {
    const forecastCard = document.createElement("div");

    forecastCard.classList.add("forecast-card");

    forecastCard.innerHTML = `
            <p>${new Date(day.date).toLocaleDateString("en-US", {
              weekday: "short",
            })}</p>

            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">

            <h3>${day.day.maxtemp_c}° / ${day.day.mintemp_c}°</h3>

            <small>${day.day.condition.text}</small>
        `;

    forecastContainer.appendChild(forecastCard);
  });
}

function changeBackground(condition) {
  condition = condition.toLowerCase();

  if (condition.includes("sunny") || condition.includes("clear")) {
    body.style.background = "linear-gradient(180deg,#87CEEB,#FFD54F)";
  } else if (condition.includes("cloud")) {
    body.style.background = "linear-gradient(180deg,#B0BEC5,#ECEFF1)";
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    body.style.background = "linear-gradient(180deg,#607D8B,#90A4AE)";
  } else if (condition.includes("snow")) {
    body.style.background = "linear-gradient(180deg,#E3F2FD,#FFFFFF)";
  } else {
    body.style.background = "linear-gradient(180deg,#eef7ff,#cfe5ff)";
  }
}

async function searchCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;

  try {
    const response = await fetch(url);

    const data = await response.json();

    cities = data.results || [];
    currentIndex = -1;
    suggestions.innerHTML = "";

    if (!cities.length) {
      suggestions.style.display = "none";

      return;
    }
    cities.forEach((city) => {
      const div = document.createElement("div");
      div.innerHTML = `
    <strong>${city.name}</strong>
    <small>${city.admin1}, ${city.country}</small>
`;
      div.classList.add("suggestion-item");

      div.addEventListener("click", function () {
        selectedCity = city;
        locationInput.value = `${city.name}, ${city.admin1}, ${city.country}`;
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        getWeather(city.latitude, city.longitude);
      });
      suggestions.appendChild(div);
      suggestions.style.display = "block";
    });
  } catch (error) {
    console.log(error);
  }
}
function updateActiveSuggestion() {
  const items = document.querySelectorAll(".suggestion-item");

  items.forEach((item) => {
    item.classList.remove("active");
  });

  if (currentIndex >= 0) {
    items[currentIndex].classList.add("active");
  }
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }
  locationBtn.textContent = "Getting Location...";
  locationBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(success, error);
}

function success(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  selectedCity = null;
  getWeather(latitude, longitude);
  locationBtn.textContent = "📍 Current Location";
  locationBtn.disabled = false;
}

function error() {
  alert("Unable to get your location.");
  locationBtn.textContent = "📍 Current Location";
  locationBtn.disabled = false;
}
