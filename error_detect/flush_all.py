###########################################################
import sys
import pathlib
sys.path.append(f"{pathlib.Path(__file__).parent.parent}")
###########################################################
import isaac
import tqdm

site = isaac.site('flush_all')
for p in tqdm.tqdm(site.Pages):
    try:
        print(p.purge())
    except Exception as e:
        print(e)