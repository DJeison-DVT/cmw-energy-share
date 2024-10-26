import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const MapChart = () => {
    const svgRef = useRef();
    const tooltipRef = useRef();
    const [year, setYear] = useState(2023);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedDataType, setSelectedDataType] = useState("energy");
    const [energyData, setEnergyData] = useState([]);
    const [solarData, setSolarData] = useState([]);
    const [windData, setWindData] = useState([]);
    const [hydroData, setHydroData] = useState([]);
    const [topo, setTopo] = useState(null);
    const [intervalId, setIntervalId] = useState(null);

    const width = 800;
    const height = 500;

    useEffect(() => {
        // Load GeoJSON and CSV data once
        Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.csv("renewable-share-energy.csv"),
            d3.csv('share-electricity-solar.csv'),
            d3.csv('share-electricity-wind.csv'),
            d3.csv('share-electricity-hydro.csv')
        ]).then(([geoData, energyData, solarData, windData, hydroData]) => {
            setTopo(geoData);
            setEnergyData(energyData);
            setSolarData(solarData);
            setWindData(windData);
            setHydroData(hydroData);
            drawMap(geoData, energyData, year);
        });

        return () => clearInterval(intervalId);
    }, []);

    const getColorScale = () => {
        switch (selectedDataType) {
            case "wind":
                return d3.scaleThreshold()
                    .domain([0, 1, 2, 5, 10, 20, 50, 100])
                    .range(["#ffffff", "#f0f8ff", "#b0c4de", "#87ceeb", "#4682b4", "#4169e1", "#0000cd", "#000080"]);
            case "solar":
                return d3.scaleThreshold()
                    .domain([0, 1, 2, 5, 10, 20])
                    .range(["#ffffff", "#ffefd5", "#ffdab9", "#ffb6c1", "#ff7f50", "#ff4500", "#dc143c"]);
            case "hydro":
                return d3.scaleThreshold()
                    .domain([0, 1, 2, 5, 10, 20, 50, 100])
                    .range(["#ffffff", "#e0ffff", "#afeeee", "#40e0d0", "#20b2aa", "#008b8b", "#00688b", "#004242"]);
            default:
                return d3.scaleThreshold()
                    .domain([0, 10, 20, 30, 40, 50, 60, 70])
                    .range(d3.schemeBuGn[8]);
        }
    };

    useEffect(() => {
        if (topo && energyData) {
            updateMap(year);
        }
    }, [year, topo, energyData, selectedDataType]);

    const drawMap = (geoData, energyData, initialYear) => {
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        const tooltip = d3.select(tooltipRef.current);

        svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", d3.geoPath().projection(
                d3.geoMercator()
                    .scale(100)
                    .center([0, 20])
                    .translate([width / 2, height / 2])
            ));
    };

    const updateMap = (year) => {
        const svg = d3.select(svgRef.current);
        const colorScale = getColorScale();

        svg.selectAll("path")
            .transition()
            .duration(300)
            .attr("fill", d => {
                const total = getTotalForCountry(d.id, year);
                return total === 0 ? "#fafafa" : colorScale(total);
            });
    };

    const getTotalForCountry = (countryId, selectedYear) => {
        const dataSource = {
            energy: energyData,
            solar: solarData,
            wind: windData,
            hydro: hydroData,
        }[selectedDataType];

        const countryData = dataSource.find(d => d.Code === countryId && d.Year === selectedYear.toString());
        const total = countryData ? +countryData["Percentage"] : 0;
        return total;
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            clearInterval(intervalId);
            setIsPlaying(false);
        } else {
            if (year === 2023) setYear(1965); // Reset to start year if at max
            const id = setInterval(() => {
                setYear(prevYear => {
                    if (prevYear >= 2023) {
                        clearInterval(id);
                        setIsPlaying(false);
                        return 2023;
                    }
                    return prevYear + 1;
                });
            }, 1000);
            setIntervalId(id);
            setIsPlaying(true);
        }
    };

    return (
        <div className="container">
            <div className="tooltip" ref={tooltipRef}></div>
            <svg ref={svgRef}></svg>
            <div>
                <input
                    type="range"
                    min="1965"
                    max="2023"
                    value={year}
                    onChange={e => setYear(+e.target.value)}
                />
                <label>Year: <span>{year}</span></label>
                <button onClick={handlePlayPause}>{isPlaying ? "Pause" : "Play"}</button>
            </div>
            <div>
                <label>
                    <input
                        type="radio"
                        value="energy"
                        checked={selectedDataType === "energy"}
                        onChange={() => setSelectedDataType("energy")}
                    />
                    Energy
                </label>
                <label>
                    <input
                        type="radio"
                        value="solar"
                        checked={selectedDataType === "solar"}
                        onChange={() => setSelectedDataType("solar")}
                    />
                    Solar
                </label>
                <label>
                    <input
                        type="radio"
                        value="wind"
                        checked={selectedDataType === "wind"}
                        onChange={() => setSelectedDataType("wind")}
                    />
                    Wind
                </label>
                <label>
                    <input
                        type="radio"
                        value="hydro"
                        checked={selectedDataType === "hydro"}
                        onChange={() => setSelectedDataType("hydro")}
                    />
                    Hydro
                </label>
            </div>
        </div>
    );
};

export default MapChart;
