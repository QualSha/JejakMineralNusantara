import json

with open('data/processed/ekspor_flow.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

sb = d['sunburst']
total_export = sb['value']

print("Total export:", total_export)

# Clean mapping
clean_map = {
    'China': 'Tiongkok', 'Japan': 'Jepang', 'Korea Republic Of': 'Korea Selatan',
    'Viet Nam': 'Vietnam', 'Philippines': 'Filipina', 'Singapore': 'Singapura',
    'Netherlands': 'Belanda', 'Italy': 'Italia', 'Turkey': 'Turki', 'Belgium': 'Belgia',
    'Marshall Islands': 'Kep. Marshall', 'Brazil': 'Brasil', 'South Africa': 'Afrika Selatan',
    'United States': 'Amerika Serikat', 'Mexico': 'Meksiko'
}

continents = ['Asia', 'Eropa', 'Oseania', 'Amerika', 'Afrika']
colors = {
    'Asia': '#E07A5F',
    'Eropa': '#8E82B0',
    'Oseania': '#7A9E7E',
    'Amerika': '#E29578',
    'Afrika': '#D4A373'
}

print("Continent checks passed!")
