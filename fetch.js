async function extractValueAndCoordinates(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Error: HTTP status code ${response.status} for URL: ${url}`);
            return null;
        }

        const data = await response.json();

        const valueCoordinates = [];

        if (data.features) {
            data.features.forEach((feature) => {
                if (feature.geometry && feature.geometry.coordinates && feature.properties) {
                    const coords = feature.geometry.coordinates;
                    let value = null;

                    if (feature.properties.mmi !== undefined) {
                        value = feature.properties.mmi;
                    } else if (feature.properties.value !== undefined) {
                        value = feature.properties.value;
                    } else {
                        console.warn("Warning: No value found in feature.properties.");
                    }

                    if (Array.isArray(coords)) {
                        if (coords.length === 2 && value !== null) {
                            valueCoordinates.push({
                                value: value,
                                coordinates: coords,
                            });
                        } else if (Array.isArray(coords[0]) && value !== null) {
                            coords[0].forEach((coordPair) => {
                                valueCoordinates.push({
                                    value: value,
                                    coordinates: coordPair,
                                });
                            });
                        } else {
                            if (value === null) {
                                console.warn("Warning: Value is null");
                            }
                            console.warn(`Warning: Unexpected coordinates format: ${coords}`);
                        }
                    } else {
                        console.warn(`Warning: 'coordinates' is not an array: ${coords}`);
                    }
                } else {
                    console.warn("Warning: 'geometry', 'coordinates', or 'properties' missing in feature.");
                }
            });
        } else {
            console.warn("Warning: 'features' key not found in JSON.");
        }

        return valueCoordinates;

    } catch (error) {
        console.error(`Error processing JSON: ${error}`);
        return null;
    }
}

function exportValueCoordinatesToCSV(valueCoordinates, filename = 'value_coordinates_map.csv') {
    if (!valueCoordinates || valueCoordinates.length === 0) {
        console.warn("No value and coordinates to export.");
        return;
    }

    let csvContent = "Value,Longitude,Latitude\n";
    valueCoordinates.forEach((item) => {
        csvContent += `${item.value},${item.coordinates[0]},${item.coordinates[1]}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");
    if (URL.createObjectURL) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.error("Browser does not support URL.createObjectURL. CSV download not possible.");
    }
}

// Earthquake Data from USGS:
const url = "https://earthquake.usgs.gov/realtime/product/shakemap/us7000pn9s/us/1743393840844/download/cont_mmi.json";

extractValueAndCoordinates(url)
    .then((valueCoords) => {
        if (valueCoords) {
            exportValueCoordinatesToCSV(valueCoords);
        } else {
            console.log("Value and coordinates extraction failed.");
        }
    });