import json

with open("reporters_db/reporters.json") as r_db_file:
    r_db = json.load(r_db_file)

v_db = {}
for r in r_db:
    #add current
    v_db[r] = r
    #add variations
    for var in r_db[r][0]["variations"]:
        v_db[var] = r

with open("variations.json", "w") as v_db_file:
    v_db_file.write(json.dumps(v_db, sort_keys=True, indent=4).encode("utf8"))