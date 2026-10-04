import json

with open('data/processed/ekspor_flow.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

sb = d['sunburst']

# 1. Main Center Data (Total -> 5 Benua)
top_conts = [
    {'name': 'Asia', 'value': 0, 'itemStyle': {'color': '#E07A5F'}},
    {'name': 'Eropa', 'value': 0, 'itemStyle': {'color': '#8E82B0'}},
    {'name': 'Oseania', 'value': 0, 'itemStyle': {'color': '#7A9E7E'}},
    {'name': 'Amerika', 'value': 0, 'itemStyle': {'color': '#E29578'}},
    {'name': 'Afrika', 'value': 0, 'itemStyle': {'color': '#D4A373'}}
]

for c in sb['children']:
    val = c['value']
    if c['name'] == 'Asia': top_conts[0]['value'] += val
    elif c['name'] == 'Eropa': top_conts[1]['value'] += val
    elif 'Oseania' in c['name'] or 'Australia' in c['name']: top_conts[2]['value'] += val
    elif 'Amerika' in c['name']: top_conts[3]['value'] += val
    elif c['name'] == 'Afrika': top_conts[4]['value'] += val

center_main = {
    'name': 'Total Ekspor\n$49,69 B',
    'value': sb['value'],
    'itemStyle': {'color': '#292524'},
    'children': top_conts
}

# 2. 5 Satellite series
satellites = {}
for k, col in [('Asia', '#E07A5F'), ('Eropa', '#8E82B0'), ('Oseania', '#7A9E7E'), ('Amerika', '#E29578'), ('Afrika', '#D4A373')]:
    c_list = []
    tot = 0
    for c in sb['children']:
        match = (k == 'Asia' and c['name'] == 'Asia') or \
                (k == 'Eropa' and c['name'] == 'Eropa') or \
                (k == 'Oseania' and ('Oseania' in c['name'] or 'Australia' in c['name'])) or \
                (k == 'Amerika' and 'Amerika' in c['name']) or \
                (k == 'Afrika' and c['name'] == 'Afrika')
        if match and c.get('children'):
            tot += c['value']
            for sub in c['children']:
                c_list.append({'name': sub['name'], 'value': sub['value'], 'itemStyle': {'color': col}})
    satellites[k] = {
        'name': k,
        'value': tot,
        'itemStyle': {'color': col},
        'children': c_list
    }

print("Center main children count:", len(center_main['children']))
for k, s in satellites.items():
    print(f"Satellite {k}: {len(s['children'])} countries, total: ${s['value']/1e9:.2f} B")
