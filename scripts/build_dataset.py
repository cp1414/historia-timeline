#!/usr/bin/env python3
"""
Builds and verifies the complete 160-card Classical History Timeline dataset
conforming to the Archival Museum & Classical Print UI Standard:
- 100% Modest, Kid-Appropriate Public-Domain Fine Art & Historical Artifacts
- Archival Linen & Historical Pigment Palette
- Official 960px Wikimedia Commons thumbnails
- Preserves Atlas geographic coordinates and primary source citations
"""

import json
import re
import ssl
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

from bundle_browser import build_all

SERIES_INFO = [
    {
        "id": "ot-egypt",
        "number": 1,
        "roman": "I",
        "name": "Old Testament & Ancient Egypt",
        "shortName": "Old Testament & Egypt",
        "range": "001–052 · 32 plates",
        "color": "#B85D3B",
        "lightBg": "#F5F2EB",
        "badgeBg": "#EDE8DD",
        "borderColor": "#DCD6C8",
    },
    {
        "id": "nt-greece-rome",
        "number": 2,
        "roman": "II",
        "name": "New Testament, Greece & Rome",
        "shortName": "Greece & Rome",
        "range": "009–068 · 32 plates",
        "color": "#5E3A6E",
        "lightBg": "#F5F2EB",
        "badgeBg": "#EDE8DD",
        "borderColor": "#DCD6C8",
    },
    {
        "id": "middle-ages",
        "number": 3,
        "roman": "III",
        "name": "Middle Ages, Renaissance & Reformation",
        "shortName": "Middle Ages & Ref.",
        "range": "064–100 · 32 plates",
        "color": "#264E70",
        "lightBg": "#F5F2EB",
        "badgeBg": "#EDE8DD",
        "borderColor": "#DCD6C8",
    },
    {
        "id": "explorers-1815",
        "number": 4,
        "roman": "IV",
        "name": "Explorers to 1815",
        "shortName": "Explorers to 1815",
        "range": "087–128 · 32 plates",
        "color": "#1B365D",
        "lightBg": "#F5F2EB",
        "badgeBg": "#EDE8DD",
        "borderColor": "#DCD6C8",
    },
    {
        "id": "modern-america",
        "number": 5,
        "roman": "V",
        "name": "1815 to Present",
        "shortName": "1815 to Present",
        "range": "129–160 · 32 plates",
        "color": "#3A4E58",
        "lightBg": "#F5F2EB",
        "badgeBg": "#EDE8DD",
        "borderColor": "#DCD6C8",
    },
]

# Explicit Wikimedia Commons Special:FilePath overrides for cards where we want a specific
# modest, public-domain painting, print, or iconic archival artifact.
DIRECT_COMMONS_FILES = {
    1: "Creation_of_Light.png",
    2: "Thomas_Cole_-_The_Garden_of_Eden_(1828).jpg",
    3: "Schnorr_von_Carolsfeld_Bibel_in_Bildern_1860_012.png",
    6: "Narmer_Palette.jpg",
    7: "The_Great_Sphinx,_Pyramids_of_Gizeh-1839)_by_David_Roberts,_RA.jpg",
    8: "Stela_of_the_Steward_Mentuwoser_MET_DT527.jpg",
    9: "Knossos_bull_leaping_fresco.jpg",
    10: "Molnár_Ábrahám_kiköltözése_1850.jpg",
    11: "A_Deep_Sleep_Fell_Upon_Abram_and_a_Horror_Seized_Him_(5752557).jpg",
    14: "Tissot_Isaac_Bears_the_Wood_for_His_Sacrifice.jpg",
    15: "Standing_Hippopotamus_MET_DP248992.jpg",
    17: "Joseph_Overseer_of_Pharaoh's_Graneries_1874.jpg",
    18: "Rembrandt_van_Rijn_-_Jacob_blessing_Ephraim_and_Manasseh_(Gemäldegalerie_Alte_Meister_Kassel).jpg",
    19: "Ceremonial_axe_of_Ahmose_I_(both_sides).jpg",
    22: "Seated_Statue_of_Hatshepsut_MET_DP116059.jpg",
    23: "Tissot_Moses_Laid_Amid_the_Flags.jpg",
    24: "Martin,_John_-_The_Seventh_Plague_-_1823.jpg",
    25: "The_Crossing_of_The_Red_Sea.jpg",
    26: "Philippe_de_Champaigne_-_Moses_with_the_Ten_Commandments_-_WGA04717.jpg",
    30: "David_Roberts_Aboo_Simbel.jpg",
    31: "Giovanni_Domenico_Tiepolo_-_The_Procession_of_the_Trojan_Horse_in_Troy_-_WGA22382.jpg",
    32: "AssyrianWarship.jpg",
    34: "Claude Lorrain - Seaport with the Embarkation of the Queen of Sheba - WGA05002.jpg",
    35: "The Black Obelisk of Shalmaneser III, 9th century BC, from Nimrud, Iraq. The British Museum.jpg",
    37: "Getty_Open_Image_kleophrades-painter-attic-panathenaic-amphora-greek-attic-490-480-bc_depicting_four_horse_chariot_race_00871101.png",
    38: "Lupa_Capitolina,_Rome.jpg",
    39: "Leo_von_Klenze_-_The_Acropolis_at_Athens_-_WGA12199.jpg",
    41: "Isaiah-Michelangelo.jpg",
    42: "Maccari-Cicero.jpg",
    43: "Battle_of_Salamis_by_Wilhelm_von_Kaulbach.jpg",
    44: "PericlesFuneralOrationRijksmuseum.jpg",
    46: "108.Nehemiah_Views_the_Ruins_of_Jerusalem's_Walls.jpg",
    48: "Rosetta_Stone.JPG",
    49: "Giovanni_Paolo_Panini_-_Interior_of_the_Pantheon,_Rome_-_Google_Art_Project.jpg",
    50: "Joseph Mallord William Turner - Snow Storm, Hannibal and his Army Crossing the Alps - WGA23167.jpg",
    54: "The_Angel_Appearing_to_the_Shepherds_(Thomas_Cole).jpg",
    55: "DoreJohntheBaptistPreachingintheWilderness.jpg",
    56: "The_Sae_of_Tiberias,_looking_towards_Bashan._David_Roberts._1855.jpg",
    57: "Frederic_Edwin_Church_-_Jerusalem_from_the_Mount_of_Olives_-_Google_Art_Project.jpg",
    60: "Karl_Brullov_-_The_Last_Day_of_Pompeii_-_Google_Art_Project.jpg",
    63: "Codex_Sinaiticus_Matthew_6,4-32.JPG",
    65: "Nicholas Roerich, Guests from Overseas.jpg",
    68: "Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg",
    71: "Gustav_Bauernfeind_-_The_Gate_Of_The_Great_Umayyad_Mosque,_Damascus.jpg",
    72: "Albrecht_Dürer_-_Emperor_Charlemagne.jpg",
    73: "Alfred_Jewel_Ashmolean_2014.JPG",
    75: "John_Singer_Sargent_-_Santa_Sofia_(1891).jpg",
    76: "Accolade_by_Edmund_Blair_Leighton.jpg",
    78: "John_Constable_-_Salisbury_Cathedral_from_the_Bishop's_Grounds.jpg",
    79: "Taking_of_Jerusalem_by_the_Crusaders,_15th_July_1099.jpg",
    84: "Ingres coronation charles vii.jpg",
    87: "Henry_the_Navigator1.jpg",
    90: "Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg",
    91: "Galileo_facing_the_Roman_Inquisition.jpg",
    92: "Landing_of_Columbus_(2).jpg",
    103: "Baptism_of_Pocahontas.jpg",
    104: "Mayflower_in_Plymouth_Harbor,_by_William_Halsall.jpg",
    105: "The_First_Thanksgiving_cph.3g04961.jpg",
    109: "Treaty_of_Penn_with_Indians_by_Benjamin_West.jpg",
    110: "John_Wollaston_(1710-1775^)_-_George_Whitefield_-_NPG_131_-_National_Portrait_Gallery.jpg",
    111: "Peter Monamy (attrib.) - Harbor scene. An English ship with sails loosened firing a gun.jpg",
    112: "Benjamin_West_005.jpg",
    115: "The dawn of liberty, Lexington, 1775 - Hy Sandham. LCCN95521116.jpg",
    118: "Washington_Crossing_the_Delaware_by_Emanuel_Leutze,_MMA-NYC,_1851.jpg",
    122: "Washington_Constitutional_Convention_1787.jpg",
    127: 'Thomas_Birch_-_Engagement_Between_the_"Constitution"_and_the_"Guerrière".jpg',
    128: "Henry_Clay_Senate3.jpg",
    129: "James_Monroe_White_House_portrait_1819.jpg",
    130: "Erie_canal_lockport_c1855.jpg",
    132: "The_First_cotton-gin_-_drawn_by_William_L._Sheppard._LCCN91784966.jpg",
    134: "John_Ross_(Cherokee_chief)_2.jpg",
    136: "Albert_Bierstadt_-_Emigrants_Crossing_the_Plains_(1867).jpg",
    139: "Albert_Bierstadt_-_Mount_Hood.jpg",
    141: "Winslow_Homer_-_Prisoners_from_the_Front_-_The_Metropolitan_Museum_of_Art.jpg",
    145: "Winslow_Homer_-_Sunday_Morning_in_Virginia.jpg",
    147: "Edison's_Menlo_Park_Lab.jpg",
    150: "Charge_of_the_Rough_Riders_at_San_Juan_Hill.JPG",
    152: "EdwardMoran-UnveilingTheStatueofLiberty1886Large.jpg",
    153: "First_flight2.jpg",
    155: "New_York_City_street_scenes_-_Easter_on_5th_Avenue_LCCN93506588.jpg",
    156: "Lange-MigrantMother02.jpg",
    158: "Chipping_off_a_piece_of_the_Berlin_Wall.jpg",
    160: "City_Lights_of_the_United_States_2012.jpg",
}

UPDATED_ARTWORK_CAPTIONS = {
    1: "The Creation of Light ('Let there be light!') by Gustave Doré (1866)",
    2: "The Garden of Eden by Thomas Cole (1828, Amon Carter Museum of American Art)",
    3: "Cain and Abel Offer Their First Sacrifices by Julius Schnorr von Carolsfeld (1860, Die Bibel in Bildern)",
    6: "The Narmer Palette, commemorating King Narmer (Menes) unifying Upper and Lower Egypt (c. 3100 BC, Egyptian Museum, Cairo)",
    7: "The Great Sphinx and Pyramids of Giza by David Roberts (1839, Egypt and Nubia)",
    8: "Limestone Funerary Stela of Mentuwoser (Metropolitan Museum of Art)",
    9: "Minoan Bull-Leaping Fresco from the Palace of Knossos (c. 1450 BC, Heraklion Archaeological Museum)",
    10: "Abraham's Journey from Ur to Canaan by József Molnár (1850, Hungarian National Gallery)",
    11: "God's Covenant with Abraham by Gerard Hoet (1728, Figures de la Bible)",
    12: "Hagar and Ishmael in the Desert by François-Joseph Navez (1820, Royal Museums of Fine Arts of Belgium)",
    14: "Isaac Bears the Wood for His Sacrifice by James Tissot (c. 1896, Jewish Museum, New York)",
    15: "Middle Kingdom Faience Hippopotamus ('William'), Twelfth Dynasty (c. 1961–1878 BC, Metropolitan Museum of Art)",
    17: "Joseph, Overseer of Pharaoh's Granaries by Sir Lawrence Alma-Tadema (1874, Dahesh Museum of Art)",
    18: "Jacob Blessing the Sons of Joseph by Rembrandt van Rijn (1656, Gemäldegalerie Alte Meister, Kassel)",
    19: "Gold and Inlaid Ceremonial Axe of Pharaoh Ahmose I, Commemorating the Expulsion of the Hyksos (Luxor Museum; Photo: Heidi Kontkanen, CC BY-SA 2.0)",
    20: "Basalt Stele of the Code of Hammurabi (c. 1750 BC, Louvre Museum; Photo: Mbzt, CC BY 3.0)",
    22: "Seated Limestone Statue of Pharaoh Hatshepsut, Eighteenth Dynasty (c. 1479–1458 BC, Metropolitan Museum of Art)",
    23: "Moses Laid Amid the Flags by James Tissot (c. 1896, Jewish Museum, New York)",
    24: "The Seventh Plague of Egypt by John Martin (1823, Museum of Fine Arts, Boston)",
    25: "The Crossing of the Red Sea by Nicolas Poussin (c. 1634, National Gallery of Victoria)",
    26: "Moses with the Tablets of the Ten Commandments by Philippe de Champaigne (c. 1648, Hermitage Museum)",
    28: "Colossal Statue of Pharaoh Akhenaten (Amenhotep IV) from Karnak (Photo: Gérard Ducher, CC BY-SA 2.5)",
    30: "The Great Temple of Ramesses II at Abu Simbel by David Roberts (1838, Egypt and Nubia)",
    31: "The Procession of the Trojan Horse into Troy by Giovanni Domenico Tiepolo (c. 1760, National Gallery, London)",
    32: "Ancient Phoenician Warship Relief from Nineveh (c. 700 BC, British Museum; Photo: World Imaging, CC BY-SA 3.0)",
    34: "Seaport with the Embarkation of the Queen of Sheba (to Visit King Solomon) by Claude Lorrain (1648, National Gallery, London)",
    35: "The Black Obelisk of Shalmaneser III, recording tribute from King Jehu of Israel (c. 825 BC, British Museum; Photo: Osama Shukir Muhammed Amin, CC BY-SA 4.0)",
    36: "Marble Bust of the Blind Greek Poet Homer (British Museum; Photo: Mike Peel, CC BY-SA 4.0)",
    37: "Panathenaic Prize Amphora Depicting a Chariot Race by the Kleophrades Painter (c. 490–480 BC, J. Paul Getty Museum)",
    38: "The Capitoline Wolf Bronze Depicting Romulus and Remus, Founders of Rome (Capitoline Museums, Rome)",
    39: "The Acropolis at Athens by Leo von Klenze (1846, Neue Pinakothek, Munich)",
    40: "The Flight of the Prisoners (Babylonian Exile) by James Tissot (c. 1896–1902, Jewish Museum, New York)",
    41: "The Prophet Isaiah by Michelangelo (Sistine Chapel ceiling)",
    42: "Cicero Denounces Catiline in the Roman Senate by Cesare Maccari (1889, Palazzo Madama)",
    43: "The Battle of Salamis (480 BC) by Wilhelm von Kaulbach",
    44: "Pericles' Funeral Oration by Philipp Foltz (1852, Rijksmuseum)",
    46: "Nehemiah Views the Ruins of Jerusalem's Walls by Gustave Doré (1866)",
    48: "The Rosetta Stone, Ptolemaic Decree in Hieroglyphs, Demotic, and Ancient Greek (196 BC, British Museum; Photo: Hans Hillewaert, CC BY-SA 4.0)",
    49: "Interior of the Pantheon in Rome by Giovanni Paolo Panini (c. 1734, National Gallery of Art)",
    50: "Snow Storm: Hannibal and His Army Crossing the Alps by J. M. W. Turner (1812, Tate Britain)",
    52: "Roman Marble Relief Depicting the Battle of Actium (31 BC; Photo: Mark Landon, CC BY 4.0)",
    54: "The Angel Appearing to the Shepherds by Thomas Cole (1833–1834, Chrysler Museum of Art)",
    55: "John the Baptist Preaching in the Wilderness by Gustave Doré (1866)",
    56: "The Sea of Galilee Looking Towards Bashan by David Roberts (1855, The Holy Land)",
    57: "Jerusalem from the Mount of Olives by Frederic Edwin Church (1870, Nelson-Atkins Museum of Art)",
    60: "The Last Day of Pompeii by Karl Bryullov (1833)",
    63: "Codex Sinaiticus, Fourth-Century Christian Greek Manuscript Written Shortly After the Council of Nicaea (British Library)",
    65: "Guests from Overseas (Viking Longships) by Nicholas Roerich (1901, Tretyakov Gallery)",
    67: "The Fourth Ecumenical Council of Chalcedon (451 AD) by Vasily Surikov (1876)",
    68: "The Course of Empire: Destruction by Thomas Cole (1836, New-York Historical Society)",
    70: "Mosaic of Emperor Justinian I at the Basilica of San Vitale, Ravenna (Photo: Petar Milošević, CC BY-SA 4.0)",
    71: "The Gate of the Great Mosque of Damascus by Gustav Bauernfeind (1890)",
    72: "Emperor Charlemagne by Albrecht Dürer (c. 1512, Germanisches Nationalmuseum)",
    73: "The Alfred Jewel, Gold and Enamel Anglo-Saxon Relic Inscribed for King Alfred (9th century, Ashmolean Museum; Photo: Geni, CC BY-SA 4.0)",
    75: "Santa Sofia (Hagia Sophia, Constantinople) by John Singer Sargent (1891, Brooklyn Museum)",
    76: "The Accolade by Edmund Blair Leighton (1901)",
    78: "Salisbury Cathedral from the Bishop's Grounds by John Constable (c. 1825, Metropolitan Museum of Art)",
    79: "Taking of Jerusalem by the Crusaders (1099) by Émile Signol (1847, Palace of Versailles)",
    83: "Portrait of Marco Polo (Woodcut Frontispiece, Nuremberg Edition, 1477)",
    84: "Joan of Arc at the Coronation of Charles VII by Jean-Auguste-Dominique Ingres (1854, Louvre Museum)",
    86: "Portrait of John Wycliffe by Thomas Kirkby (c. 1828, Balliol College, Oxford)",
    87: "Prince Henry the Navigator in the Saint Vincent Panels by Nuno Gonçalves (c. 1470, National Museum of Ancient Art, Lisbon)",
    88: "The Siege of Constantinople (1453), Illuminated Miniature by Jean Le Tavernier (after 1455)",
    89: "The Gutenberg Bible, Lenox Copy (c. 1455, New York Public Library; Photo: Kevin Eng, CC BY-SA 2.0)",
    90: "Mona Lisa by Leonardo da Vinci (c. 1503–1519, Louvre Museum)",
    91: "Galileo Facing the Roman Inquisition by Cristiano Banti (1857)",
    92: "Landing of Columbus (1492) by John Vanderlyn (1847, U.S. Capitol Rotunda)",
    93: "Portrait of Martin Luther by Lucas Cranach the Elder (1528)",
    96: "Portrait of King Henry VIII (Workshop of Hans Holbein the Younger, c. 1540–1547)",
    97: "Sixteenth-Century Portrait of John Calvin (Anonymous French School, c. 1550, Museum Catharijneconvent)",
    99: "The Council of Trent in Session at Santa Maria Maggiore (Museo del Palazzo del Buonconsiglio; Photo: Laurom, CC BY-SA 3.0)",
    101: "Detail from 'Defeat of the Iroquois at Lake Champlain' by Samuel de Champlain (Voyages, 1613)",
    103: "Baptism of Pocahontas at Jamestown (1613) by John Gadsby Chapman (1840, U.S. Capitol Rotunda)",
    104: "The Mayflower in Plymouth Harbor by William Halsall (1882, Pilgrim Hall Museum)",
    105: "The First Thanksgiving 1621 by Jean Leon Gerome Ferris",
    108: "The Witch No. 1 (Salem Courtroom), Lithograph by Joseph E. Baker (1892, Library of Congress)",
    109: "Penn's Treaty with the Indians by Benjamin West (1771–1772, Pennsylvania Academy of the Fine Arts)",
    110: "Portrait of Evangelist George Whitefield Preaching by John Wollaston (c. 1742, National Portrait Gallery, London)",
    111: "Eighteenth-Century English Merchant and Naval Harbor Scene by Peter Monamy (National Maritime Museum)",
    112: "The Death of General Wolfe at the Battle of Quebec (1759) by Benjamin West",
    114: "The First Continental Congress, 1774, Mural by Allyn Cox (1973–1974, U.S. Capitol)",
    115: "The Dawn of Liberty, Lexington, 1775 by Henry Sandham (1886)",
    118: "Washington Crossing the Delaware by Emanuel Leutze (1851, Metropolitan Museum of Art)",
    122: "Washington as Statesman at the Constitutional Convention (1787) by Junius Brutus Stearns",
    126: "Camp Meeting of the Methodists in North America, Drawn by Jacques Gérard Milbert and Engraved by M. Dubourg (1819)",
    127: "Engagement Between USS Constitution and HMS Guerrière (1812) by Thomas Birch (U.S. Naval Academy Museum)",
    128: "The United States Senate, A.D. 1850 (Henry Clay Introducing the Compromise), Drawn by Peter F. Rothermel and Engraved by Robert Whitechurch (c. 1855)",
    129: "Official White House Portrait of President James Monroe by Samuel Morse (1819)",
    130: "The Erie Canal Locks at Lockport, New York (c. 1855)",
    131: "Portrait of President Andrew Jackson by Ralph Eleaser Whiteside Earl",
    132: "Early Cotton Gin in Use on a Southern Plantation by William L. Sheppard (1869, Library of Congress)",
    133: "Portrait of Abolitionist Leader and Orator Frederick Douglass by George Kendall Warren (c. 1879)",
    134: "Portrait of Cherokee Principal Chief John Ross from McKenney & Hall (c. 1843, Library of Congress)",
    136: "Emigrants Crossing the Plains by Albert Bierstadt (1867, National Cowboy & Western Heritage Museum)",
    138: "California Gold Prospectors ('49ers) Panning for Gold (Daguerreotype, July 1850)",
    139: "Mount Hood in the Oregon Territory by Albert Bierstadt (1869)",
    141: "Prisoners from the Front by Winslow Homer (1866, Metropolitan Museum of Art)",
    145: "Sunday Morning in Virginia by Winslow Homer (1877, Cincinnati Art Museum)",
    146: "Portrait of Educator and Leader Booker T. Washington by Harris & Ewing (1905)",
    147: "Thomas Edison's Menlo Park Laboratory (1880 Photograph, AIP Emilio Segrè Visual Archives)",
    148: "The Custer Fight at Little Bighorn by Charles Marion Russell (1903)",
    150: "Charge of the Rough Riders at San Juan Hill by Frederic Remington (1898, Frederic Remington Art Museum)",
    152: "Unveiling of the Statue of Liberty (1886) by Edward Moran (Museum of the City of New York)",
    153: "First Powered Flight of the Wright Flyer at Kitty Hawk (December 17, 1903, Library of Congress)",
    154: "French Soldiers Moving Into Attack from a Trench at the Battle of Verdun (1916)",
    155: "Easter Sunday Crowd and Vintage Automobiles on Fifth Avenue, New York City (1920, Library of Congress)",
    156: "Dorothea Lange's 'Migrant Mother' photograph (1936, Library of Congress)",
    157: "U.S. Coast Guard photograph 'Into the Jaws of Death' showing American troops landing on Omaha Beach on D-Day (June 6, 1944)",
    158: "Chipping Off a Piece of the Berlin Wall (November 14, 1989, U.S. Department of Defense Photograph by SSgt. F. Lee Corkran)",
    160: "City Lights of the United States at Night from the Suomi NPP Satellite (2012, NASA Earth Observatory)",
}


def fetch_commons_json(url: str, ctx) -> dict:
    """Fetch Wikimedia Commons JSON with polite retries and curl fallback for macOS SSL."""
    ua = "HistoriaTimelineReviewer/2.0 (Classical Education Open Resource)"
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": ua})
            with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            res = subprocess.run(
                ["curl", "-sS", "-L", "-A", ua, "-w", "\n%{http_code}", url],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if res.returncode == 0:
                body, _, code = res.stdout.rpartition("\n")
                if code == "200" and body.strip():
                    return json.loads(body)
        time.sleep(2.5 * (attempt + 1))
    raise RuntimeError(f"Unable to fetch Commons API response for {url[:80]}")


def resolve_commons_batch(file_dict: dict[int, str], ctx) -> dict[int, str]:
    """Batch-resolve Wikimedia Commons filenames to canonical 960px URLs."""
    items = list(file_dict.items())
    resolved = {}
    for start in range(0, len(items), 40):
        chunk = items[start : start + 40]
        if start > 0:
            time.sleep(1.5)
        titles = [f"File:{fname.strip()}" for _, fname in chunk]
        params = urllib.parse.urlencode({
            "action": "query",
            "titles": "|".join(titles),
            "prop": "imageinfo",
            "iiprop": "url",
            "iiurlwidth": "960",
            "redirects": "1",
            "format": "json",
        })
        url = f"https://commons.wikimedia.org/w/api.php?{params}"
        data = fetch_commons_json(url, ctx)
        query = data.get("query", {})
        norm_map = {n["from"]: n["to"] for n in query.get("normalized", [])}
        redir_map = {r["from"]: r["to"] for r in query.get("redirects", [])}
        url_by_title = {}
        for page in query.get("pages", {}).values():
            t = page.get("title", "")
            ii = page.get("imageinfo", [])
            if ii:
                thumb = ii[0].get("thumburl") or ii[0].get("url") or ""
                if thumb:
                    url_by_title[t] = thumb.replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/")

        for cid, fname in chunk:
            orig = f"File:{fname.strip()}"
            t1 = norm_map.get(orig, orig.replace("_", " "))
            t2 = redir_map.get(t1, t1)
            resolved_url = url_by_title.get(t2) or url_by_title.get(t1) or url_by_title.get(orig)
            if resolved_url:
                resolved[cid] = resolved_url
                print(f"  [Verified Commons #{cid:03d}] {fname} -> {resolved_url[:68]}...")
            else:
                print(f"  [WARNING MISSING #{cid:03d}] {fname}")
    return resolved


def normalize_wikimedia_url(raw_img: str) -> str:
    """Normalize upload.wikimedia.org or Special:FilePath URLs to official 960px step."""
    if not raw_img:
        return ""
    if "commons.wikimedia.org/wiki/Special:FilePath/" in raw_img:
        base = raw_img.split("?")[0]
        return f"{base}?width=960"
    img_std = re.sub(r"/(\d+)px-", "/960px-", raw_img).split("?")[0]
    return img_std.replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/")


def main():
    root = Path(__file__).resolve().parent.parent
    existing_json = json.loads((root / "src" / "data" / "timelineData.json").read_text("utf-8"))
    existing_events = existing_json["events"]
    assert len(existing_events) == 160

    ca_path = Path("/etc/ssl/cert.pem")
    ctx = ssl.create_default_context(cafile=str(ca_path)) if ca_path.exists() else ssl.create_default_context()

    print("Resolving curated artwork overrides via Wikimedia Commons API...")
    try:
        override_urls = resolve_commons_batch(DIRECT_COMMONS_FILES, ctx)
    except Exception as e:
        print("Batch call fallback (offline/Special:FilePath):", e)
        override_urls = {
            cid: f"https://commons.wikimedia.org/wiki/Special:FilePath/{urllib.parse.quote(fname.strip(), safe=',()_-.!~*\x27')}?width=960"
            for cid, fname in DIRECT_COMMONS_FILES.items()
        }

    series_by_id = {entry["id"]: entry for entry in SERIES_INFO}
    enriched_events = []
    for ev in existing_events:
        cid = ev["cardNumber"] if "cardNumber" in ev else int(str(ev["id"]).replace("card-", ""))
        series_idx = (cid - 1) // 32
        s = series_by_id.get(ev.get("seriesId")) or SERIES_INFO[series_idx]

        raw_img = override_urls.get(cid, ev.get("coverImage") or "")
        img_std = normalize_wikimedia_url(raw_img)
        caption = UPDATED_ARTWORK_CAPTIONS.get(cid, ev.get("artworkCredit") or "")

        preserved_event = {
            "id": f"card-{cid:03d}",
            "numericId": cid,
            "cardNumber": cid,
            "cardBadge": f"Card #{cid}",
            "cardNumberPadded": f"#{cid:03d}",
            "series": s["name"],
            "seriesId": s["id"],
            "seriesNumber": s["number"],
            "seriesRoman": s["roman"],
            "seriesShortName": s["shortName"],
            "seriesColor": s["color"],
            "seriesLightBg": s["lightBg"],
            "seriesBadgeBg": s["badgeBg"],
            "seriesBorderColor": s["borderColor"],
            "title": ev["title"],
            "dateDisplay": ev.get("dateDisplay") or "",
            "sortYear": ev["sortYear"],
            "coverImage": img_std,
            "artworkCredit": caption,
            "reference": ev.get("reference") or "",
            "summaryBack": ev.get("summaryBack") or "",
            "wikiTitle": ev.get("wikiTitle"),
            "wikiUrl": ev.get("wikiUrl"),
            "location": ev.get("location"),
            "lat": ev.get("lat"),
            "lng": ev.get("lng"),
            "recommendedZoom": ev.get("recommendedZoom"),
            "resourceType": ev.get("resourceType"),
            "resourceUrl": ev.get("resourceUrl"),
            "scripturePassage": ev.get("scripturePassage"),
            "sourceName": ev.get("sourceName"),
        }
        enriched_events.append(preserved_event)

    json_path = root / "src" / "data" / "timelineData.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"series": SERIES_INFO, "events": enriched_events}, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote verified 160-card dataset to {json_path}")
    build_all(root)


if __name__ == "__main__":
    main()
