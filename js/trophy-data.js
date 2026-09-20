/**
 * Trophy Room Central Data Architecture
 * GRiD UP Sim Racing
 */

window.TROPHY_STATS = {
    "wins": 18,
    "p2": 27,
    "p3": 19,
    "totalPodiums": 64
};

window.SERIES_LIST = [
    {
        "id": "ALL",
        "label": "ALL SERIES"
    },
    {
        "id": "GT3",
        "label": "GT3"
    },
    {
        "id": "GT4",
        "label": "GT4"
    },
    {
        "id": "LMP2",
        "label": "LMP2"
    },
    {
        "id": "GTE",
        "label": "GTE"
    }
];

window.TRACK_OUTLINES = {
    "spa": {
        "name": "Spa-Francorchamps",
        "length": "7.004 km",
        "svgPath": "M 15 48 L 22 47 L 30 50 L 38 48 L 45 42 L 52 38 L 60 38 L 68 35 L 75 30 L 85 24 L 92 18 L 88 12 L 80 12 L 74 15 L 68 18 L 62 18 L 56 22 L 48 24 L 42 22 L 35 24 L 28 28 L 22 34 L 18 42 Z"
    },
    "brands-hatch": {
        "name": "Brands Hatch",
        "length": "3.916 km",
        "svgPath": "M 20 45 L 15 35 L 18 22 L 28 15 L 42 14 L 56 16 L 68 22 L 78 20 L 88 24 L 86 35 L 78 44 L 65 48 L 50 44 L 38 48 L 28 47 Z"
    },
    "daytona": {
        "name": "Daytona International Speedway",
        "length": "5.730 km",
        "svgPath": "M 15 35 Q 12 18 30 16 L 75 16 Q 92 18 90 35 Q 88 50 72 48 L 52 44 L 32 48 Q 15 50 15 35 Z"
    },
    "nurburgring": {
        "name": "Nurburgring GP",
        "length": "4.574 km",
        "svgPath": "M 22 45 L 18 38 L 22 26 L 32 20 L 46 22 L 55 16 L 68 18 L 78 24 L 84 32 L 80 42 L 68 46 L 56 42 L 44 48 L 32 46 Z"
    },
    "monza": {
        "name": "Monza",
        "length": "5.793 km",
        "svgPath": "M 16 46 L 14 26 L 24 16 L 44 15 L 66 16 L 82 22 L 86 32 L 78 42 L 60 44 L 42 46 L 26 47 Z"
    },
    "watkins-glen": {
        "name": "Watkins Glen",
        "length": "5.472 km",
        "svgPath": "M 18 42 L 18 20 L 32 16 L 46 20 L 56 16 L 72 18 L 84 25 L 82 40 L 72 45 L 56 44 L 42 48 L 28 46 Z"
    },
    "silverstone": {
        "name": "Silverstone",
        "length": "5.891 km",
        "svgPath": "M 20 42 L 16 30 L 25 18 L 42 16 L 58 20 L 72 15 L 84 22 L 82 36 L 70 42 L 54 40 L 40 46 L 28 46 Z"
    },
    "sebring": {
        "name": "Sebring",
        "length": "3.740 km",
        "svgPath": "M 14 38 L 14 22 L 30 18 L 48 20 L 62 16 L 78 20 L 86 28 L 82 42 L 66 45 L 48 40 L 34 46 L 20 44 Z"
    },
    "road-america": {
        "name": "Road America",
        "length": "6.515 km",
        "svgPath": "M 20 48 L 20 22 L 34 16 L 48 18 L 62 15 L 76 18 L 84 26 L 82 40 L 68 46 L 50 42 L 34 48 Z"
    },
    "suzuka": {
        "name": "Suzuka International Circuit",
        "length": "5.807 km",
        "svgPath": "M 16 42 L 18 28 L 30 20 L 44 26 L 56 32 L 68 20 L 80 18 L 86 28 L 78 40 L 64 45 L 50 36 L 36 38 L 24 45 Z"
    },
    "lemans": {
        "name": "24 Hours of Le Mans",
        "length": "13.626 km",
        "svgPath": "M 14 44 L 16 26 L 30 20 L 52 16 L 76 15 L 88 22 L 86 34 L 72 40 L 54 42 L 36 45 L 22 46 Z"
    }
};

window.MANUFACTURER_LOGOS = {
    "porsche": {
        "name": "Porsche",
        "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z\"/><path d=\"M12 6v12\"/><path d=\"M8 10h8\"/><path d=\"M8 14h8\"/></svg>"
    },
    "amg": {
        "name": "Mercedes-AMG",
        "svg": "<svg viewBox=\"0 0 100 24\" fill=\"currentColor\"><text x=\"50%\" y=\"72%\" text-anchor=\"middle\" font-family=\"Orbitron, sans-serif\" font-weight=\"900\" font-size=\"14\" letter-spacing=\"3\" fill=\"currentColor\">///AMG</text></svg>"
    },
    "bmw": {
        "name": "BMW M",
        "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18\"/><path d=\"M3 12h18\"/><path d=\"M12 3a9 9 0 0 1 9 9H12z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M12 12a9 9 0 0 1-9 9V12z\" fill=\"currentColor\" fill-opacity=\"0.3\"/></svg>"
    },
    "ferrari": {
        "name": "Ferrari",
        "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M12 6v12\"/><path d=\"M9 10h6\"/></svg>"
    },
    "aston": {
        "name": "Aston Martin",
        "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M2 12c3-4 7-6 10-6s7 2 10 6c-3 4-7 6-10 6s-7-2-10-6z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>"
    },
    "audi": {
        "name": "Audi Sport",
        "svg": "<svg viewBox=\"0 0 36 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><circle cx=\"6\" cy=\"8\" r=\"4\"/><circle cx=\"14\" cy=\"8\" r=\"4\"/><circle cx=\"22\" cy=\"8\" r=\"4\"/><circle cx=\"30\" cy=\"8\" r=\"4\"/></svg>"
    },
    "lamborghini": {
        "name": "Lamborghini",
        "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><polygon points=\"12 2 22 8 18 21 6 21 2 8 12 2\"/></svg>"
    },
    "dallara": {
        "name": "Dallara",
        "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M4 4h9a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H4V4z\"/></svg>"
    }
};

window.FEATURED_PODIUMS = [
    {
        "id": "featured-1",
        "position": 1,
        "positionLabel": "1ST PLACE",
        "accent": "gold",
        "series": "iRacing GT3 Series",
        "category": "GT3",
        "round": "Round 2",
        "event": "Spa-Francorchamps",
        "date": "Mar 23, 2024",
        "season": 2024,
        "car": "Porsche 911 GT3 R",
        "drivers": [
            "Alex R.",
            "Jamie T."
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "spa",
        "trackName": "Spa-Francorchamps",
        "trackLength": "7.004 km",
        "image": "assets/results/July1126.png",
        "manufacturer": "porsche",
        "qualy": "P1",
        "gap": "+2.418s"
    },
    {
        "id": "featured-2",
        "position": 2,
        "positionLabel": "2ND PLACE",
        "accent": "silver",
        "series": "Assetto Corsa Competizione",
        "category": "GT3",
        "round": "Round 1",
        "event": "Brands Hatch",
        "date": "Feb 11, 2024",
        "season": 2024,
        "car": "Mercedes-AMG GT3",
        "drivers": [
            "Chris M.",
            "Daniel K."
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "brands-hatch",
        "trackName": "Brands Hatch",
        "trackLength": "3.916 km",
        "image": "assets/results/Feb2126(1).png",
        "manufacturer": "amg",
        "qualy": "P3",
        "gap": "+0.892s"
    },
    {
        "id": "featured-3",
        "position": 3,
        "positionLabel": "3RD PLACE",
        "accent": "bronze",
        "series": "iRacing Endurance",
        "category": "GT3",
        "round": "Round 4",
        "event": "Daytona (24h)",
        "date": "Jan 14, 2024",
        "season": 2024,
        "car": "BMW M4 GT3",
        "drivers": [
            "Alex R.",
            "Chris M.",
            "Jamie T."
        ],
        "teamName": "GRiD UP Blue",
        "trackKey": "daytona",
        "trackName": "Daytona International Speedway",
        "trackLength": "5.730 km",
        "image": "assets/results/Jan1726(1).png",
        "manufacturer": "bmw",
        "qualy": "P4",
        "gap": "+1 Lap"
    }
];

window.PAST_PODIUMS = [
    {
        "id": "podium-1",
        "position": 1,
        "positionLabel": "1ST PLACE",
        "accent": "gold",
        "series": "iRacing GT3 Series",
        "category": "GT3",
        "round": "Round 6",
        "event": "Nurburgring GP",
        "date": "Jan 28, 2024",
        "season": 2024,
        "car": "Porsche 911 GT3 R",
        "drivers": [
            "Sam L.",
            "Taylor B."
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "nurburgring",
        "trackName": "Nurburgring GP",
        "trackLength": "4.574 km",
        "image": "assets/results/May226(1).png",
        "manufacturer": "porsche"
    },
    {
        "id": "podium-2",
        "position": 2,
        "positionLabel": "2ND PLACE",
        "accent": "silver",
        "series": "Assetto Corsa Competizione",
        "category": "GT3",
        "round": "Round 3",
        "event": "Monza",
        "date": "Apr 27, 2024",
        "season": 2024,
        "car": "Lamborghini Huracan GT3 EVO",
        "drivers": [
            "Chris M.",
            "Daniel K."
        ],
        "teamName": "GRiD UP White",
        "trackKey": "monza",
        "trackName": "Monza",
        "trackLength": "5.793 km",
        "image": "assets/results/July2526(1).png",
        "manufacturer": "lamborghini"
    },
    {
        "id": "podium-3",
        "position": 3,
        "positionLabel": "3RD PLACE",
        "accent": "bronze",
        "series": "iRacing Endurance",
        "category": "GT3",
        "round": "Round 4",
        "event": "Daytona (24h)",
        "date": "Jan 14, 2024",
        "season": 2024,
        "car": "BMW M4 GT3",
        "drivers": [
            "Alex R.",
            "Chris M.",
            "Jamie T."
        ],
        "teamName": "GRiD UP Blue",
        "trackKey": "daytona",
        "trackName": "Daytona International Speedway",
        "trackLength": "5.730 km",
        "image": "assets/results/Jan1726(2).png",
        "manufacturer": "bmw"
    },
    {
        "id": "podium-4",
        "position": 1,
        "positionLabel": "1ST PLACE",
        "accent": "gold",
        "series": "iRacing GT3 Series",
        "category": "GT3",
        "round": "Round 9",
        "event": "Watkins Glen",
        "date": "Dec 20, 2023",
        "season": 2023,
        "car": "Audi R8 LMS GT3",
        "drivers": [
            "Sam L.",
            "Alex R."
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "watkins-glen",
        "trackName": "Watkins Glen",
        "trackLength": "5.472 km",
        "image": "assets/results/Sep2025.png",
        "manufacturer": "audi"
    },
    {
        "id": "podium-5",
        "position": 3,
        "positionLabel": "3RD PLACE",
        "accent": "bronze",
        "series": "Assetto Corsa Competizione",
        "category": "GT3",
        "round": "Round 5",
        "event": "Silverstone",
        "date": "Nov 12, 2023",
        "season": 2023,
        "car": "Ferrari 296 GT3",
        "drivers": [
            "Chris M.",
            "Daniel K."
        ],
        "teamName": "GRiD UP Red",
        "trackKey": "silverstone",
        "trackName": "Silverstone",
        "trackLength": "5.891 km",
        "image": "assets/results/July1126(1).png",
        "manufacturer": "ferrari"
    },
    {
        "id": "podium-6",
        "position": 2,
        "positionLabel": "2ND PLACE",
        "accent": "silver",
        "series": "iRacing Endurance",
        "category": "GT3",
        "round": "Round 2",
        "event": "Sebring (12h)",
        "date": "Oct 8, 2023",
        "season": 2023,
        "car": "Porsche 911 GT3 R",
        "drivers": [
            "Alex R.",
            "Taylor B."
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "sebring",
        "trackName": "Sebring",
        "trackLength": "3.740 km",
        "image": "assets/results/Mar2826.png",
        "manufacturer": "porsche"
    },
    {
        "id": "podium-7",
        "position": 1,
        "positionLabel": "1ST PLACE",
        "accent": "gold",
        "series": "iRacing IMSA Championship",
        "category": "LMP2",
        "round": "Round 7",
        "event": "Road America (6h)",
        "date": "Jul 25, 2026",
        "season": 2026,
        "car": "Porsche 963 GTP",
        "drivers": [
            "Faraz Ebrahim",
            "Anthony Savignano"
        ],
        "teamName": "GRiD UP Red",
        "trackKey": "road-america",
        "trackName": "Road America",
        "trackLength": "6.515 km",
        "image": "assets/results/July2526(3).png",
        "manufacturer": "porsche"
    },
    {
        "id": "podium-8",
        "position": 2,
        "positionLabel": "2ND PLACE",
        "accent": "silver",
        "series": "iRacing Special Events",
        "category": "GT3",
        "round": "Round 1",
        "event": "Nurburgring 24h",
        "date": "May 2, 2026",
        "season": 2026,
        "car": "Aston Martin Vantage GT3 EVO",
        "drivers": [
            "Alex Cortez",
            "Connor Deasey",
            "Jacob Reid",
            "Aaron Wilt"
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "nurburgring",
        "trackName": "Nurburgring Nordschleife",
        "trackLength": "25.378 km",
        "image": "assets/results/May226(2).png",
        "manufacturer": "aston"
    },
    {
        "id": "podium-9",
        "position": 2,
        "positionLabel": "2ND PLACE",
        "accent": "silver",
        "series": "iRacing Special Events",
        "category": "GT3",
        "round": "Round 8",
        "event": "Suzuka 1000km",
        "date": "Sep 12, 2026",
        "season": 2026,
        "car": "Ferrari 296 GT3",
        "drivers": [
            "Matty Roberts",
            "Faraz Ebrahim",
            "Terry Cantwell"
        ],
        "teamName": "GRiD UP Purple",
        "trackKey": "suzuka",
        "trackName": "Suzuka International Circuit",
        "trackLength": "5.807 km",
        "image": "assets/results/Nov1525.png",
        "manufacturer": "ferrari"
    },
    {
        "id": "podium-10",
        "position": 1,
        "positionLabel": "1ST PLACE",
        "accent": "gold",
        "series": "iRacing Special Events",
        "category": "GT4",
        "round": "Special Round",
        "event": "INDY 500",
        "date": "May 18, 2026",
        "season": 2026,
        "car": "Dallara IR18",
        "drivers": [
            "Alex Cortez"
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "daytona",
        "trackName": "Indianapolis Motor Speedway",
        "trackLength": "4.023 km",
        "image": "assets/results/Jan1026.png",
        "manufacturer": "dallara"
    },
    {
        "id": "podium-11",
        "position": 2,
        "positionLabel": "2ND PLACE",
        "accent": "silver",
        "series": "iRacing Endurance Series",
        "category": "LMP2",
        "round": "Round 1",
        "event": "Daytona 24h",
        "date": "Jan 17, 2026",
        "season": 2026,
        "car": "Dallara P217",
        "drivers": [
            "Martyn Cook",
            "Alex Cortez",
            "Andrew Fabian",
            "Jacob Reid"
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "daytona",
        "trackName": "Daytona Road Course",
        "trackLength": "5.730 km",
        "image": "assets/results/Jan1726(3).png",
        "manufacturer": "dallara"
    },
    {
        "id": "podium-12",
        "position": 3,
        "positionLabel": "3RD PLACE",
        "accent": "bronze",
        "series": "iRacing GTE Masters",
        "category": "GTE",
        "round": "Round 3",
        "event": "Circuit de la Sarthe",
        "date": "Jun 14, 2025",
        "season": 2025,
        "car": "Porsche 911 RSR",
        "drivers": [
            "Sam L.",
            "Taylor B."
        ],
        "teamName": "GRiD UP Sim Racing",
        "trackKey": "lemans",
        "trackName": "24 Hours of Le Mans",
        "trackLength": "13.626 km",
        "image": "assets/results/July1126(2).png",
        "manufacturer": "porsche"
    }
];

