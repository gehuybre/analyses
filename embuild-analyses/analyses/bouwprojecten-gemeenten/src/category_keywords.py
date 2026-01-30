"""
Category keyword mappings for classifying projects.

Each category has:
- id: unique identifier
- label: display name
- keywords: list of keywords to match in project descriptions
"""

CATEGORY_DEFINITIONS = {
    "wegenbouw": {
        "id": "wegenbouw",
        "label": "wegenbouw & infrastructuur",
        "keywords": [
            "weg", "straat", "voetpad", "fietspad", "brug", "rijweg",
            "asfalt", "verharding", "verkeers", "parking", "parkeer",
            "rotonde", "kruispunt", "viaduct", "tunnel", "onderdoorgang",
            "oversteek", "zebrapad", "mobiliteit", "infrastructuur"
        ]
    },
    "riolering": {
        "id": "riolering",
        "label": "riolering & waterbeheer",
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
        "label": "sportinfrastructuur",
        "keywords": [
            "sport", "sportzaal", "voetbal", "zwembad", "atletiek",
            "tennisbaan", "sporthal", "fitnessruimte", "sportinfra",
            "sportterrein", "speelveld", "sportcomplex", "sportveld",
            "petanque", "skatepark"
        ]
    },
    "cultuur": {
        "id": "cultuur",
        "label": "culturele infrastructuur",
        "keywords": [
            "cultu", "bibliotheek", "museum", "gemeenschapscentrum",
            "jeugdhuis", "theater", "erfgoed", "monument", "kunstcent",
            "zaal", "feestzaal", "cultureel centrum", "historic",
            "herbestemming", "restauratie", "kapel", "evenement", "evenementen", "toerisme", "toeristische", "vrijetijd"
        ]
    },
    "gebouwen": {
        "id": "gebouwen",
        "label": "administratieve & publieke gebouwen",
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
        "label": "organisatie, werking & materieel",
        "keywords": [
            "werking", "ondersteunen", "ondersteuning", "dienst", "diensten",
            "dienstverlening", "materiaal", "materieel", "voertuig", "voertuigen",
            "magazijn", "garage", "uitrusting", "gereedschap", "onderhoud", "beheer",
            "medewerkers", "personeel", "hr", "ict", "digitaal", "digitale", "communicatie", "subsidie", "subsidies", "verenigingen", "financieel", "financiële", "middelen", "interne", "klantgericht"
        ]
    },

    "veiligheid": {
        "id": "veiligheid",
        "label": "openbare orde & veiligheid",
        "keywords": [
            "politie", "hulpverleningszone", "veiligheid", "kazerne", "nooddiensten",
            "hulpdienst", "brandweer"
        ]
    },
    "verlichting": {
        "id": "verlichting",
        "label": "straatverlichting & signalisatie",
        "keywords": [
            "straatverlichting", "verlichtingstoestel", "verkeerslicht",
            "signalisatie", "led", "lichtmast", "openbare verlichting",
            "verkeersbordenplan", "bebording", "verkeerssignalisatie"
        ]
    },
    "groen": {
        "id": "groen",
        "label": "groene ruimte & parken",
        "keywords": [
            "park", "groen", "natuur", "beplanting", "begraafplaats",
            "speeltuin", "recreatie", "wandelpad", "bos", "plantso",
            "bomen", "groenvoorziening", "natuurgebied", "recreatiedomein",
            "kerkhof", "begraafwezen"
        ]
    },
    "ruimtelijke-ordening": {
        "id": "ruimtelijke-ordening",
        "label": "ruimtelijke ordening & gebiedsontwikkeling",
        "keywords": [
            "ruimtelijke", "herinrichting", "gebiedsontwikkeling",
            "stadsvernieuwing", "brownfield", "ruimtelijke ordening",
            "stedenbouw", "onteigening", "verkaveling", "bestemmingsplan"
        ]
    },
    "zorg": {
        "id": "zorg",
        "label": "sociale infrastructuur & zorg",
        "keywords": [
            "woonzorgcentrum", "rusthuis", "zorg", "kinderopvang", "crèche",
            "wzc", "rustord", "woonzorg", "dagverzorging", "opvang",
            "sociale", "welzijn", "voedsel", "voedselverdeling", "sociaal huis",
            "jeugd", "participatie", "kwetsbaar", "kwetsbare"
        ]
    }
}


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
