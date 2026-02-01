"""
Category mappings for classifying projects.

Supports two classification methods:
1. Policy-based: Uses Beleidsdomein/Beleidssubdomein from data-54.csv
2. Keyword-based: Falls back to keyword matching in project descriptions (legacy)

Each category has:
- id: unique identifier
- label: display name
- keywords: list of keywords to match in project descriptions (legacy)
- policy_domains: mapping of Beleidsdomein codes to subdomains (policy-based)
"""

# Policy domain to category mapping
# Maps both full Beleidssubdomein text and numeric codes to project categories
# Priority is given to full text matches over numeric code prefixes
POLICY_DOMAIN_MAPPING = {
    # WEGENBOUW (Mobility & Transportation) - 02 domain
    "02 Zich verplaatsen en mobiliteit": "wegenbouw",
    "02": "wegenbouw",

    # RIOLERING (Water Management) - 031
    "031 Waterbeheer": "riolering",
    "031": "riolering",
    "03 Natuur en milieubeheer": "groen",
    "03": "groen",

    # GROENE RUIMTE & NATUUR (Green Space & Environment)
    "068 Groene ruimte": "groen",
    "068": "groen",
    "034 Bescherming van biodiversiteit, landschappen en bodem": "groen",
    "034": "groen",
    "030 Afval- en materialenbeheer": "groen",
    "030": "groen",
    "032 Vermindering van de milieuverontreiniging": "groen",
    "032": "groen",
    "035 Klimaat en energie": "gebouwen",  # Energy efficiency buildings
    "035": "gebouwen",
    "038/9 Overige milieubescherming": "groen",
    "038": "groen",
    "039": "groen",

    # BEGRAAFPLAATSEN (Cemeteries - part of green space/cultural)
    "099 Begraafplaatsen, crematoria en lijkbezorging": "groen",
    "099": "groen",

    # CULTUUR (Culture & Recreation) - 07 domain
    "07 Cultuur en vrije tijd": "cultuur",
    "07": "cultuur",
    "070 Culturele instellingen": "cultuur",
    "070": "cultuur",
    "071 Evenementen": "cultuur",
    "071": "cultuur",
    "072 Erfgoed": "cultuur",
    "072": "cultuur",
    "073 Overig kunst- en cultuurbeleid": "cultuur",
    "073": "cultuur",
    "074 Sport": "sport",
    "074": "sport",
    "075 Jeugd": "zorg",  # Youth programs part of social care
    "075": "zorg",
    "079 Erediensten en niet-confessionele levensbeschouwelijke gemeenschappen": "cultuur",
    "079": "cultuur",
    "052 Toerisme": "cultuur",
    "052": "cultuur",

    # SCHOLENBOUW (Education) - 08 domain
    "08 Leren en onderwijs": "scholenbouw",
    "08": "scholenbouw",
    "080 Basisonderwijs": "scholenbouw",
    "080": "scholenbouw",
    "081 Secundair onderwijs": "scholenbouw",
    "081": "scholenbouw",
    "082 Deeltijds kunstonderwijs": "scholenbouw",
    "082": "scholenbouw",
    "083 Hoger en Volwassenenonderwijs": "scholenbouw",
    "083": "scholenbouw",
    "086 Ondersteunende diensten voor het onderwijs": "scholenbouw",
    "086": "scholenbouw",
    "087/8 Algemeen onderwijsbeleid": "scholenbouw",
    "087": "scholenbouw",
    "088": "scholenbouw",

    # ZORG (Social Care & Health) - 09 domain
    "09 Zorg en opvang": "zorg",
    "09": "zorg",
    "090 Sociaal beleid": "zorg",
    "090": "zorg",
    "091 Ziekte- en invaliditeit": "zorg",
    "091": "zorg",
    "093 Sociale huisvesting": "zorg",
    "093": "zorg",
    "094 Gezin en kinderen": "zorg",
    "094": "zorg",
    "095 Ouderen": "zorg",
    "095": "zorg",
    "098 Dienstverlening inzake volksgezondheid": "zorg",
    "098": "zorg",

    # VEILIGHEID (Safety & Security) - 04 domain
    "04 Veiligheidszorg": "veiligheid",
    "04": "veiligheid",
    "040 Politiediensten": "veiligheid",
    "040": "veiligheid",
    "041 Brandweer": "veiligheid",
    "041": "veiligheid",
    "042/4 Overige hulpdiensten": "veiligheid",
    "042": "veiligheid",
    "045/9 Overige elementen van openbare orde en veiligheid": "veiligheid",
    "045": "veiligheid",

    # RUIMTELIJKE ORDENING (Spatial Planning) - 06 domain
    "06 Wonen en ruimtelijke ordening": "gebouwen",
    "06": "gebouwen",
    "060 Ruimtelijke planning": "ruimtelijke-ordening",
    "060": "ruimtelijke-ordening",
    "061 Gebiedsontwikkeling": "ruimtelijke-ordening",
    "061": "ruimtelijke-ordening",

    # VERLICHTING (Lighting) - 067
    "067 Straatverlichting": "verlichting",
    "067": "verlichting",

    # GEBOUWEN (Buildings & Utilities) - 062, utilities
    "062 Woonbeleid": "gebouwen",
    "062": "gebouwen",
    "063 Watervoorziening": "gebouwen",
    "063": "gebouwen",
    "064 Elektriciteitsvoorziening": "gebouwen",
    "064": "gebouwen",
    "065 Gasvoorziening": "gebouwen",
    "065": "gebouwen",
    "066 Communicatievoorzieningen": "gebouwen",
    "066": "gebouwen",
    "069 Overige nutsvoorzieningen": "gebouwen",
    "069": "gebouwen",

    # WERKING (Organization, Operations & Administration) - 0X domain
    "00 Algemene financiering": "werking",
    "00": "werking",
    "010 Politieke organen": "werking",
    "010": "werking",
    "011 Algemene diensten": "werking",
    "011": "werking",
    "013 Administratieve dienstverlening": "werking",
    "013": "werking",
    "015 Internationale samenwerking": "werking",
    "015": "werking",
    "016 Hulp aan het buitenland": "werking",
    "016": "werking",
    "017 Binnengemeentelijke decentralisatie": "werking",
    "017": "werking",
    "019 Overig algemeen bestuur": "werking",
    "019": "werking",

    # ECONOMIE & LANDBOUW (Economic Affairs - mapped to werking as support functions)
    "050 Handel en middenstand": "werking",
    "050": "werking",
    "051 Nijverheid": "werking",
    "051": "werking",
    "053 Land-, tuin- en bosbouw": "werking",
    "053": "werking",
    "054 Visvangst": "werking",
    "054": "werking",
    "055 Werkgelegenheid": "werking",
    "055": "werking",
    "059 Overige economische zaken": "werking",
    "059": "werking",
}

CATEGORY_DEFINITIONS = {
    "wegenbouw": {
        "id": "wegenbouw",
        "label": "wegenbouw",
        "keywords": [
            "weg", "straat", "voetpad", "fietspad", "brug", "rijweg",
            "asfalt", "verharding", "verkeers", "parking", "parkeer",
            "rotonde", "kruispunt", "viaduct", "tunnel", "onderdoorgang",
            "oversteek", "zebrapad", "mobiliteit", "infrastructuur"
        ]
    },
    "riolering": {
        "id": "riolering",
        "label": "riolering",
        "keywords": [
            "riolering", "afvalwater", "zuivering", "waterloop", "drainage",
            "septische", "hemelwater", "riool", "waterzuivering", "gracht",
            "beek", "afvoer", "drainage", "waterbeheersing", "overstromings"
        ]
    },
    "scholenbouw": {
        "id": "scholenbouw",
        "label": "scholenbouw",
        "keywords": [
            "school", "basisonderwijs", "secundair onderwijs", "kleuterschool",
            "leslokaal", "onderwijsinfra", "schoolgebouw", "klaslokaal",
            "schoolplein", "kleuterklas"
        ]
    },
    "sport": {
        "id": "sport",
        "label": "sport",
        "keywords": [
            "sport", "sportzaal", "voetbal", "zwembad", "atletiek",
            "tennisbaan", "sporthal", "fitnessruimte", "sportinfra",
            "sportterrein", "speelveld", "sportcomplex", "sportveld",
            "petanque", "skatepark"
        ]
    },
    "cultuur": {
        "id": "cultuur",
        "label": "cultuur",
        "keywords": [
            "cultu", "bibliotheek", "museum", "gemeenschapscentrum",
            "jeugdhuis", "theater", "erfgoed", "monument", "kunstcent",
            "zaal", "feestzaal", "cultureel centrum", "historic",
            "herbestemming", "restauratie", "kapel", "evenement", "evenementen", "toerisme", "toeristische", "vrijetijd"
        ]
    },
    "gebouwen": {
        "id": "gebouwen",
        "label": "gebouwen",
        "keywords": [
            "gemeentehuis", "administratief centrum", "stadsgebouw",
            "dienstencentrum", "politiepost", "brandweer", "stadskantoor",
            "administratiegebouw", "kantoorruimte",
            "patrimonium", "patrimoniumbeheer", "verduurzaming", "verduurzamen",
            "renovatie", "renovaties", "energie-audit", "energiezuinig", "energie", "klimaat"
        ]
    },
    "werking": {
        "id": "werking",
        "label": "organisatie & werking",
        "keywords": [
            "werking", "ondersteunen", "ondersteuning", "dienst", "diensten",
            "dienstverlening", "materiaal", "materieel", "voertuig", "voertuigen",
            "magazijn", "garage", "uitrusting", "gereedschap", "onderhoud", "beheer",
            "medewerkers", "personeel", "hr", "ict", "digitaal", "digitale", "communicatie", "subsidie", "subsidies", "verenigingen", "financieel", "financiële", "middelen", "interne", "klantgericht"
        ]
    },

    "veiligheid": {
        "id": "veiligheid",
        "label": "veiligheid",
        "keywords": [
            "politie", "hulpverleningszone", "veiligheid", "kazerne", "nooddiensten",
            "hulpdienst", "brandweer"
        ]
    },
    "verlichting": {
        "id": "verlichting",
        "label": "verlichting",
        "keywords": [
            "straatverlichting", "verlichtingstoestel", "verkeerslicht",
            "signalisatie", "led", "lichtmast", "openbare verlichting",
            "verkeersbordenplan", "bebording", "verkeerssignalisatie"
        ]
    },
    "groen": {
        "id": "groen",
        "label": "groen",
        "keywords": [
            "park", "groen", "natuur", "beplanting", "begraafplaats",
            "speeltuin", "recreatie", "wandelpad", "bos", "plantso",
            "bomen", "groenvoorziening", "natuurgebied", "recreatiedomein",
            "kerkhof", "begraafwezen"
        ]
    },
    "ruimtelijke-ordening": {
        "id": "ruimtelijke-ordening",
        "label": "ruimtelijke ordening",
        "keywords": [
            "ruimtelijke", "herinrichting", "gebiedsontwikkeling",
            "stadsvernieuwing", "brownfield", "ruimtelijke ordening",
            "stedenbouw", "onteigening", "verkaveling", "bestemmingsplan"
        ]
    },
    "zorg": {
        "id": "zorg",
        "label": "zorg",
        "keywords": [
            "woonzorgcentrum", "rusthuis", "zorg", "kinderopvang", "crèche",
            "wzc", "rustord", "woonzorg", "dagverzorging", "opvang",
            "sociale", "welzijn", "voedsel", "voedselverdeling", "sociaal huis",
            "jeugd", "participatie", "kwetsbaar", "kwetsbare"
        ]
    }
}


def classify_project_by_policy_domain(beleidsdomein, beleidssubdomein=None):
    """
    Classify a project based on its policy domain (Beleidsdomein).

    This is the preferred method when policy category data is available.

    Args:
        beleidsdomein: The Beleidsdomein value (e.g., "06 Wonen en ruimtelijke ordening")
        beleidssubdomein: Optional Beleidssubdomein value for more precise categorization

    Returns:
        List of category IDs that match the policy domain
    """
    if not beleidsdomein:
        return ["overige"]

    categories = []

    # Try subdomain match first (most specific)
    if beleidssubdomein:
        # Try exact subdomain match
        if beleidssubdomein in POLICY_DOMAIN_MAPPING:
            category = POLICY_DOMAIN_MAPPING[beleidssubdomein]
            if category and category not in categories:
                categories.append(category)

        # Try subdomain prefix (e.g., "074" from "074 Sport")
        if not categories and beleidssubdomein:
            subdomain_prefix = beleidssubdomein.split()[0] if ' ' in beleidssubdomein else beleidssubdomein[:3]
            if subdomain_prefix in POLICY_DOMAIN_MAPPING:
                category = POLICY_DOMAIN_MAPPING[subdomain_prefix]
                if category and category not in categories:
                    categories.append(category)

    # If no subdomain classification, try domain
    if not categories:
        # Try exact domain match
        if beleidsdomein in POLICY_DOMAIN_MAPPING:
            category = POLICY_DOMAIN_MAPPING[beleidsdomein]
            if category and category not in categories:
                categories.append(category)

        # Try domain prefix (e.g., "06" from "06 Wonen en ruimtelijke ordening")
        if not categories and beleidsdomein:
            prefix = beleidsdomein.split()[0] if ' ' in beleidsdomein else beleidsdomein[:2]
            if prefix in POLICY_DOMAIN_MAPPING:
                category = POLICY_DOMAIN_MAPPING[prefix]
                if category and category not in categories:
                    categories.append(category)

    return categories if categories else ["overige"]


def classify_project(ac_short, ac_long):
    """
    Classify a project based on keywords in its short and long descriptions.

    Args:
        ac_short: Short description of the action
        ac_long: Long description of the action

    Returns:
        List of category IDs that match the project
    """
    text = f"{ac_short} {ac_long}".lower()
    categories = []

    for category_id, category_def in CATEGORY_DEFINITIONS.items():
        if any(keyword in text for keyword in category_def["keywords"]):
            categories.append(category_id)

    return categories if categories else ["overige"]


def get_category_label(category_id):
    """Get the display label for a category ID."""
    if category_id == "overige":
        return "Overige"
    return CATEGORY_DEFINITIONS.get(category_id, {}).get("label", category_id)


def get_category_emoji(category_id):
    """Emoji support removed; always return an empty string."""
    return ""


def summarize_projects_by_category(projects, top_n=5):
    """Summarize investments per category.

    Args:
        projects: list of project dicts produced by `process_projects` (must contain
                  'categories', 'total_amount', 'ac_code', 'ac_short', 'municipality', 'nis_code', 'yearly_amounts')
        top_n: number of top projects to include per category

    Returns:
        dict mapping category_id -> summary dict with keys:
            - id
            - label
            - project_count
            - total_amount
            - largest_projects: list of project summaries (sorted desc by amount)
    """
    import ast
    def _normalize_categories(raw):
        if raw is None:
            return ['overige']
        # Already a list/tuple
        if isinstance(raw, (list, tuple)):
            return list(raw) if raw else ['overige']
        # numpy array
        try:
            import numpy as _np
            if isinstance(raw, _np.ndarray):
                lst = raw.tolist()
                return lst if lst else ['overige']
        except Exception:
            pass
        # A string representation: try to parse as Python literal list
        if isinstance(raw, str):
            try:
                val = ast.literal_eval(raw)
                if isinstance(val, (list, tuple)):
                    return list(val) if val else ['overige']
                return [raw]
            except Exception:
                return [raw]
        # Fallback - wrap in list
        return [raw]

    # Collect projects per category
    cat_projects = {}
    for proj in projects:
        raw = proj.get('categories', [])
        cats = _normalize_categories(raw)
        for cat in cats:
            cat_projects.setdefault(cat, []).append(proj)

    # Ensure every known category is present
    all_cats = list(CATEGORY_DEFINITIONS.keys()) + ['overige']
    summaries = {}

    for cat_id in all_cats:
        plist = cat_projects.get(cat_id, [])
        total = round(sum(p.get('total_amount', 0) for p in plist), 2)
        count = len(plist)

        # Prepare largest projects (top_n)
        largest = sorted(plist, key=lambda p: p.get('total_amount', 0), reverse=True)[:top_n]
        largest_projects = []
        for p in largest:
            largest_projects.append({
                'ac_code': p.get('ac_code'),
                'ac_short': p.get('ac_short'),
                'municipality': p.get('municipality'),
                'nis_code': p.get('nis_code'),
                'total_amount': round(p.get('total_amount', 0), 2),
                'yearly_amounts': p.get('yearly_amounts', {}),
            })

        summaries[cat_id] = {
            'id': cat_id,
            'label': get_category_label(cat_id),
            'project_count': count,
            'total_amount': total,
            'largest_projects': largest_projects,
        }

    return summaries


def get_category_investment_summary(projects, category_id, top_n=5):
    """Convenience wrapper returning the summary for a single category."""
    return summarize_projects_by_category(projects, top_n=top_n).get(category_id, {
        'id': category_id,
        'label': get_category_label(category_id),
        'project_count': 0,
        'total_amount': 0,
        'largest_projects': []
    })


def generate_category_description(projects):
    """
    Generate a human-readable description of all project categories with counts.
    
    Args:
        projects: list of project dicts with 'categories' field
        
    Returns:
        str: Formatted description text for use in blog posts
    """
    summaries = summarize_projects_by_category(projects)
    
    # Define category order and short descriptions
    category_info = [
        ("wegenbouw", "wegen, straten, fietspaden, bruggen"),
        ("groen", "parken, natuurgebieden, recreatie"),
        ("zorg", "woonzorgcentra, rusthuizen, kinderopvang"),
        ("riolering", "riolering, afvalwater, drainage"),
        ("cultuur", "bibliotheken, gemeenschapscentra, musea"),
        ("sport", "sportzalen, voetbalvelden, zwembaden"),
        ("scholenbouw", "scholen, kleuterscholen, leslokalen"),
        ("verlichting", "straatverlichting, verkeerslichten"),
        ("ruimtelijke-ordening", "herinrichting, gebiedsontwikkeling"),
        ("gebouwen", "gemeentehuizen, administratieve centra"),
        ("veiligheid", "politie, brandweer, nooddiensten"),
        ("werking", "organisatie, materieel, dienstverlening"),
    ]
    
    lines = ["Projecten zijn automatisch ingedeeld in bouwsectoren op basis van projectbeschrijvingen:\n"]
    
    # Add categories with counts
    for cat_id, description in category_info:
        count = summaries.get(cat_id, {}).get('project_count', 0)
        if count > 0:
            label = summaries[cat_id]['label']
            # Format number with dot as thousands separator (Dutch style)
            count_formatted = f"{count:,}".replace(',', '.')
            lines.append(f"- **{label}** ({count_formatted} projecten) - {description}")
    
    # Add "overige" at the end
    overige_count = summaries.get('overige', {}).get('project_count', 0)
    if overige_count > 0:
        count_formatted = f"{overige_count:,}".replace(',', '.')
        lines.append(f"- **overige** ({count_formatted} projecten) - projecten die niet in bovenstaande categorieën passen")
    
    return '\n'.join(lines)
