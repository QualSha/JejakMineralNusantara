import json

with open('data/processed/ekspor_flow.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

sb = d['sunburst']

# Verify country counts for all 5 continents:
for c in sb['children']:
    print(c['name'], len(c.get('children', [])))
